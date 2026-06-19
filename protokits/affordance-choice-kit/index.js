export const AFFORDANCE_CHOICE_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const idOf = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`createAffordanceChoiceKit requires NexusRealtime.${key}.`);
  }
}

function normalizeAction(action = {}, index = 0) {
  const id = idOf(action.id ?? action.label ?? action.intent, `action-${index + 1}`);
  return {
    id,
    label: String(action.label ?? id),
    intent: String(action.intent ?? id),
    type: String(action.type ?? "agent.intent"),
    enabled: action.enabled !== false,
    targetId: action.targetId == null ? null : String(action.targetId),
    targetTypes: asArray(action.targetTypes).map(String),
    roles: asArray(action.roles).map(String),
    requiresFacts: asArray(action.requiresFacts).map(String),
    blockedByFacts: asArray(action.blockedByFacts).map(String),
    requiresVisibleTarget: action.requiresVisibleTarget !== false,
    priority: number(action.priority, index),
    payload: clone(action.payload ?? {}),
    metadata: clone(action.metadata ?? {})
  };
}

function initialState(config = {}) {
  const actions = asArray(config.actions).map(normalizeAction);
  return {
    version: AFFORDANCE_CHOICE_KIT_VERSION,
    actions: Object.fromEntries(actions.map((action) => [action.id, action])),
    packets: [],
    choices: [],
    rejections: []
  };
}

function factIds(context = {}) {
  return new Set([
    ...asArray(context.facts).map((fact) => typeof fact === "string" ? fact : String(fact.id ?? fact.text ?? fact.type ?? "")),
    ...asArray(context.facts).map((fact) => typeof fact === "string" ? fact : String(fact.text ?? "")),
    ...asArray(context.socialFacts).map((fact) => typeof fact === "string" ? fact : String(fact.id ?? fact.text ?? fact.type ?? "")),
    ...asArray(context.socialFacts).map((fact) => typeof fact === "string" ? fact : String(fact.text ?? ""))
  ].filter(Boolean));
}

function targetVisible(action, observation) {
  if (!action.targetId || action.requiresVisibleTarget === false) return true;
  return asArray(observation?.visibleEntityIds).includes(action.targetId) || asArray(observation?.visibleEntities).some((entity) => entity.id === action.targetId);
}

function roleAllowed(action, agent = {}) {
  if (!action.roles.length) return true;
  return action.roles.includes(String(agent.role ?? ""));
}

function actionAllowed(action, context = {}) {
  if (!action.enabled) return { ok: false, reason: "action-disabled" };
  const facts = factIds(context);
  for (const fact of action.requiresFacts) if (!facts.has(fact)) return { ok: false, reason: `missing-fact:${fact}` };
  for (const fact of action.blockedByFacts) if (facts.has(fact)) return { ok: false, reason: `blocked-by-fact:${fact}` };
  if (!roleAllowed(action, context.agent ?? context.observation?.agent)) return { ok: false, reason: "role-not-allowed" };
  if (!targetVisible(action, context.observation)) return { ok: false, reason: "target-not-visible" };
  return { ok: true, reason: "legal" };
}

function scoreOf(scoreMap = {}, action) {
  if (Array.isArray(scoreMap)) {
    const hit = scoreMap.find((entry) => entry.id === action.id || entry.label === action.label || entry.intent === action.intent);
    return number(hit?.score, null);
  }
  return number(scoreMap[action.id] ?? scoreMap[action.label] ?? scoreMap[action.intent], null);
}

export function createAffordanceChoiceKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const ChoiceState = defineResource(config.resourceName ?? "affordanceChoice.state");
  const ActionRegistered = defineEvent("affordanceChoice.actionRegistered");
  const PacketBuilt = defineEvent("affordanceChoice.packetBuilt");
  const ChoiceCommitted = defineEvent("affordanceChoice.choiceCommitted");
  const ChoiceRejected = defineEvent("affordanceChoice.choiceRejected");
  const Reset = defineEvent("affordanceChoice.reset");

  return defineRuntimeKit({
    id: config.kitId ?? "affordance-choice-kit",
    requires: config.requires ?? [],
    provides: ["agent:legal-actions", "agent:choice-packets", "agent:choice-validation"],
    resources: { ChoiceState },
    events: { ActionRegistered, PacketBuilt, ChoiceCommitted, ChoiceRejected, Reset },
    systems: [],
    initWorld({ world }) { world.setResource(ChoiceState, initialState(config)); },
    install({ engine, world }) {
      engine.agentChoices = {
        resources: { ChoiceState },
        events: { ActionRegistered, PacketBuilt, ChoiceCommitted, ChoiceRejected, Reset },
        registerAction(action = {}) {
          const state = world.getResource(ChoiceState) ?? initialState(config);
          const normalized = normalizeAction(action, Object.keys(state.actions).length);
          world.setResource(ChoiceState, { ...state, actions: { ...state.actions, [normalized.id]: normalized } });
          world.emit(ActionRegistered, { actionId: normalized.id, action: normalized });
          return clone(normalized);
        },
        setActionEnabled(actionId, enabled, reason = "set-enabled") {
          const state = world.getResource(ChoiceState) ?? initialState(config);
          const action = state.actions[actionId];
          if (!action) return null;
          const next = { ...action, enabled: Boolean(enabled), lastReason: reason };
          world.setResource(ChoiceState, { ...state, actions: { ...state.actions, [actionId]: next } });
          return clone(next);
        },
        getLegalActions(agentId, context = {}) {
          const observation = context.observation ?? engine.perception?.observe?.(agentId, context.perception ?? {}) ?? null;
          const socialFacts = context.socialFacts ?? engine.socialFacts?.queryFacts?.({ entityId: agentId }) ?? [];
          const agent = context.agent ?? observation?.agent ?? engine.agents?.getAgent?.(agentId) ?? { id: agentId };
          const fullContext = { ...context, agentId, agent, observation, facts: context.facts ?? observation?.facts ?? [], socialFacts };
          return clone(Object.values(world.getResource(ChoiceState)?.actions ?? {}).filter((action) => actionAllowed(action, fullContext).ok).sort((a, b) => a.priority - b.priority));
        },
        buildChoicePacket(agentId, context = {}) {
          const observation = context.observation ?? engine.perception?.observe?.(agentId, context.perception ?? {}) ?? null;
          const socialFacts = context.socialFacts ?? engine.socialFacts?.queryFacts?.({ entityId: agentId }) ?? [];
          const agent = context.agent ?? observation?.agent ?? engine.agents?.getAgent?.(agentId) ?? { id: agentId };
          const fullContext = { ...context, agentId, agent, observation, facts: context.facts ?? observation?.facts ?? [], socialFacts };
          const legalActions = Object.values(world.getResource(ChoiceState)?.actions ?? {}).filter((action) => actionAllowed(action, fullContext).ok).sort((a, b) => a.priority - b.priority);
          const packet = {
            id: `choice-packet-${world.getResource(ChoiceState)?.packets?.length + 1}`,
            agentId,
            builtAtTick: world.__nexusClock?.frame ?? 0,
            observation: clone(observation),
            observationText: observation?.text ?? "",
            socialFacts: clone(socialFacts),
            legalActions: clone(legalActions),
            actionLabels: legalActions.map((action) => action.label)
          };
          const state = world.getResource(ChoiceState) ?? initialState(config);
          world.setResource(ChoiceState, { ...state, packets: [packet, ...state.packets].slice(0, 32) });
          world.emit(PacketBuilt, packet);
          return clone(packet);
        },
        chooseFromScores(agentId, scores = {}, context = {}) {
          const packet = context.packet ?? this.buildChoicePacket(agentId, context);
          const ranked = packet.legalActions.map((action) => ({ action, score: scoreOf(scores, action) ?? 0 })).sort((a, b) => b.score - a.score || a.action.priority - b.action.priority);
          return ranked[0] ? { agentId, actionId: ranked[0].action.id, action: clone(ranked[0].action), score: ranked[0].score, packetId: packet.id } : null;
        },
        commitChoice(agentId, choice = {}, context = {}) {
          const state = world.getResource(ChoiceState) ?? initialState(config);
          const actionId = idOf(choice.actionId ?? choice.id ?? choice.action?.id, "");
          const action = state.actions[actionId];
          if (!action) {
            const rejection = { agentId, actionId, reason: "unknown-action" };
            world.setResource(ChoiceState, { ...state, rejections: [rejection, ...state.rejections].slice(0, 32) });
            world.emit(ChoiceRejected, rejection);
            return clone({ accepted: false, ...rejection });
          }
          const observation = context.observation ?? engine.perception?.observe?.(agentId, context.perception ?? {}) ?? null;
          const validation = actionAllowed(action, { ...context, agentId, observation, facts: context.facts ?? observation?.facts ?? [], socialFacts: context.socialFacts ?? engine.socialFacts?.queryFacts?.({ entityId: agentId }) ?? [] });
          if (!validation.ok) {
            const rejection = { agentId, actionId, reason: validation.reason };
            world.setResource(ChoiceState, { ...state, rejections: [rejection, ...state.rejections].slice(0, 32) });
            world.emit(ChoiceRejected, rejection);
            return clone({ accepted: false, ...rejection });
          }
          const proposal = { type: action.type, agentId, intent: action.intent, actionId, targetId: choice.targetId ?? action.targetId, confidence: number(choice.score, number(choice.confidence, 1)), reason: choice.reason ?? "affordance-choice", actions: [{ type: action.type, actionId, targetId: choice.targetId ?? action.targetId, payload: { ...action.payload, ...(choice.payload ?? {}) } }] };
          const accepted = engine.agents?.submitProposal ? engine.agents.submitProposal(agentId, proposal) : { accepted: true, proposal };
          const committed = { agentId, actionId, action: clone(action), proposal, accepted, committedAtTick: world.__nexusClock?.frame ?? 0 };
          world.setResource(ChoiceState, { ...state, choices: [committed, ...state.choices].slice(0, 32) });
          world.emit(ChoiceCommitted, committed);
          return clone(committed);
        },
        getState() { return clone(world.getResource(ChoiceState)); },
        reset(payload = {}) {
          const state = initialState({ ...config, ...payload });
          world.setResource(ChoiceState, state);
          world.emit(Reset, { reason: payload.reason ?? "reset" });
          return clone(state);
        }
      };
    },
    metadata: { purpose: "Builds legal action packets for agents, ranks model scores, and commits validated choices as agent proposals.", boundary: "Does not run ONNX itself and does not directly mutate world state." }
  });
}

export default createAffordanceChoiceKit;
