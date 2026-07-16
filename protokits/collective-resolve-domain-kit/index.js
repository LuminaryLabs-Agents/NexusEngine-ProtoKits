import {
  clamp,
  clone,
  createProductionDomainKit,
  integer,
  list,
  number,
  stableId
} from "../production-domain-kit-support.js";

export const COLLECTIVE_RESOLVE_DOMAIN_KIT_VERSION = "0.1.0";

const SPEC = {
  factory: "createCollectiveResolveDomainKit",
  kitId: "collective-resolve-domain-kit",
  domain: "collective-resolve",
  domainPath: "n:agency:collective-resolve",
  parentDomainPath: "n:agency",
  apiName: "collectiveResolve",
  schema: "nexusengine.collective-resolve/1",
  resource: "collectiveResolve.state",
  purpose: "Deterministic group resolve from membership readiness, leadership, shocks, recovery, breaks, and rallies.",
  ownership: ["collective definitions", "member readiness", "leadership anchors", "shock and recovery facts", "break and rally states", "group readiness descriptors"],
  exclusions: ["individual emotions", "agent planning", "combat resolution", "formation movement", "dialogue", "animation", "UI", "audio playback"],
  dependencies: ["NexusEngine DomainServiceKit", "stable member ids", "explicit shock and recovery facts"],
  services: ["collectives", "member-readiness", "leadership", "shocks", "rally", "fixed-tick-recovery", "snapshots", "descriptors", "reset"],
  provides: ["agency:collective-resolve", "resolve:break-rally", "resolve:group-readiness"],
  events: ["resolve.changed", "resolve.shaken", "resolve.broken", "resolve.rallyStarted", "resolve.rallied", "resolve.commandRejected", "resolve.reset"],
  rejectedEvent: "resolve.commandRejected",
  resetEvent: "resolve.reset"
};

function normalizeCollective(input = {}, index = 0) {
  const id = stableId(input.id ?? `collective-${index + 1}`, "Collective");
  return {
    id,
    baseResolve: clamp(input.baseResolve ?? 0.5),
    breakThreshold: clamp(input.breakThreshold ?? 0.25),
    rallyThreshold: clamp(input.rallyThreshold ?? 0.55),
    leaderBonus: clamp(input.leaderBonus ?? 0.15, 0, 0.5),
    rallyBoost: clamp(input.rallyBoost ?? 0.3, 0, 1),
    members: Object.fromEntries(list(input.members).map((member, memberIndex) => {
      const memberId = stableId(member.id ?? `member-${memberIndex + 1}`, "Collective member");
      return [memberId, { id: memberId, readiness: clamp(member.readiness ?? 0.5), weight: Math.max(0.0001, number(member.weight, 1)) }];
    })),
    leader: input.leader ? { id: stableId(input.leader.id, "Collective leader"), active: input.leader.active !== false } : null,
    shocks: [],
    status: "steady",
    score: clamp(input.baseResolve ?? 0.5),
    metadata: clone(input.metadata ?? {})
  };
}

function resolveCollective(value) {
  const members = Object.values(value.members);
  const weight = members.reduce((sum, member) => sum + member.weight, 0);
  const readiness = weight > 0 ? members.reduce((sum, member) => sum + member.readiness * member.weight, 0) / weight : 0;
  const shock = value.shocks.reduce((sum, entry) => sum + entry.amount, 0);
  const leader = value.leader?.active ? value.leaderBonus : 0;
  const score = clamp(value.baseResolve * 0.4 + readiness * 0.6 + leader - shock);
  let status = value.status;
  if (score <= value.breakThreshold) status = "broken";
  else if (status === "broken" && score < value.rallyThreshold) status = "rallying";
  else if (score >= value.rallyThreshold) status = "steady";
  else status = "shaken";
  return { ...value, score, status };
}

function createInitial(config) {
  const collectives = Object.fromEntries(list(config.collectives).map((entry, index) => {
    const value = resolveCollective(normalizeCollective(entry, index));
    return [value.id, value];
  }));
  return { collectives, tick: integer(config.initialTick) };
}

export function createCollectiveResolveDomainKit(NexusEngine, config = {}) {
  return createProductionDomainKit(NexusEngine, SPEC, config, createInitial, ({ read, commit, reject, emit }) => {
    const find = (collectiveId) => read().collectives[String(collectiveId)] ?? null;
    const registerCollective = (input) => {
      const value = resolveCollective(normalizeCollective(input));
      if (find(value.id)) return clone(find(value.id));
      commit({ result: { ok: true, action: "register-collective", collectiveId: value.id }, transform: (state) => ({ ...state, collectives: { ...state.collectives, [value.id]: value } }) });
      return clone(value);
    };
    const update = (collectiveId, transform, result, eventName, commandId) => {
      const value = find(collectiveId);
      if (!value) return reject("unknown-collective", { collectiveId, commandId });
      const next = resolveCollective(transform(clone(value)));
      const response = commit({ result: { ok: true, ...result, collectiveId, score: next.score, status: next.status }, eventName, commandId, transform: (state) => ({ ...state, collectives: { ...state.collectives, [collectiveId]: next } }) });
      if (!response.duplicate && value.status !== next.status) {
        emit("resolve.changed", { collectiveId, from: value.status, to: next.status, score: next.score, tick: read().tick });
        if (next.status === "broken") emit("resolve.broken", { collectiveId, score: next.score, tick: read().tick });
        if (value.status !== "steady" && next.status === "steady") emit("resolve.rallied", { collectiveId, score: next.score, tick: read().tick });
      }
      return response;
    };
    const setMemberReadiness = (fact = {}) => {
      const collectiveId = stableId(fact.collectiveId, "Readiness collective");
      const memberId = stableId(fact.memberId, "Readiness member");
      return update(collectiveId, (value) => ({ ...value, members: { ...value.members, [memberId]: { id: memberId, readiness: clamp(fact.readiness), weight: Math.max(0.0001, number(fact.weight, value.members[memberId]?.weight ?? 1)) } } }), { action: "set-member-readiness", memberId }, "resolve.changed", fact.commandId);
    };
    const recordShock = (fact = {}) => {
      const collectiveId = stableId(fact.collectiveId, "Shock collective");
      const shockId = stableId(fact.id ?? fact.commandId, "Shock");
      return update(collectiveId, (value) => ({ ...value, shocks: [...value.shocks.filter((entry) => entry.id !== shockId), { id: shockId, amount: clamp(fact.amount ?? 0.1), recoveryPerTick: Math.max(0, number(fact.recoveryPerTick, 0.02)), source: clone(fact.source ?? null) }] }), { action: "record-shock", shockId }, "resolve.shaken", fact.commandId);
    };
    const setLeaderState = (fact = {}) => {
      const collectiveId = stableId(fact.collectiveId, "Leader collective");
      const leaderId = stableId(fact.leaderId, "Leader");
      return update(collectiveId, (value) => ({ ...value, leader: { id: leaderId, active: fact.active !== false } }), { action: "set-leader-state", leaderId, active: fact.active !== false }, "resolve.changed", fact.commandId);
    };
    const attemptRally = (command = {}) => {
      const collectiveId = stableId(command.collectiveId, "Rally collective");
      const value = find(collectiveId);
      if (!value) return reject("unknown-collective", { collectiveId, commandId: command.commandId });
      if (value.status !== "broken" && value.status !== "rallying") return reject("rally-not-needed", { collectiveId, status: value.status, commandId: command.commandId });
      if (!value.leader?.active && command.allowLeaderless !== true) return reject("active-leader-required", { collectiveId, commandId: command.commandId });
      const response = update(collectiveId, (current) => ({ ...current, shocks: current.shocks.map((shock) => ({ ...shock, amount: Math.max(0, shock.amount - current.rallyBoost) })).filter((shock) => shock.amount > 0) }), { action: "attempt-rally" }, "resolve.rallyStarted", command.commandId);
      return response;
    };
    const advance = (ticks = 1) => {
      const count = Math.max(1, integer(ticks, 1));
      const transitions = [];
      let state = clone(read());
      for (let step = 0; step < count; step += 1) {
        state.tick += 1;
        for (const collectiveId of Object.keys(state.collectives).sort()) {
          const before = state.collectives[collectiveId];
          const next = resolveCollective({ ...before, shocks: before.shocks.map((shock) => ({ ...shock, amount: Math.max(0, shock.amount - shock.recoveryPerTick) })).filter((shock) => shock.amount > 0) });
          state.collectives[collectiveId] = next;
          if (before.status !== next.status) transitions.push({ collectiveId, from: before.status, to: next.status, score: next.score, tick: state.tick });
        }
      }
      commit({ result: { ok: true, action: "advance", ticks: count, tick: state.tick, transitionCount: transitions.length }, transform: () => state });
      for (const transition of transitions) {
        emit("resolve.changed", transition);
        if (transition.to === "broken") emit("resolve.broken", transition);
        if (transition.to === "steady") emit("resolve.rallied", transition);
      }
      return clone(read());
    };
    return {
      registerCollective,
      setMemberReadiness,
      recordShock,
      setLeaderState,
      attemptRally,
      advance,
      getDescriptors: () => Object.values(read().collectives).sort((a, b) => a.id.localeCompare(b.id)).map((value) => ({ id: value.id, kind: "collective-resolve", status: value.status, score: value.score, memberCount: Object.keys(value.members).length, activeLeaderId: value.leader?.active ? value.leader.id : null, rallyEligible: ["broken", "rallying"].includes(value.status) }))
    };
  });
}

export default createCollectiveResolveDomainKit;
