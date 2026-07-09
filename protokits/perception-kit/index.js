export const PERCEPTION_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const idOf = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createPerceptionKit requires NexusEngine.${key}.`);
  }
}

function positionOf(value = {}) {
  const p = value.position ?? value;
  return { x: number(p.x), y: number(p.y), z: number(p.z ?? p.y) };
}

function distance(a = {}, b = {}) {
  const pa = positionOf(a);
  const pb = positionOf(b);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y, pa.z - pb.z);
}

function normalizeEntity(entity = {}, index = 0) {
  const id = idOf(entity.id, `entity-${index + 1}`);
  return {
    id,
    label: String(entity.label ?? entity.name ?? id),
    type: String(entity.type ?? "entity"),
    role: entity.role == null ? null : String(entity.role),
    position: positionOf(entity.position ?? entity),
    radius: number(entity.radius, 0.5),
    visible: entity.visible !== false,
    hidden: Boolean(entity.hidden),
    observable: entity.observable !== false,
    blocksSight: Boolean(entity.blocksSight),
    tags: asArray(entity.tags).map(String),
    facts: asArray(entity.facts).map(String),
    metadata: clone(entity.metadata ?? {})
  };
}

function normalizeFact(fact = {}) {
  if (typeof fact === "string") return { id: fact, text: fact, public: true, observedBy: [] };
  const id = idOf(fact.id ?? fact.text ?? fact.type, "fact");
  return {
    id,
    type: String(fact.type ?? "fact"),
    text: String(fact.text ?? id),
    sourceId: fact.sourceId == null ? null : String(fact.sourceId),
    targetId: fact.targetId == null ? null : String(fact.targetId),
    public: fact.public !== false,
    observedBy: asArray(fact.observedBy).map(String),
    tags: asArray(fact.tags).map(String),
    value: clone(fact.value ?? null)
  };
}

function initialState(config = {}) {
  const entities = asArray(config.entities).map(normalizeEntity);
  const facts = asArray(config.facts).map(normalizeFact);
  return {
    version: PERCEPTION_KIT_VERSION,
    entities: Object.fromEntries(entities.map((entity) => [entity.id, entity])),
    facts: Object.fromEntries(facts.map((fact) => [fact.id, fact])),
    observations: {},
    history: []
  };
}

function canSeeEntity(agent, entity, options = {}) {
  if (!agent || !entity || agent.id === entity.id && options.includeSelf !== true) return false;
  if (entity.visible === false || entity.observable === false || entity.hidden) return false;
  const maxDistance = number(options.range ?? agent.metadata?.sightRange, number(options.defaultRange, 12));
  if (distance(agent, entity) > maxDistance) return false;
  const requiredTags = asArray(options.requiredTags).map(String);
  if (requiredTags.length && !requiredTags.some((tag) => entity.tags.includes(tag))) return false;
  return true;
}

function visibleFactsForAgent(state, agentId, visibleEntityIds) {
  return Object.values(state.facts).filter((fact) => {
    if (fact.public) return true;
    if (fact.observedBy.includes(agentId)) return true;
    if (fact.sourceId && visibleEntityIds.includes(fact.sourceId)) return true;
    if (fact.targetId && visibleEntityIds.includes(fact.targetId)) return true;
    return false;
  });
}

export function createPerceptionKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const PerceptionState = defineResource(config.resourceName ?? "perception.state");
  const EntityRegistered = defineEvent("perception.entityRegistered");
  const EntityUpdated = defineEvent("perception.entityUpdated");
  const FactRecorded = defineEvent("perception.factRecorded");
  const ObservationBuilt = defineEvent("perception.observationBuilt");
  const Reset = defineEvent("perception.reset");

  return defineRuntimeKit({
    id: config.kitId ?? "perception-kit",
    provides: ["perception:visible-entities", "perception:observations", "agent:observation-context"],
    resources: { PerceptionState },
    events: { EntityRegistered, EntityUpdated, FactRecorded, ObservationBuilt, Reset },
    systems: [],
    initWorld({ world }) { world.setResource(PerceptionState, initialState(config)); },
    install({ engine, world }) {
      engine.perception = {
        resources: { PerceptionState },
        events: { EntityRegistered, EntityUpdated, FactRecorded, ObservationBuilt, Reset },
        registerEntity(entity = {}) {
          const state = world.getResource(PerceptionState) ?? initialState(config);
          const normalized = normalizeEntity(entity, Object.keys(state.entities).length);
          world.setResource(PerceptionState, { ...state, entities: { ...state.entities, [normalized.id]: normalized } });
          world.emit(EntityRegistered, { entityId: normalized.id, entity: normalized });
          return clone(normalized);
        },
        setEntity(entityId, patch = {}) {
          const state = world.getResource(PerceptionState) ?? initialState(config);
          const current = state.entities[entityId] ?? normalizeEntity({ id: entityId });
          const next = normalizeEntity({ ...current, ...patch, id: entityId, position: patch.position ?? patch }, 0);
          world.setResource(PerceptionState, { ...state, entities: { ...state.entities, [entityId]: next } });
          world.emit(EntityUpdated, { entityId, patch: clone(patch), entity: next });
          return clone(next);
        },
        recordFact(fact = {}) {
          const state = world.getResource(PerceptionState) ?? initialState(config);
          const normalized = normalizeFact(fact);
          world.setResource(PerceptionState, { ...state, facts: { ...state.facts, [normalized.id]: normalized }, history: [{ type: "fact", id: normalized.id }, ...state.history].slice(0, 64) });
          world.emit(FactRecorded, { fact: normalized });
          return clone(normalized);
        },
        observe(agentId, options = {}) {
          const state = world.getResource(PerceptionState) ?? initialState(config);
          const agent = state.entities[agentId];
          if (!agent) return null;
          const visibleEntities = Object.values(state.entities).filter((entity) => canSeeEntity(agent, entity, { ...config, ...options }));
          const visibleEntityIds = visibleEntities.map((entity) => entity.id);
          const facts = visibleFactsForAgent(state, agentId, visibleEntityIds);
          const observation = {
            agentId,
            observedAtTick: world.__nexusClock?.frame ?? 0,
            agent: clone(agent),
            visibleEntities: clone(visibleEntities),
            visibleEntityIds,
            facts: clone(facts),
            text: [
              `${agent.label} sees ${visibleEntities.map((entity) => entity.label).join(", ") || "nothing notable"}.`,
              facts.map((fact) => fact.text).join(" ")
            ].filter(Boolean).join(" ")
          };
          world.setResource(PerceptionState, { ...state, observations: { ...state.observations, [agentId]: observation }, history: [{ type: "observation", agentId, count: visibleEntities.length }, ...state.history].slice(0, 64) });
          world.emit(ObservationBuilt, observation);
          return clone(observation);
        },
        getVisible(agentId, options = {}) { return this.observe(agentId, options)?.visibleEntities ?? []; },
        getObservation(agentId) { return clone(world.getResource(PerceptionState)?.observations?.[agentId] ?? null); },
        getState() { return clone(world.getResource(PerceptionState)); },
        reset(payload = {}) {
          const state = initialState({ ...config, ...payload });
          world.setResource(PerceptionState, state);
          world.emit(Reset, { reason: payload.reason ?? "reset" });
          return clone(state);
        }
      };
    },
    metadata: { purpose: "Filters world state into what an agent can see, hear, and remember before model or script choice.", boundary: "Does not choose actions or mutate gameplay; it only builds observations." }
  });
}

export default createPerceptionKit;
