import {
  clone,
  createProductionDomainKit,
  integer,
  list,
  number,
  stableId
} from "../production-domain-kit-support.js";

export const TERRITORY_INFLUENCE_DOMAIN_KIT_VERSION = "0.1.0";

const SPEC = {
  factory: "createTerritoryInfluenceDomainKit",
  kitId: "territory-influence-domain-kit",
  domain: "territory-influence",
  domainPath: "n:world:territory-influence",
  parentDomainPath: "n:world",
  apiName: "territoryInfluence",
  schema: "nexusengine.territory-influence/1",
  resource: "territoryInfluence.state",
  purpose: "Resolve portable faction influence, contest state, decay, and control transitions across authored regions.",
  ownership: ["region influence ledgers", "contest thresholds", "influence decay", "control transitions", "region-control descriptors"],
  exclusions: ["faction lore", "combat", "economy", "zone geometry", "scene lifecycle", "agent movement", "map rendering", "network authority"],
  dependencies: ["NexusEngine DomainServiceKit", "portable region ids", "portable faction ids", "explicit influence facts"],
  services: ["regions", "contributions", "withdrawal", "contest-locks", "decay", "control-resolution", "snapshots", "descriptors", "reset"],
  provides: ["world:territory-influence", "territory:contest", "territory:control-transitions"],
  events: ["territory.influenceChanged", "territory.contested", "territory.controlChanged", "territory.neutralized", "territory.commandRejected", "territory.reset"],
  rejectedEvent: "territory.commandRejected",
  resetEvent: "territory.reset"
};

function normalizeRegion(input = {}, index = 0) {
  return {
    id: stableId(input.id ?? `region-${index + 1}`, "Territory region"),
    controlThreshold: Math.max(0, number(input.controlThreshold, 10)),
    contestMargin: Math.max(0, number(input.contestMargin, 2)),
    decayPerTick: Math.max(0, number(input.decayPerTick, 0)),
    contestLocked: Boolean(input.contestLocked),
    controllerId: input.controllerId == null ? null : String(input.controllerId),
    contested: false,
    totals: {},
    metadata: clone(input.metadata ?? {})
  };
}

function resolveRegion(region, contributions) {
  const totals = {};
  for (const contribution of Object.values(contributions).filter((entry) => entry.regionId === region.id)) totals[contribution.factionId] = (totals[contribution.factionId] ?? 0) + entryValue(contribution);
  const ranking = Object.entries(totals).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const top = ranking[0] ?? null;
  const second = ranking[1] ?? null;
  const contested = region.contestLocked || Boolean(top && top[1] >= region.controlThreshold && second && top[1] - second[1] < region.contestMargin);
  const controllerId = top && top[1] >= region.controlThreshold && !contested ? top[0] : null;
  return { ...region, totals, contested, controllerId };
}

const entryValue = (entry) => Math.max(0, number(entry.value));

function createInitial(config) {
  const regions = Object.fromEntries(list(config.regions).map((entry, index) => {
    const value = normalizeRegion(entry, index);
    return [value.id, value];
  }));
  return { regions, contributions: {}, transitions: [], tick: integer(config.initialTick) };
}

export function createTerritoryInfluenceDomainKit(NexusEngine, config = {}) {
  return createProductionDomainKit(NexusEngine, SPEC, config, createInitial, ({ read, commit, reject, emit }) => {
    const registerRegion = (input) => {
      const value = normalizeRegion(input);
      if (read().regions[value.id]) return clone(read().regions[value.id]);
      commit({ result: { ok: true, action: "register-region", regionId: value.id }, transform: (state) => ({ ...state, regions: { ...state.regions, [value.id]: value } }) });
      return clone(value);
    };
    const reconcile = (state, regionId) => {
      const previous = state.regions[regionId];
      const next = resolveRegion(previous, state.contributions);
      const transitions = [...state.transitions];
      if (previous.controllerId !== next.controllerId || previous.contested !== next.contested) transitions.push({ regionId, fromControllerId: previous.controllerId, toControllerId: next.controllerId, contested: next.contested, tick: state.tick });
      return { ...state, regions: { ...state.regions, [regionId]: next }, transitions: transitions.slice(-256) };
    };
    const contribute = (fact = {}) => {
      const regionId = stableId(fact.regionId, "Influence region");
      const factionId = stableId(fact.factionId, "Influence faction");
      if (!read().regions[regionId]) return reject("unknown-region", { regionId, factionId, commandId: fact.commandId });
      const contributionId = stableId(fact.id ?? fact.commandId, "Influence contribution");
      const before = read().regions[regionId];
      const contribution = { id: contributionId, regionId, factionId, value: Math.max(0, number(fact.value ?? fact.amount)), decayPerTick: Math.max(0, number(fact.decayPerTick, before.decayPerTick)), source: clone(fact.source ?? null) };
      const response = commit({
        result: { ok: true, action: "contribute", contributionId, regionId, factionId, value: contribution.value },
        eventName: "territory.influenceChanged",
        commandId: fact.commandId,
        transform: (state) => reconcile({ ...state, contributions: { ...state.contributions, [contributionId]: contribution } }, regionId)
      });
      if (!response.duplicate) publishTransition(before, read().regions[regionId], emit, read().tick);
      return response;
    };
    const withdraw = (command = {}) => {
      const contributionId = stableId(command.contributionId ?? command.id, "Influence contribution");
      const existing = read().contributions[contributionId];
      if (!existing) return reject("unknown-contribution", { contributionId, commandId: command.commandId });
      const before = read().regions[existing.regionId];
      const response = commit({
        result: { ok: true, action: "withdraw", contributionId, regionId: existing.regionId },
        eventName: "territory.influenceChanged",
        commandId: command.commandId,
        transform: (state) => {
          const contributions = { ...state.contributions };
          delete contributions[contributionId];
          return reconcile({ ...state, contributions }, existing.regionId);
        }
      });
      if (!response.duplicate) publishTransition(before, read().regions[existing.regionId], emit, read().tick);
      return response;
    };
    const setContestLock = (regionId, locked, payload = {}) => {
      const id = stableId(regionId, "Contest region");
      const previous = read().regions[id];
      if (!previous) return reject("unknown-region", { regionId: id, commandId: payload.commandId });
      const response = commit({
        result: { ok: true, action: locked ? "lock-contest" : "release-contest", regionId: id },
        commandId: payload.commandId,
        transform: (state) => reconcile({ ...state, regions: { ...state.regions, [id]: { ...previous, contestLocked: Boolean(locked) } } }, id)
      });
      if (!response.duplicate) publishTransition(previous, read().regions[id], emit, read().tick);
      return response;
    };
    const advance = (ticks = 1) => {
      const count = Math.max(1, integer(ticks, 1));
      let state = clone(read());
      const beforeRegions = clone(state.regions);
      for (let step = 0; step < count; step += 1) {
        state.tick += 1;
        state.contributions = Object.fromEntries(Object.entries(state.contributions).map(([id, contribution]) => [id, { ...contribution, value: Math.max(0, contribution.value - contribution.decayPerTick) }]).filter(([, contribution]) => contribution.value > 0));
        for (const regionId of Object.keys(state.regions).sort()) state = reconcile(state, regionId);
      }
      commit({ result: { ok: true, action: "advance", ticks: count, tick: state.tick }, transform: () => state });
      for (const regionId of Object.keys(read().regions).sort()) publishTransition(beforeRegions[regionId], read().regions[regionId], emit, read().tick);
      return clone(read());
    };
    return {
      registerRegion,
      contribute,
      withdraw,
      lockContest: (regionId, payload) => setContestLock(regionId, true, payload),
      releaseContest: (regionId, payload) => setContestLock(regionId, false, payload),
      advance,
      getController: (regionId) => read().regions[String(regionId)]?.controllerId ?? null,
      getDescriptors: () => Object.values(read().regions).sort((a, b) => a.id.localeCompare(b.id)).map((region) => ({ id: region.id, kind: "territory-control", controllerId: region.controllerId, contested: region.contested, totals: clone(region.totals) }))
    };
  });
}

function publishTransition(before, after, emit, tick) {
  if (!before || !after) return;
  if (!before.contested && after.contested) emit("territory.contested", { regionId: after.id, totals: clone(after.totals), tick });
  if (before.controllerId !== after.controllerId) {
    if (after.controllerId) emit("territory.controlChanged", { regionId: after.id, fromControllerId: before.controllerId, toControllerId: after.controllerId, tick });
    else if (before.controllerId) emit("territory.neutralized", { regionId: after.id, fromControllerId: before.controllerId, tick });
  }
}

export default createTerritoryInfluenceDomainKit;
