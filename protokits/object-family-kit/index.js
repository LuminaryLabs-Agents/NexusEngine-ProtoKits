import { asList, clone, createDefinitionFactory, createSeededRandom, defineInjectedRuntimeKit, ensureResource, number, weightedChoice } from "../protokit-core/index.js";

export const OBJECT_FAMILY_KIT_VERSION = "0.1.0";

export function normalizeObjectFamily(input = {}, index = 0) {
  const id = String(input.id ?? input.assetId ?? input.species ?? `object-family-${index + 1}`);
  return {
    id,
    kind: String(input.kind ?? input.type ?? "object"),
    family: String(input.family ?? input.category ?? input.kind ?? "object"),
    species: input.species ?? null,
    biomes: asList(input.biomes ?? input.biome).map(String),
    tags: asList(input.tags).map(String),
    weight: number(input.weight, 1),
    densityCost: number(input.densityCost, 1),
    renderClass: input.renderClass ?? input.kind ?? "object",
    size: clone(input.size ?? { heightRange: input.heightRange ?? null, radiusRange: input.radiusRange ?? null }),
    metadata: clone(input.metadata ?? {})
  };
}

export function createObjectFamilyState(options = {}) {
  const families = asList(options.families ?? options.assets).map(normalizeObjectFamily);
  return { version: OBJECT_FAMILY_KIT_VERSION, families: Object.fromEntries(families.map((item) => [item.id, item])), history: [] };
}

export function queryObjectFamilies(state = {}, filter = {}) {
  return Object.values(state.families ?? {}).filter((item) => {
    if (filter.id && item.id !== filter.id) return false;
    if (filter.kind && item.kind !== filter.kind) return false;
    if (filter.family && item.family !== filter.family) return false;
    if (filter.species && item.species !== filter.species) return false;
    if (filter.biome && item.biomes.length && !item.biomes.includes(filter.biome)) return false;
    if (filter.tag && !item.tags.includes(filter.tag)) return false;
    return true;
  }).map(clone);
}

export function createObjectFamilyKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "objectFamily.state");
  const Updated = event("objectFamily.updated");
  const Registered = event("objectFamily.registered");
  const initial = () => createObjectFamilyState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "object-family-kit",
    resources: { State },
    events: { Updated, Registered },
    provides: ["object:families", "object:family-query"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const publish = (next, evt = null) => { next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 64) : next.history; world.setResource(State, next); world.emit?.(Updated, { state: clone(next), event: clone(evt) }); return clone(next); };
      const api = {
        getState: state,
        registerFamily(family = {}) { const next = state(); const item = normalizeObjectFamily(family, Object.keys(next.families).length); next.families[item.id] = item; world.emit?.(Registered, { family: clone(item) }); return publish(next, { type: "registered", id: item.id }); },
        registerMany(families = []) { return asList(families).map((family) => this.registerFamily(family)); },
        query(filter = {}) { return queryObjectFamilies(state(), filter); },
        pick(filter = {}, seedOrRandom = "object-family") { const rng = typeof seedOrRandom?.next === "function" ? seedOrRandom : createSeededRandom(String(seedOrRandom)); return clone(weightedChoice(this.query(filter), rng) ?? null); },
        get(id, fallback = null) { return clone(state().families?.[id] ?? fallback); },
        snapshot: () => clone(state())
      };
      engine.objectFamily = api;
      engine.n ??= {};
      engine.n.objectFamily = api;
    },
    metadata: { version: OBJECT_FAMILY_KIT_VERSION, purpose: "Semantic object family registry for Objaverse-derived and procedural world objects." }
  });
}

export default createObjectFamilyKit;
