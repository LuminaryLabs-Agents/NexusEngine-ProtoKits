import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const AGENT_COMMAND_BRIDGE_KIT_VERSION = "0.1.0";

const idOf = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;
const tickOf = (world) => Number(world?.__nexusClock?.frame ?? 0);

function createInitialState(options = {}) {
  const routes = Object.fromEntries(asList(options.routes).map(normalizeRoute).map((route) => [route.intent, route]));
  return { version: AGENT_COMMAND_BRIDGE_KIT_VERSION, routes, previews: {}, previewOrder: [], commits: [], rejections: [], lastReason: "initialized" };
}

function normalizeRoute(route = {}) {
  const intent = idOf(route.intent ?? route.id ?? route.action, "observe");
  return { intent, commandType: String(route.commandType ?? route.eventType ?? `agent.${intent}.command`), targetPath: route.targetPath ?? "targetId", payload: clone(route.payload ?? {}), requiresAccepted: route.requiresAccepted !== false, metadata: clone(route.metadata ?? {}) };
}

function proposalId(proposal = {}) {
  return idOf(proposal.id ?? proposal.proposalId ?? `${proposal.agentId ?? "agent"}:${proposal.intent ?? proposal.action ?? "proposal"}`);
}

function acceptedProposal(proposal = {}) {
  if (proposal.accepted === false) return false;
  if (proposal.validation?.ok === false) return false;
  if (proposal.policy?.ok === false) return false;
  return true;
}

function commandFromRoute(route, proposal = {}, payload = {}) {
  return {
    id: payload.id ?? `agent-command:${proposalId(proposal)}`,
    type: payload.type ?? route.commandType,
    agentId: proposal.agentId ?? null,
    intent: route.intent,
    targetId: payload.targetId ?? proposal.targetId ?? proposal.objectId ?? proposal.entityId ?? null,
    proposalId: proposalId(proposal),
    payload: { ...clone(route.payload), ...clone(proposal.payload ?? {}), ...clone(payload.payload ?? {}) },
    metadata: { ...clone(route.metadata), ...clone(proposal.metadata ?? {}), ...clone(payload.metadata ?? {}) }
  };
}

export function createAgentCommandBridgeKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const AgentCommandBridgeState = resource(options.resourceName ?? "agentCommandBridge.state");
  const RouteRegistered = event("agentCommandBridge.routeRegistered");
  const CommandPreviewed = event("agentCommandBridge.previewed");
  const CommandCommitted = event("agentCommandBridge.committed");
  const CommandRejected = event("agentCommandBridge.rejected");
  const AgentCommandBridgeReset = event("agentCommandBridge.reset");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "agent-command-bridge-kit",
    resources: { AgentCommandBridgeState },
    events: { RouteRegistered, CommandPreviewed, CommandCommitted, CommandRejected, AgentCommandBridgeReset },
    requires: ["agent:proposal-validation", ...asList(options.requires)],
    provides: ["agent:command-bridge", "command:validated-agent-intent", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, AgentCommandBridgeState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, AgentCommandBridgeState, () => createInitialState(options));
      const publish = (next) => { world.setResource(AgentCommandBridgeState, next); return clone(next); };
      const reject = (next, proposal, reason, payload = {}) => {
        const rejection = { id: payload.id ?? `agent-command-rejection-${next.rejections.length + 1}`, proposalId: proposalId(proposal), reason, proposal: clone(proposal), rejectedAtTick: tickOf(world) };
        next.rejections = [rejection, ...next.rejections].slice(0, Number(options.rejectionLimit ?? 64));
        next.lastReason = reason;
        publish(next);
        world.emit(CommandRejected, { rejection: clone(rejection) });
        return clone({ accepted: false, reason, rejection });
      };
      engine[options.apiName ?? "agentCommandBridge"] = {
        resources: { AgentCommandBridgeState },
        events: { RouteRegistered, CommandPreviewed, CommandCommitted, CommandRejected, AgentCommandBridgeReset },
        registerRoute(intent, commandSpec = {}) {
          const next = state();
          const route = normalizeRoute({ ...commandSpec, intent });
          next.routes[route.intent] = route;
          next.lastReason = "route-registered";
          publish(next);
          world.emit(RouteRegistered, { route: clone(route) });
          return clone(route);
        },
        preview(proposal = {}, payload = {}) {
          const next = state();
          const policy = payload.policy ?? (engine.agentPolicy?.validateProposal ? engine.agentPolicy.validateProposal(proposal, payload.context ?? {}) : null);
          const proposalWithPolicy = policy ? { ...proposal, policy } : proposal;
          if (!acceptedProposal(proposalWithPolicy)) return reject(next, proposalWithPolicy, policy?.reason ?? "proposal-not-accepted", payload);
          const intent = idOf(proposalWithPolicy.intent ?? proposalWithPolicy.action ?? proposalWithPolicy.act, "");
          const route = next.routes[intent];
          if (!route) return reject(next, proposalWithPolicy, "missing-command-route", payload);
          const command = commandFromRoute(route, proposalWithPolicy, payload);
          const preview = { id: payload.previewId ?? `agent-command-preview-${next.previewOrder.length + 1}`, proposalId: proposalId(proposalWithPolicy), route: clone(route), command, policy: clone(policy), previewedAtTick: tickOf(world) };
          next.previews[preview.proposalId] = preview;
          next.previewOrder = [preview.proposalId, ...next.previewOrder.filter((id) => id !== preview.proposalId)].slice(0, Number(options.previewLimit ?? 64));
          next.lastReason = "command-previewed";
          publish(next);
          world.emit(CommandPreviewed, { preview: clone(preview) });
          return clone({ accepted: true, preview });
        },
        commit(proposalOrId, payload = {}) {
          const next = state();
          const id = typeof proposalOrId === "string" ? proposalOrId : proposalId(proposalOrId);
          let preview = next.previews[id];
          if (!preview && typeof proposalOrId === "object") {
            const result = this.preview(proposalOrId, payload);
            if (!result.accepted) return result;
            preview = result.preview;
          }
          if (!preview) return reject(next, { id }, "missing-preview", payload);
          const commit = { id: payload.commitId ?? `agent-command-commit-${next.commits.length + 1}`, proposalId: id, command: clone(preview.command), committedAtTick: tickOf(world), metadata: clone(payload.metadata ?? {}) };
          next.commits = [commit, ...next.commits].slice(0, Number(options.commitLimit ?? 128));
          next.lastReason = "command-committed";
          publish(next);
          world.emit(CommandCommitted, { commit: clone(commit), command: clone(commit.command) });
          return clone({ accepted: true, commit });
        },
        reject(proposalOrId, reason = "rejected", payload = {}) { const next = state(); return reject(next, typeof proposalOrId === "string" ? { id: proposalOrId } : proposalOrId, reason, payload); },
        getState() { return clone(state()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(AgentCommandBridgeState, next); world.emit(AgentCommandBridgeReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: AGENT_COMMAND_BRIDGE_KIT_VERSION, domain: "agent-command-bridge", extendsBase: "DomainServiceKit", ownsLoop: false, purpose: "Converts accepted agent proposals into whitelisted command packets.", boundary: "Owns proposal-to-command routing and trace events. Does not call object APIs or renderers directly." }
  });
}

export default createAgentCommandBridgeKit;
