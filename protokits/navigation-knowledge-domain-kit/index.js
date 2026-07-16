import {
  clamp,
  clone,
  createProductionDomainKit,
  integer,
  list,
  number,
  stableId
} from "../production-domain-kit-support.js";

export const NAVIGATION_KNOWLEDGE_DOMAIN_KIT_VERSION = "0.1.0";

const SPEC = {
  factory: "createNavigationKnowledgeDomainKit",
  kitId: "navigation-knowledge-domain-kit",
  domain: "navigation-knowledge",
  domainPath: "n:knowledge:navigation",
  parentDomainPath: "n:knowledge",
  apiName: "navigationKnowledge",
  schema: "nexusengine.navigation-knowledge/1",
  resource: "navigationKnowledge.state",
  purpose: "Observer-specific knowledge of places, links, hazards, closures, confidence, provenance, and staleness.",
  ownership: ["observer knowledge", "known place and link facts", "hazard and closure observations", "confidence and staleness", "source provenance", "knowledge deltas"],
  exclusions: ["world truth", "pathfinding", "navmesh generation", "movement", "map rendering", "fog graphics", "quest progress", "persistence transport"],
  dependencies: ["NexusEngine DomainServiceKit", "portable place and link ids", "explicit observations"],
  services: ["observers", "observation", "closures", "knowledge-packets", "confidence-decay", "known-graphs", "snapshots", "descriptors", "reset"],
  provides: ["knowledge:navigation", "navigation:observer-graph", "navigation:knowledge-provenance"],
  events: ["navigationKnowledge.discovered", "navigationKnowledge.updated", "navigationKnowledge.shared", "navigationKnowledge.stale", "navigationKnowledge.commandRejected", "navigationKnowledge.reset"],
  rejectedEvent: "navigationKnowledge.commandRejected",
  resetEvent: "navigationKnowledge.reset"
};

function normalizeObserver(input = {}, index = 0) {
  return { id: stableId(input.id ?? `observer-${index + 1}`, "Navigation observer"), metadata: clone(input.metadata ?? {}) };
}

function normalizeFact(input = {}, tick = 0) {
  const id = stableId(input.id ?? `${input.kind ?? "place"}:${input.placeId ?? input.linkId ?? input.targetId ?? "unknown"}`, "Navigation fact");
  return {
    id,
    kind: String(input.kind ?? "place"),
    placeId: input.placeId == null ? null : String(input.placeId),
    linkId: input.linkId == null ? null : String(input.linkId),
    fromPlaceId: input.fromPlaceId == null ? null : String(input.fromPlaceId),
    toPlaceId: input.toPlaceId == null ? null : String(input.toPlaceId),
    closed: Boolean(input.closed),
    hazard: clone(input.hazard ?? null),
    confidence: clamp(input.confidence ?? 1),
    decayPerTick: Math.max(0, number(input.decayPerTick, 0)),
    staleBelow: clamp(input.staleBelow ?? 0.2),
    observedTick: integer(input.observedTick, tick),
    version: Math.max(1, integer(input.version, 1)),
    sourceId: input.sourceId == null ? null : String(input.sourceId),
    metadata: clone(input.metadata ?? {})
  };
}

function createInitial(config) {
  const observers = Object.fromEntries(list(config.observers).map((entry, index) => {
    const value = normalizeObserver(entry, index);
    return [value.id, value];
  }));
  return { observers, facts: {}, provenance: [], tick: integer(config.initialTick) };
}

export function createNavigationKnowledgeDomainKit(NexusEngine, config = {}) {
  return createProductionDomainKit(NexusEngine, SPEC, config, createInitial, ({ read, commit, reject, emit }) => {
    const registerObserver = (input) => {
      const value = normalizeObserver(input);
      if (read().observers[value.id]) return clone(read().observers[value.id]);
      commit({ result: { ok: true, action: "register-observer", observerId: value.id }, transform: (state) => ({ ...state, observers: { ...state.observers, [value.id]: value } }) });
      return clone(value);
    };
    const observe = (fact = {}) => {
      const observerId = stableId(fact.observerId, "Navigation observer");
      if (!read().observers[observerId]) return reject("unknown-observer", { observerId, commandId: fact.commandId });
      const value = normalizeFact(fact, read().tick);
      const key = `${observerId}:${value.id}`;
      const previous = read().facts[key];
      if (previous && previous.version > value.version) return reject("stale-observation-version", { observerId, factId: value.id, commandId: fact.commandId });
      return commit({
        result: { ok: true, action: "observe", observerId, factId: value.id, discovered: !previous },
        eventName: previous ? "navigationKnowledge.updated" : "navigationKnowledge.discovered",
        commandId: fact.commandId,
        transform: (state) => ({ ...state, facts: { ...state.facts, [key]: { ...value, observerId } }, provenance: [...state.provenance, { observerId, factId: value.id, sourceId: value.sourceId, version: value.version, tick: state.tick }].slice(-512) })
      });
    };
    const markClosure = (fact = {}) => observe({ ...fact, kind: "closure", closed: fact.closed !== false });
    const share = (packet = {}) => {
      const fromObserverId = stableId(packet.fromObserverId, "Knowledge source observer");
      const toObserverId = stableId(packet.toObserverId, "Knowledge recipient observer");
      if (!read().observers[fromObserverId] || !read().observers[toObserverId]) return reject("unknown-observer", { fromObserverId, toObserverId, commandId: packet.commandId });
      const sourceFacts = Object.values(read().facts).filter((fact) => fact.observerId === fromObserverId && (!packet.factIds || list(packet.factIds).map(String).includes(fact.id))).sort((a, b) => a.id.localeCompare(b.id)).slice(0, Math.max(1, integer(packet.limit, 32)));
      return commit({
        result: { ok: true, action: "share", fromObserverId, toObserverId, factCount: sourceFacts.length },
        eventName: "navigationKnowledge.shared",
        commandId: packet.commandId,
        transform: (state) => {
          const facts = { ...state.facts };
          for (const source of sourceFacts) {
            const key = `${toObserverId}:${source.id}`;
            const previous = facts[key];
            if (!previous || source.version > previous.version || (source.version === previous.version && source.confidence > previous.confidence)) facts[key] = { ...clone(source), observerId: toObserverId, sourceId: fromObserverId };
          }
          return { ...state, facts, provenance: [...state.provenance, ...sourceFacts.map((fact) => ({ observerId: toObserverId, factId: fact.id, sourceId: fromObserverId, version: fact.version, tick: state.tick }))].slice(-512) };
        }
      });
    };
    const advance = (ticks = 1) => {
      const count = Math.max(1, integer(ticks, 1));
      const stale = [];
      let state = clone(read());
      for (let step = 0; step < count; step += 1) {
        state.tick += 1;
        for (const key of Object.keys(state.facts).sort()) {
          const fact = state.facts[key];
          const before = fact.confidence;
          const confidence = clamp(before - fact.decayPerTick);
          state.facts[key] = { ...fact, confidence };
          if (before >= fact.staleBelow && confidence < fact.staleBelow) stale.push({ observerId: fact.observerId, factId: fact.id, confidence, tick: state.tick });
        }
      }
      commit({ result: { ok: true, action: "advance", ticks: count, tick: state.tick, staleCount: stale.length }, transform: () => state });
      for (const event of stale) emit("navigationKnowledge.stale", event);
      return clone(read());
    };
    const getKnownGraph = (observerId) => {
      const id = String(observerId);
      if (!read().observers[id]) return null;
      const facts = Object.values(read().facts).filter((fact) => fact.observerId === id).sort((a, b) => a.id.localeCompare(b.id));
      return { observerId: id, tick: read().tick, places: facts.filter((fact) => fact.kind === "place"), links: facts.filter((fact) => fact.kind === "link"), closures: facts.filter((fact) => fact.kind === "closure"), hazards: facts.filter((fact) => fact.kind === "hazard" || fact.hazard) };
    };
    return {
      registerObserver,
      observe,
      markClosure,
      share,
      advance,
      getKnownGraph,
      getDescriptors: () => Object.values(read().facts).sort((a, b) => `${a.observerId}:${a.id}`.localeCompare(`${b.observerId}:${b.id}`)).map((fact) => ({ id: `${fact.observerId}:${fact.id}`, kind: "navigation-knowledge-fact", observerId: fact.observerId, factKind: fact.kind, confidence: fact.confidence, stale: fact.confidence < fact.staleBelow, closed: fact.closed, sourceId: fact.sourceId }))
    };
  });
}

export default createNavigationKnowledgeDomainKit;
