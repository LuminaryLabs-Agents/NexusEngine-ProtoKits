import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const VEGETATION_DENSITY_FIELD_KIT_VERSION = "0.1.0";

export function createVegetationDensityFieldState(options = {}) {
  return { version: VEGETATION_DENSITY_FIELD_KIT_VERSION, seed: String(options.seed ?? "vegetation-density"), baseTreeDensity: number(options.baseTreeDensity, 1), baseGrassDensity: number(options.baseGrassDensity, 1), biome: { meadow: { tree: 0.18, grass: 1.35 }, "mixed-forest": { tree: 0.88, grass: 0.88 }, "dense-forest": { tree: 1.45, grass: 0.58 }, highland: { tree: 0.34, grass: 0.42 }, ...(options.biome ?? {}) } };
}

export function sampleVegetationDensity(x = 0, z = 0, biome = "mixed-forest", state = createVegetationDensityFieldState()) {
  const b = state.biome[biome] ?? state.biome["mixed-forest"] ?? { tree: 1, grass: 1 };
  const noise = Math.sin(x * 0.015 + z * 0.011 + state.seed.length) * 0.5 + 0.5;
  const clearing = Math.sin(x * 0.004 - z * 0.003) * 0.5 + 0.5;
  return { tree: clamp(b.tree * state.baseTreeDensity * (0.65 + noise * 0.55) * (0.72 + clearing * 0.34), 0, 4), grass: clamp(b.grass * state.baseGrassDensity * (0.7 + noise * 0.6), 0, 4), clearing };
}

export function createVegetationDensityFieldKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "vegetationDensityField.state");
  const Updated = event("vegetationDensityField.updated");
  const initial = () => createVegetationDensityFieldState(options);
  return defineInjectedRuntimeKit(nexusEngine, { id: options.id ?? "vegetation-density-field-kit", resources: { State }, events: { Updated }, provides: ["vegetation:density-field", "vegetation:density-sample"], initWorld({ world }) { ensureResource(world, State, initial); }, install({ engine, world }) { const state = () => ensureResource(world, State, initial); const api = { getState: state, sample(x = 0, z = 0, biome = "mixed-forest") { return sampleVegetationDensity(x, z, biome, state()); }, set(config = {}) { const next = { ...state(), ...config, biome: { ...state().biome, ...(config.biome ?? {}) } }; world.setResource(State, next); world.emit?.(Updated, { state: clone(next) }); return clone(next); }, snapshot: () => clone(state()) }; engine.vegetationDensityField = api; engine.n ??= {}; engine.n.vegetationDensityField = api; }, metadata: { version: VEGETATION_DENSITY_FIELD_KIT_VERSION, purpose: "Biome-aware deterministic vegetation density samples for placement kits." } });
}

export default createVegetationDensityFieldKit;
