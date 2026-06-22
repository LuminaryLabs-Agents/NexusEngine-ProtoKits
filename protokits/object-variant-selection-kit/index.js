import { asList, clone, createDefinitionFactory, createSeededRandom, defineInjectedRuntimeKit, ensureResource, number, weightedChoice } from "../protokit-core/index.js";

export const OBJECT_VARIANT_SELECTION_KIT_VERSION = "0.1.0";

export function createObjectVariantSelectionState(options = {}) {
  return { version: OBJECT_VARIANT_SELECTION_KIT_VERSION, seed: String(options.seed ?? "object-variant-selection"), recent: [], recentLimit: Math.max(0, number(options.recentLimit, 12)), history: [] };
}

function candidateWeight(candidate = {}, state = {}, context = {}) {
  let weight = number(candidate.weight, 1) / Math.max(0.1, number(candidate.densityCost, 1));
  if (context.biome && candidate.biomes?.length && candidate.biomes.includes(context.biome)) weight *= 1.4;
  if (state.recent?.includes(candidate.id)) weight *= 0.25;
  if (context.preferFamily && candidate.family === context.preferFamily) weight *= 1.25;
  return Math.max(0.0001, weight);
}

export function pickObjectVariant(candidates = [], state = createObjectVariantSelectionState(), context = {}, seedOrRandom = state.seed) {
  const rng = typeof seedOrRandom?.next === "function" ? seedOrRandom : createSeededRandom(`${seedOrRandom}:${context.patchKey ?? "world"}:${context.slot ?? 0}`);
  const weighted = asList(candidates).map((candidate) => ({ ...candidate, weight: candidateWeight(candidate, state, context) }));
  return clone(weightedChoice(weighted, rng) ?? null);
}

export function createObjectVariantSelectionKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "objectVariantSelection.state");
  const Updated = event("objectVariantSelection.updated");
  const Picked = event("objectVariantSelection.picked");
  const initial = () => createObjectVariantSelectionState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "object-variant-selection-kit",
    resources: { State },
    events: { Updated, Picked },
    requires: ["object:families", "asset:catalog", "vegetation:density-field"],
    provides: ["object:variant-selection", "asset:weighted-object-pick"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const candidatesFor = (query = {}) => {
        const catalog = engine.objaverseCatalog?.query?.(query) ?? [];
        const families = engine.objectFamily?.query?.(query) ?? [];
        const byId = new Map([...catalog, ...families].map((item) => [item.id, item]));
        return Array.from(byId.values());
      };
      const commitPick = (picked, context = {}) => {
        const next = state();
        if (picked?.id) next.recent = [picked.id, ...next.recent.filter((id) => id !== picked.id)].slice(0, next.recentLimit);
        next.history = [{ type: "picked", id: picked?.id ?? null, query: clone(context.query ?? {}) }, ...next.history].slice(0, 96);
        world.setResource(State, next);
        world.emit?.(Picked, { picked: clone(picked), context: clone(context) });
        world.emit?.(Updated, { state: clone(next) });
        return clone(picked);
      };
      const api = {
        getState: state,
        pickVariant(query = {}, context = {}) { const candidates = candidatesFor(query); return commitPick(pickObjectVariant(candidates, state(), { ...context, ...query, query }, context.rng ?? context.seed ?? state().seed), { ...context, query }); },
        pickMany(query = {}, count = 1, context = {}) { const out = []; for (let i = 0; i < count; i += 1) out.push(this.pickVariant(query, { ...context, slot: i })); return out; },
        snapshot: () => clone(state())
      };
      engine.objectVariantSelection = api;
      engine.n ??= {};
      engine.n.objectVariantSelection = api;
    },
    metadata: { version: OBJECT_VARIANT_SELECTION_KIT_VERSION, purpose: "Biome-aware object variant picking with repetition avoidance and density-cost balancing." }
  });
}

export default createObjectVariantSelectionKit;
