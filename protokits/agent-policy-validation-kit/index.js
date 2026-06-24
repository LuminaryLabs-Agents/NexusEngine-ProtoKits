import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const AGENT_POLICY_VALIDATION_KIT_VERSION = "0.1.0";

const idOf = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;
const tickOf = (world) => Number(world?.__nexusClock?.frame ?? 0);
const dangerousActionTypes = Object.freeze(["setResource", "resource.set", "renderer.mutate", "dom.mutate", "network.call", "unbounded.eval"]);

function createInitialState(options = {}) {
  return {
    version: AGENT_POLICY_VALIDATION_KIT_VERSION,
    rules: {
      allowedIntents: asList(options.allowedIntents).map(String),
      allowedActionTypes: asList(options.allowedActionTypes).map(String),
      knownTargets: asList(options.knownTargets).map((target) => typeof target === "string" ? target : String(target?.id ?? "")).filter(Boolean),
      minConfidence: number(options.minConfidence, 0),
      maxActions: number(options.maxActions, 6),
      requiredFacts: asList(options.requiredFacts).map(String),
      blockedActionTypes: [...dangerousActionTypes, ...asList(options.blockedActionTypes).map(String)]
    },
    evaluations: [],
    rejections: [],
    accepted: [],
    lastReason: "initialized"
  };
}

function factsFrom(context = {}) {
  return asList(context.facts ?? context.knownFacts ?? context.memory ?? context.memories).map((fact) => String(fact?.id ?? fact?.text ?? fact));
}

function validateAction(action = {}, rules = createInitialState().rules, context = {}) {
  const type = idOf(action.type ?? action.action ?? action.commandType, "");
  if (!type) return { ok: false, reason: "action-missing-type", action: clone(action) };
  if (rules.blockedActionTypes.includes(type)) return { ok: false, reason: "action-type-blocked", action: clone(action) };
  if (rules.allowedActionTypes.length && !rules.allowedActionTypes.includes(type)) return { ok: false, reason: "action-type-not-allowed", action: clone(action) };
  const targetId = action.targetId ?? action.objectId ?? action.entityId;
  if (targetId != null && rules.knownTargets.length && !rules.knownTargets.includes(String(targetId))) return { ok: false, reason: "unknown-target", action: clone(action) };
  const affordances = context.affordancesByTargetId?.[targetId] ?? context.affordances?.[targetId] ?? [];
  if (action.affordance && asList(affordances).length && !asList(affordances).includes(action.affordance)) return { ok: false, reason: "missing-affordance", action: clone(action) };
  return { ok: true, reason: "accepted", action: clone(action) };
}

function validateProposal(proposal = {}, rules = createInitialState().rules, context = {}) {
  const warnings = [];
  const intent = idOf(proposal.intent ?? proposal.action ?? proposal.act, "");
  if (!intent) warnings.push({ type: "missing-intent" });
  if (intent && rules.allowedIntents.length && !rules.allowedIntents.includes(intent)) warnings.push({ type: "intent-not-allowed", intent });
  if (number(proposal.confidence, 1) < rules.minConfidence) warnings.push({ type: "confidence-below-threshold", confidence: number(proposal.confidence, 0), minConfidence: rules.minConfidence });
  const targetId = proposal.targetId ?? proposal.objectId ?? proposal.entityId;
  if (targetId != null && rules.knownTargets.length && !rules.knownTargets.includes(String(targetId))) warnings.push({ type: "unknown-target", targetId });
  const facts = factsFrom(context);
  for (const fact of rules.requiredFacts) if (!facts.some((entry) => entry.includes(fact))) warnings.push({ type: "missing-required-fact", fact });
  const actions = asList(proposal.actions);
  if (actions.length > rules.maxActions) warnings.push({ type: "too-many-actions", count: actions.length, maxActions: rules.maxActions });
  const actionReports = actions.map((action) => validateAction(action, rules, context));
  for (const report of actionReports) if (!report.ok) warnings.push({ type: report.reason, action: report.action });
  return { ok: warnings.length === 0, reason: warnings[0]?.type ?? "accepted", intent, warnings, warningCount: warnings.length, actionReports, proposal: clone(proposal) };
}

export function createAgentPolicyValidationKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const AgentPolicyState = resource(options.resourceName ?? "agentPolicy.state");
  const ProposalEvaluated = event("agentPolicy.proposalEvaluated");
  const ProposalAccepted = event("agentPolicy.proposalAccepted");
  const ProposalRejected = event("agentPolicy.proposalRejected");
  const AgentPolicyReset = event("agentPolicy.reset");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "agent-policy-validation-kit",
    resources: { AgentPolicyState },
    events: { ProposalEvaluated, ProposalAccepted, ProposalRejected, AgentPolicyReset },
    requires: asList(options.requires),
    provides: ["agent:policy-validation", "agent:proposal-guard", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, AgentPolicyState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, AgentPolicyState, () => createInitialState(options));
      const publish = (next) => { world.setResource(AgentPolicyState, next); return clone(next); };
      engine[options.apiName ?? "agentPolicy"] = {
        resources: { AgentPolicyState },
        events: { ProposalEvaluated, ProposalAccepted, ProposalRejected, AgentPolicyReset },
        validateAction(action = {}, context = {}) { return validateAction(action, state().rules, context); },
        validateProposal(proposal = {}, context = {}) {
          const next = state();
          const report = { id: proposal.id ?? `policy-eval-${next.evaluations.length + 1}`, agentId: proposal.agentId ?? context.agentId ?? null, evaluatedAtTick: tickOf(world), ...validateProposal(proposal, next.rules, context) };
          next.evaluations = [report, ...next.evaluations].slice(0, Number(options.evaluationLimit ?? 128));
          if (report.ok) next.accepted = [report, ...next.accepted].slice(0, Number(options.acceptedLimit ?? 64));
          else next.rejections = [report, ...next.rejections].slice(0, Number(options.rejectionLimit ?? 64));
          next.lastReason = report.ok ? "proposal-accepted" : report.reason;
          publish(next);
          world.emit(ProposalEvaluated, { report: clone(report) });
          world.emit(report.ok ? ProposalAccepted : ProposalRejected, { report: clone(report) });
          return clone(report);
        },
        getRejections() { return clone(state().rejections); },
        getState() { return clone(state()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(AgentPolicyState, next); world.emit(AgentPolicyReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: AGENT_POLICY_VALIDATION_KIT_VERSION, domain: "agent-policy-validation", extendsBase: "DomainServiceKit", ownsLoop: false, purpose: "Shared proposal/action policy validation before command bridging.", boundary: "Owns agent proposal policy checks; does not commit gameplay commands." }
  });
}

export default createAgentPolicyValidationKit;
