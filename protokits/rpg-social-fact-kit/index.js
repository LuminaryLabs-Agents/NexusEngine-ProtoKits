export const RPG_SOCIAL_FACT_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const idOf = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createRpgSocialFactKit requires NexusEngine.${key}.`);
  }
}

function normalizeFact(fact = {}) {
  if (typeof fact === "string") return { id: fact, text: fact, type: "fact", entityIds: [], tags: [] };
  const id = idOf(fact.id ?? fact.text ?? fact.type, "fact");
  return {
    id,
    type: String(fact.type ?? "fact"),
    text: String(fact.text ?? id),
    entityIds: asArray(fact.entityIds ?? [fact.entityId, fact.sourceId, fact.targetId]).filter(Boolean).map(String),
    sourceId: fact.sourceId == null ? null : String(fact.sourceId),
    targetId: fact.targetId == null ? null : String(fact.targetId),
    public: fact.public !== false,
    severity: number(fact.severity, 0),
    tags: asArray(fact.tags).map(String),
    value: clone(fact.value ?? null)
  };
}

function initialState(config = {}) {
  const facts = asArray(config.facts).map(normalizeFact);
  return {
    version: RPG_SOCIAL_FACT_KIT_VERSION,
    facts: Object.fromEntries(facts.map((fact) => [fact.id, fact])),
    ownership: clone(config.ownership ?? {}),
    relationships: clone(config.relationships ?? {}),
    crimeReports: [],
    history: []
  };
}

function relationshipKey(a, b) {
  return [String(a), String(b)].sort().join("::");
}

function indexesFact(fact, query = {}) {
  if (query.entityId && !fact.entityIds.includes(String(query.entityId)) && fact.sourceId !== String(query.entityId) && fact.targetId !== String(query.entityId)) return false;
  if (query.type && fact.type !== String(query.type)) return false;
  if (query.tag && !fact.tags.includes(String(query.tag))) return false;
  if (query.textIncludes && !fact.text.includes(String(query.textIncludes))) return false;
  return true;
}

export function createRpgSocialFactKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const SocialFactState = defineResource(config.resourceName ?? "rpgSocialFacts.state");
  const FactSet = defineEvent("rpgSocialFacts.factSet");
  const FactCleared = defineEvent("rpgSocialFacts.factCleared");
  const OwnershipSet = defineEvent("rpgSocialFacts.ownershipSet");
  const ItemStolen = defineEvent("rpgSocialFacts.itemStolen");
  const ItemReturned = defineEvent("rpgSocialFacts.itemReturned");
  const RelationshipChanged = defineEvent("rpgSocialFacts.relationshipChanged");
  const CrimeReported = defineEvent("rpgSocialFacts.crimeReported");
  const Reset = defineEvent("rpgSocialFacts.reset");

  return defineRuntimeKit({
    id: config.kitId ?? "rpg-social-fact-kit",
    provides: ["rpg:social-facts", "rpg:ownership", "rpg:relationships", "rpg:crime-facts"],
    resources: { SocialFactState },
    events: { FactSet, FactCleared, OwnershipSet, ItemStolen, ItemReturned, RelationshipChanged, CrimeReported, Reset },
    systems: [],
    initWorld({ world }) { world.setResource(SocialFactState, initialState(config)); },
    install({ engine, world }) {
      engine.socialFacts = {
        resources: { SocialFactState },
        events: { FactSet, FactCleared, OwnershipSet, ItemStolen, ItemReturned, RelationshipChanged, CrimeReported, Reset },
        setFact(fact = {}) {
          const state = world.getResource(SocialFactState) ?? initialState(config);
          const normalized = normalizeFact(fact);
          const next = { ...state, facts: { ...state.facts, [normalized.id]: normalized }, history: [{ type: "fact-set", id: normalized.id }, ...state.history].slice(0, 64) };
          world.setResource(SocialFactState, next);
          world.emit(FactSet, { fact: normalized });
          engine.perception?.recordFact?.(normalized);
          return clone(normalized);
        },
        clearFact(factId, reason = "cleared") {
          const state = world.getResource(SocialFactState) ?? initialState(config);
          const facts = { ...state.facts };
          delete facts[factId];
          world.setResource(SocialFactState, { ...state, facts, history: [{ type: "fact-cleared", id: factId, reason }, ...state.history].slice(0, 64) });
          world.emit(FactCleared, { factId, reason });
          return true;
        },
        hasFact(factId) { return Boolean(world.getResource(SocialFactState)?.facts?.[factId]); },
        queryFacts(query = {}) { return clone(Object.values(world.getResource(SocialFactState)?.facts ?? {}).filter((fact) => indexesFact(fact, query))); },
        setOwnership(itemId, ownerId, payload = {}) {
          const state = world.getResource(SocialFactState) ?? initialState(config);
          const ownership = { ...state.ownership, [itemId]: { itemId: String(itemId), ownerId: String(ownerId), holderId: payload.holderId == null ? null : String(payload.holderId), stolen: Boolean(payload.stolen), metadata: clone(payload.metadata ?? {}) } };
          world.setResource(SocialFactState, { ...state, ownership });
          world.emit(OwnershipSet, { itemId, ownerId, payload });
          return clone(ownership[itemId]);
        },
        markStolen(itemId, thiefId, witnessId = null) {
          const state = world.getResource(SocialFactState) ?? initialState(config);
          const current = state.ownership[itemId] ?? { itemId: String(itemId), ownerId: null };
          const entry = { ...current, itemId: String(itemId), holderId: String(thiefId), stolen: true, thiefId: String(thiefId), witnessId: witnessId == null ? null : String(witnessId) };
          const fact = normalizeFact({ id: `${itemId}.stolen`, type: "theft", text: `${thiefId} stole ${itemId}`, sourceId: thiefId, targetId: itemId, entityIds: [thiefId, itemId, current.ownerId, witnessId].filter(Boolean), tags: ["crime", "theft", "stolen"], severity: 1 });
          const next = { ...state, ownership: { ...state.ownership, [itemId]: entry }, facts: { ...state.facts, [fact.id]: fact }, history: [{ type: "stolen", itemId, thiefId }, ...state.history].slice(0, 64) };
          world.setResource(SocialFactState, next);
          world.emit(ItemStolen, { itemId, thiefId, witnessId, fact });
          engine.perception?.recordFact?.(fact);
          return clone(entry);
        },
        markReturned(itemId, returnerId = null) {
          const state = world.getResource(SocialFactState) ?? initialState(config);
          const current = state.ownership[itemId] ?? { itemId: String(itemId), ownerId: null };
          const entry = { ...current, holderId: current.ownerId, stolen: false, returnedBy: returnerId == null ? null : String(returnerId) };
          const fact = normalizeFact({ id: `${itemId}.returned`, type: "return", text: `${itemId} was returned`, sourceId: returnerId, targetId: itemId, entityIds: [returnerId, itemId, current.ownerId].filter(Boolean), tags: ["returned"] });
          const facts = { ...state.facts, [fact.id]: fact };
          delete facts[`${itemId}.stolen`];
          const next = { ...state, ownership: { ...state.ownership, [itemId]: entry }, facts, history: [{ type: "returned", itemId, returnerId }, ...state.history].slice(0, 64) };
          world.setResource(SocialFactState, next);
          world.emit(ItemReturned, { itemId, returnerId, fact });
          engine.perception?.recordFact?.(fact);
          return clone(entry);
        },
        adjustRelationship(a, b, stat, amount, reason = "adjust") {
          const state = world.getResource(SocialFactState) ?? initialState(config);
          const key = relationshipKey(a, b);
          const current = state.relationships[key] ?? { a: String(a), b: String(b), trust: 0, suspicion: 0, fear: 0, anger: 0 };
          const nextRel = { ...current, [stat]: number(current[stat], 0) + number(amount), lastReason: reason };
          world.setResource(SocialFactState, { ...state, relationships: { ...state.relationships, [key]: nextRel } });
          world.emit(RelationshipChanged, { a, b, stat, amount, relationship: nextRel, reason });
          return clone(nextRel);
        },
        getRelationship(a, b) { return clone(world.getResource(SocialFactState)?.relationships?.[relationshipKey(a, b)] ?? null); },
        reportCrime(event = {}) {
          const state = world.getResource(SocialFactState) ?? initialState(config);
          const report = { id: idOf(event.id, `crime-${state.crimeReports.length + 1}`), type: String(event.type ?? "crime"), actorId: event.actorId == null ? null : String(event.actorId), targetId: event.targetId == null ? null : String(event.targetId), witnessId: event.witnessId == null ? null : String(event.witnessId), severity: number(event.severity, 1), text: String(event.text ?? event.type ?? "crime reported") };
          const fact = normalizeFact({ id: report.id, type: report.type, text: report.text, sourceId: report.actorId, targetId: report.targetId, entityIds: [report.actorId, report.targetId, report.witnessId].filter(Boolean), tags: ["crime", report.type], severity: report.severity });
          world.setResource(SocialFactState, { ...state, crimeReports: [report, ...state.crimeReports].slice(0, 32), facts: { ...state.facts, [fact.id]: fact }, history: [{ type: "crime", id: report.id }, ...state.history].slice(0, 64) });
          world.emit(CrimeReported, { report, fact });
          engine.perception?.recordFact?.(fact);
          return clone(report);
        },
        getOwnership(itemId) { return clone(world.getResource(SocialFactState)?.ownership?.[itemId] ?? null); },
        getState() { return clone(world.getResource(SocialFactState)); },
        reset(payload = {}) {
          const state = initialState({ ...config, ...payload });
          world.setResource(SocialFactState, state);
          world.emit(Reset, { reason: payload.reason ?? "reset" });
          return clone(state);
        }
      };
    },
    metadata: { purpose: "Small RPG social fact domain for ownership, theft, trust, suspicion, and crime facts.", boundary: "Provides social facts to perception and choice kits; does not render or make model calls." }
  });
}

export default createRpgSocialFactKit;
