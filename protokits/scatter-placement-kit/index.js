import { asList, clone, createDefinitionFactory, createSeededRandom, defineInjectedRuntimeKit, ensureResource, number, scopedSeed, weightedChoice } from "../protokit-core/index.js";

export const SCATTER_PLACEMENT_KIT_VERSION = "0.1.0";

export const DEFAULT_SCATTER_RULES = Object.freeze([
  { id: "trees", kind: "tree", archetypes: [{ id: "pine", weight: 1 }, { id: "spruce", weight: 0.7 }], densityByBiome: { forest: 1, meadow: 0.28, rocky: 0.08, highland: 0.18 }, maxPerPatch: 72, material: "tree.foliage", layer: "instanced-scatter" },
  { id: "rocks", kind: "rock", archetypes: [{ id: "small-rock", weight: 1 }, { id: "slab-rock", weight: 0.4 }], densityByBiome: { forest: 0.24, meadow: 0.18, rocky: 0.8, highland: 0.55 }, maxPerPatch: 38, material: "terrain.rock", layer: "instanced-scatter" }
]);

export function scatterForPatch(patch = {}, rules = DEFAULT_SCATTER_RULES, options = {}) {
  const terrain = options.terrainSampler;
  const budget = options.performanceBudget;
  const out = [];
  const patchSize = number(patch.patchSize, options.patchSize ?? 500);
  for (const rule of asList(rules)) {
    const rng = createSeededRandom(scopedSeed(options.seed ?? "scatter", patch.seed ?? patch.key, rule.id));
    const biome = patch.biome ?? terrain?.getBiome?.(patch.px * patchSize, patch.pz * patchSize) ?? "default";
    const density = number(rule.densityByBiome?.[biome] ?? rule.density ?? 0.3, 0.3);
    const max = Math.floor(number(rule.maxPerPatch, 24) * density);
    const count = budget?.clampInstances?.(max) ?? max;
    for (let i = 0; i < count; i++) {
      const localX = rng.range(-patchSize / 2, patchSize / 2);
      const localZ = rng.range(-patchSize / 2, patchSize / 2);
      const x = patch.px * patchSize + localX;
      const z = patch.pz * patchSize + localZ;
      const y = terrain?.getHeight?.(x, z) ?? 0;
      const archetype = weightedChoice(rule.archetypes, rng) ?? { id: rule.kind };
      out.push({
        id: `${patch.key}:${rule.id}:${i}`,
        kind: rule.kind,
        archetype: archetype.id ?? archetype.kind ?? rule.kind,
        material: archetype.material ?? rule.material,
        layer: archetype.layer ?? rule.layer ?? "instanced-scatter",
        transform: { x, y, z, rotationY: rng.range(0, Math.PI * 2), scale: rng.range(rule.scaleMin ?? 0.75, rule.scaleMax ?? 1.35) },
        biome,
        patchKey: patch.key,
        seed: rng.seed,
        metadata: { ruleId: rule.id }
      });
    }
  }
  return out;
}

export function createScatterPlacementKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const ScatterPlacementState = resource(options.resourceName ?? "scatterPlacement.state");
  const ScatterGenerated = event("scatterPlacement.generated");
  const initial = () => ({ version: SCATTER_PLACEMENT_KIT_VERSION, seed: options.seed ?? "scatter", rules: asList(options.rules ?? DEFAULT_SCATTER_RULES), byPatch: {} });

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "scatter-placement-kit",
    resources: { ScatterPlacementState },
    events: { ScatterGenerated },
    provides: ["scatter-placement", "seeded-object-placement"],
    initWorld({ world }) { ensureResource(world, ScatterPlacementState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, ScatterPlacementState, initial);
      engine.scatterPlacement = {
        getState: state,
        generateForPatch(patch, extra = {}) {
          const next = state();
          const objects = scatterForPatch(patch, next.rules, { ...options, ...extra, seed: next.seed, terrainSampler: engine.terrainSampler, performanceBudget: engine.performanceBudget });
          next.byPatch[patch.key] = objects;
          world.setResource(ScatterPlacementState, next);
          world.emit(ScatterGenerated, { patchKey: patch.key, objects: clone(objects) });
          return objects.map(clone);
        },
        generateForActivePatches() { return (engine.worldPatch?.listActive?.() ?? []).flatMap((patch) => this.generateForPatch(patch)); },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: SCATTER_PLACEMENT_KIT_VERSION, purpose: "Seeded patch-aware placement descriptors for trees, rocks, clouds, pickups, and hazards." }
  });
}
