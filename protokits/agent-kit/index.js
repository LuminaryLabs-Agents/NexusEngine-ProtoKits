export const AGENT_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toId = (value, fallback = "") => String(value ?? fallback).trim();

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createAgentKit requires NexusRealtime.${key}.`);
    }
  }
}

function createInitialState(config = {}) {
  const agents = Object.fromEntries(asArray(config.agents).map((agent, index) => normalizeAgent(agent, index)).map((agent) => [agent.id, agent]));
  return {
    version: AGENT_KIT_VERSION,
    id: toId(config.stateId, "agent-state"),
    agents,
    worldFacts: asArray(config.worldFacts).map(normalizeFact),
    mailbox: { requests: [], proposals: [], accepted: [], rejected: [], pending: [] },
    trace: [],
    tick: 0
  };
}

function normalizeAgent(agent = {}, index = 0) {
  const id = toId(agent.id, `agent-${index + 1}`);
  if (!id) throw new TypeError("Agent profiles require an id.");
  return {
    id,
    label: String(agent.label ?? agent.name ?? id),
    role: String(agent.role ?? "agent"),
    factionId: agent.factionId == null ? null : String(agent.factionId),
    goals: asArray(agent.goals).map(String),
    memory: asArray(agent.memory).map(normalizeFact),
    relationships: clone(agent.relationships ?? {}),
    traits: clone(agent.traits ?? {}),
    knownFacts: asArray(agent.knownFacts).map(normalizeFact),
    currentIntent: null,
    cooldowns: clone(agent.cooldowns ?? {}),
    metadata: clone(agent.metadata ?? {})
  };
}

function normalizeFact(fact) {
  if (typeof fact === "string") return { id: fact, text: fact, tags: [] };
  const id = toId(fact?.id ?? fact?.text ?? fact?.type, `fact-${Math.random().toString(36).slice(2)}`);
  return {
    id,
    type: String(fact?.type ?? "fact"),
    text: String(fact?.text ?? id),
    sourceId: fact?.sourceId == null ? null : String(fact.sourceId),
    targetId: fact?.targetId == null ? null : String(fact.targetId),
    tags: asArray(fact?.tags).map(String),
    value: clone(fact?.value ?? null)
  };
}

function trace(state, type, payload = {}) {
  return {
    ...state,
    trace: [{ type, payload: clone(payload), index: state.trace.length, tick: state.tick }, ...state.trace].slice(0, 80)
  };
}

function buildContextFromState(state, agentId, reason = "decision") {
  const agent = state.agents[agentId];
  if (!agent) return null;
  return {
    version: AGENT_KIT_VERSION,
    agentId,
    reason,
    agent: clone(agent),
    memory: clone(agent.memory),
    goals: clone(agent.goals),
    knownFacts: clone([...state.worldFacts, ...agent.knownFacts]),
    mailbox: clone(state.mailbox),
    validProposalTypes: ["dialogue.intent", "agent.intent", "quest.intent", "world.intent"],
    validIntents: ["observe", "talk", "warn", "accuse", "help", "ignore", "move", "guard", "investigate"]
  };
}

function validateProposal(state, proposal = {}, config = {}) {
  const agentId = toId(proposal.agentId);
  const agent = state.agents[agentId];
  if (!agent) return { ok: false, reason: "unknown-agent", proposal: clone(proposal) };
  const intent = toId(proposal.intent ?? proposal.action ?? proposal.act);
  if (!intent) return { ok: false, reason: "missing-intent", proposal: clone(proposal) };
  const allowedIntents = asArray(config.allowedIntents).map(String);
  if (allowedIntents.length && !allowedIntents.includes(intent)) return { ok: false, reason: "intent-not-allowed", proposal: clone(proposal) };
  const knownTargets = asArray(config.knownTargets).map((target) => typeof target === "string" ? target : String(target?.id ?? "")).filter(Boolean);
  if (proposal.targetId != null && knownTargets.length && !knownTargets.includes(String(proposal.targetId))) {
    return { ok: false, reason: "unknown-target", proposal: clone(proposal) };
  }
  const requiredMemory = proposal.requiredMemory == null ? null : String(proposal.requiredMemory);
  if (requiredMemory && !agent.memory.some((fact) => fact.id === requiredMemory || fact.text.includes(requiredMemory))) {
    return { ok: false, reason: "missing-required-memory", proposal: clone(proposal) };
  }
  for (const action of asArray(proposal.actions)) {
    if (!toId(action.type)) return { ok: false, reason: "action-missing-type", proposal: clone(proposal) };
  }
  return { ok: true, reason: "accepted", proposal: { ...clone(proposal), agentId, intent } };
}

function nextDecision(harness, request, state) {
  if (!harness || typeof harness.decide !== "function") return null;
  return harness.decide(request, clone(state));
}

export function createFakeAgentHarness(config = {}) {
  const cursors = new Map();
  return {
    id: config.id ?? "fake-agent-harness",
    mode: "fake",
    decide(request) {
      const agentId = request?.context?.agentId ?? request?.agentId;
      const source = config.decisions?.[agentId] ?? config.decisions?.default ?? config.decisions ?? [];
      const decisions = asArray(source);
      const cursor = cursors.get(agentId) ?? 0;
      const decision = clone(decisions[Math.min(cursor, Math.max(0, decisions.length - 1))] ?? config.fallback ?? { intent: "observe", reason: "no fake decision configured" });
      cursors.set(agentId, cursor + 1);
      return { type: "agent.proposal", agentId, confidence: 1, ...decision };
    }
  };
}

export function createScriptedAgentHarness(config = {}) {
  return {
    id: config.id ?? "scripted-agent-harness",
    mode: "scripted",
    decide(request) {
      const context = request.context ?? request;
      for (const rule of asArray(config.rules)) {
        const memoryNeedle = rule.when?.memoryIncludes;
        const goalNeedle = rule.when?.goalIncludes;
        const memoryOk = !memoryNeedle || context.memory?.some((fact) => fact.text?.includes(memoryNeedle) || fact.id === memoryNeedle);
        const goalOk = !goalNeedle || context.goals?.includes(goalNeedle);
        if (memoryOk && goalOk) return { type: "agent.proposal", agentId: context.agentId, confidence: rule.confidence ?? 0.9, ...(rule.propose ?? {}) };
      }
      return { type: "agent.proposal", agentId: context.agentId, confidence: 0.5, ...(config.fallback ?? { intent: "observe" }) };
    }
  };
}

export function createReplayAgentHarness(config = {}) {
  let cursor = 0;
  const recording = asArray(config.recording);
  return {
    id: config.id ?? "replay-agent-harness",
    mode: "replay",
    decide(request) {
      const entry = recording[cursor++] ?? recording[recording.length - 1] ?? { proposal: { intent: "observe" } };
      const proposal = clone(entry.proposal ?? entry);
      return { type: "agent.proposal", agentId: request.context?.agentId ?? proposal.agentId, confidence: proposal.confidence ?? 1, ...proposal };
    }
  };
}

export function createOnnxAgentHarness(config = {}) {
  return {
    id: config.id ?? "onnx-agent-harness",
    mode: "onnx",
    decide(request) {
      const context = request.context ?? request;
      const output = config.intentScores?.[context.agentId] ?? config.intentScores?.default ?? { observe: 1 };
      const [intent, score] = Object.entries(output).sort((a, b) => Number(b[1]) - Number(a[1]))[0] ?? ["observe", 1];
      return { type: "agent.proposal", agentId: context.agentId, intent, confidence: Number(score), reason: "onnx dry-run intent score", actions: config.actions?.[intent] ?? [] };
    }
  };
}

export function createLiveAgentHarness(config = {}) {
  return {
    id: config.id ?? "live-agent-harness",
    mode: "live",
    decide(request) {
      if (config.fallbackProposal) return { type: "agent.proposal", agentId: request.context?.agentId, ...clone(config.fallbackProposal) };
      return { type: "agent.proposal", agentId: request.context?.agentId, intent: "observe", confidence: 0, reason: "live harness configured but dry-run fallback used" };
    }
  };
}

export function createAgentKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const AgentState = defineResource(config.resourceName ?? "agent.state");
  const AgentCreated = defineEvent("agent.created");
  const AgentMemoryRecorded = defineEvent("agent.memory.recorded");
  const AgentGoalSet = defineEvent("agent.goal.set");
  const AgentDecisionRequested = defineEvent("agent.decision.requested");
  const AgentContextBuilt = defineEvent("agent.context.built");
  const AgentProposalSubmitted = defineEvent("agent.proposal.submitted");
  const AgentProposalAccepted = defineEvent("agent.proposal.accepted");
  const AgentProposalRejected = defineEvent("agent.proposal.rejected");
  const AgentIntentCommitted = defineEvent("agent.intent.committed");
  const AgentReset = defineEvent("agent.reset");
  const harness = config.harness ?? createFakeAgentHarness(config.fakeHarness ?? {});

  function setState(world, state) { world.setResource(AgentState, state); return clone(state); }

  return defineRuntimeKit({
    id: config.kitId ?? "agent-kit",
    provides: ["agent:state", "agent:harness", "agent:proposal-validation", "agent:decision-trace"],
    resources: { AgentState },
    events: { AgentCreated, AgentMemoryRecorded, AgentGoalSet, AgentDecisionRequested, AgentContextBuilt, AgentProposalSubmitted, AgentProposalAccepted, AgentProposalRejected, AgentIntentCommitted, AgentReset },
    systems: [{ phase: config.phase ?? "simulate", name: "agentKitClockSystem", system(world) {
      const state = world.getResource(AgentState);
      if (!state) return;
      world.setResource(AgentState, { ...state, tick: Number(world.__nexusClock?.frame ?? state.tick ?? 0) });
    }}],
    initWorld({ world }) { world.setResource(AgentState, createInitialState(config)); },
    install({ engine, world }) {
      engine.agents = {
        resources: { AgentState },
        events: { AgentCreated, AgentMemoryRecorded, AgentGoalSet, AgentDecisionRequested, AgentContextBuilt, AgentProposalSubmitted, AgentProposalAccepted, AgentProposalRejected, AgentIntentCommitted, AgentReset },
        harness,
        create(profile = {}) {
          const agent = normalizeAgent(profile, Object.keys(world.getResource(AgentState)?.agents ?? {}).length);
          let state = world.getResource(AgentState) ?? createInitialState(config);
          state = trace({ ...state, agents: { ...state.agents, [agent.id]: agent } }, "agent.created", { agentId: agent.id });
          world.emit(AgentCreated, { agentId: agent.id, profile: clone(agent) });
          return setState(world, state).agents[agent.id];
        },
        remember(agentId, fact) {
          const normalized = normalizeFact(fact);
          let state = world.getResource(AgentState) ?? createInitialState(config);
          const agent = state.agents[agentId];
          if (!agent) return null;
          const updated = { ...agent, memory: [normalized, ...agent.memory].slice(0, Number(config.memoryLimit ?? 64)) };
          state = trace({ ...state, agents: { ...state.agents, [agentId]: updated } }, "agent.memory.recorded", { agentId, fact: normalized });
          world.emit(AgentMemoryRecorded, { agentId, fact: normalized });
          return setState(world, state).agents[agentId];
        },
        setGoal(agentId, goal) {
          let state = world.getResource(AgentState) ?? createInitialState(config);
          const agent = state.agents[agentId];
          if (!agent) return null;
          const goalId = String(goal);
          const updated = { ...agent, goals: Array.from(new Set([...agent.goals, goalId])) };
          state = trace({ ...state, agents: { ...state.agents, [agentId]: updated } }, "agent.goal.set", { agentId, goal: goalId });
          world.emit(AgentGoalSet, { agentId, goal: goalId });
          return setState(world, state).agents[agentId];
        },
        buildContext(agentId, reason = "decision") {
          const state = world.getResource(AgentState) ?? createInitialState(config);
          const context = buildContextFromState(state, agentId, reason);
          if (context) world.emit(AgentContextBuilt, { agentId, reason, context });
          return clone(context);
        },
        requestDecision(agentId, reason = "decision") {
          let state = world.getResource(AgentState) ?? createInitialState(config);
          const context = buildContextFromState(state, agentId, reason);
          if (!context) return null;
          const request = { id: `decision-${state.mailbox.requests.length + 1}`, agentId, reason, context };
          state = trace({ ...state, mailbox: { ...state.mailbox, requests: [request, ...state.mailbox.requests].slice(0, 32) } }, "agent.decision.requested", { agentId, reason });
          world.emit(AgentDecisionRequested, { agentId, reason, request });
          setState(world, state);
          const proposal = nextDecision(harness, request, state);
          if (proposal && typeof proposal.then !== "function") return this.submitProposal(agentId, proposal);
          if (proposal?.then) state.mailbox.pending.unshift(request);
          return clone(request);
        },
        submitProposal(agentId, proposal = {}) {
          const incoming = { type: "agent.proposal", agentId, ...clone(proposal), submittedAtTick: world.getResource(AgentState)?.tick ?? 0 };
          let state = world.getResource(AgentState) ?? createInitialState(config);
          world.emit(AgentProposalSubmitted, { agentId, proposal: incoming });
          const validation = validateProposal(state, incoming, config);
          const proposalId = incoming.id ?? `proposal-${state.mailbox.proposals.length + 1}`;
          const wrapped = { ...incoming, id: proposalId, validation };
          if (!validation.ok) {
            state = trace({ ...state, mailbox: { ...state.mailbox, proposals: [wrapped, ...state.mailbox.proposals].slice(0, 32), rejected: [wrapped, ...state.mailbox.rejected].slice(0, 32) } }, "agent.proposal.rejected", { agentId, proposalId, reason: validation.reason });
            world.emit(AgentProposalRejected, { agentId, proposalId, reason: validation.reason, proposal: wrapped });
            return { accepted: false, reason: validation.reason, proposal: clone(wrapped), state: setState(world, state) };
          }
          const agent = state.agents[agentId];
          const updatedAgent = { ...agent, currentIntent: clone(validation.proposal) };
          state = trace({ ...state, agents: { ...state.agents, [agentId]: updatedAgent }, mailbox: { ...state.mailbox, proposals: [wrapped, ...state.mailbox.proposals].slice(0, 32), accepted: [wrapped, ...state.mailbox.accepted].slice(0, 32) } }, "agent.proposal.accepted", { agentId, proposalId, intent: validation.proposal.intent });
          world.emit(AgentProposalAccepted, { agentId, proposalId, proposal: wrapped });
          world.emit(AgentIntentCommitted, { agentId, proposalId, intent: validation.proposal.intent, proposal: validation.proposal });
          return { accepted: true, reason: "accepted", proposal: clone(wrapped), state: setState(world, state) };
        },
        getAgent(agentId) { return clone(world.getResource(AgentState)?.agents?.[agentId] ?? null); },
        getState() { return clone(world.getResource(AgentState)); },
        getTrace(agentId = null) {
          const traceItems = world.getResource(AgentState)?.trace ?? [];
          return clone(agentId ? traceItems.filter((item) => item.payload?.agentId === agentId) : traceItems);
        },
        reset(payload = {}) {
          const state = createInitialState({ ...config, ...payload });
          world.setResource(AgentState, state);
          world.emit(AgentReset, { reason: payload.reason ?? "reset" });
          return clone(state);
        }
      };
    },
    metadata: { purpose: "In-game agent domain kit with pluggable deterministic, replay, ONNX, or live harness adapters.", boundary: "Owns agent state, memory, decision context, proposal validation, and trace. Harnesses produce proposals only; DSKs and game kits commit gameplay." }
  });
}

export default createAgentKit;
