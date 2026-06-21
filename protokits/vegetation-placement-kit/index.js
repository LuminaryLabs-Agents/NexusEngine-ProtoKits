import { asList, clone, createDefinitionFactory, createSeededRandom, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const VEGETATION_PLACEMENT_KIT_VERSION = "0.1.0";

export function createVegetationPlacementState(options = {}) {
  return { version: VEGETATION_PLACEMENT_KIT_VERSION, seed: String(options.seed ?? "vegetation-placement"), maxPerPatch: Math.max(0, number(options.maxPerPatch, 220)), byPatch: {}, history: [] };
}

const heightAt = (engine, x, z) => typeof engine.terrainSampler?.getHeight === "function" ? number(engine.terrainSampler.getHeight(x, z), 0) : 0;
const biomeAt = (engine, x, z) => engine.terrainSampler?.getBiome?.(x, z) ?? engine.biomeField?.biomeAt?.(x, z)?.id ?? "mixed-forest";
const normalAt = (engine, x, z) => engine.terrainSampler?.getNormal?.(x, z) ?? { x: 0, y: 1, z: 0 };

export function generateVegetationForPatch(engine = {}, patch = {}, state = createVegetationPlacementState()) {
  const key = patch.key ?? `${patch.px ?? patch.x ?? 0},${patch.pz ?? patch.z ?? 0}`;
  const size = number(patch.patchSize ?? patch.size, 100);
  const originX = number(patch.originX, number(patch.px ?? patch.x, 0) * size - size / 2);
  const originZ = number(patch.originZ, number(patch.pz ?? patch.z, 0) * size - size / 2);
  const rng = createSeededRandom(`${state.seed}:${key}`);
  const biome = biomeAt(engine, originX + size * 0.5, originZ + size * 0.5);
  const density = engine.vegetationDensityField?.sample?.(originX + size * 0.5, originZ + size * 0.5, biome) ?? { tree: 0.8, grass: 1 };
  const counts = { tree: Math.min(state.maxPerPatch, Math.floor(18 * number(density.tree, 1))), grass: Math.min(state.maxPerPatch * 2, Math.floor(120 * number(density.grass, 1))) };
  const items = [];
  for (const kind of ["tree", "grass"]) for (let i = 0; i < counts[kind]; i += 1) {
    const x = originX + rng.next() * size;
    const z = originZ + rng.next() * size;
    const normal = normalAt(engine, x, z);
    if (kind === "tree" && number(normal.y, 1) < 0.7) continue;
    const localBiome = biomeAt(engine, x, z);
    const asset = engine.objaverseCatalog?.pickWeighted?.({ kind, biome: localBiome }, rng) ?? null;
    items.push({ id: `${key}:${kind}:${i}`, patchKey: key, kind, assetId: asset?.id ?? null, assetQuery: { kind, biome: localBiome }, position: { x, y: heightAt(engine, x, z), z }, rotationY: rng.next() * Math.PI * 2, scale: 0.55 + rng.next() * (kind === "tree" ? 1.45 : 0.85), biome: localBiome, normal });
  }
  return items;
}

export function createVegetationPlacementKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "vegetationPlacement.state");
  const Generated = event("vegetationPlacement.generated");
  const Updated = event("vegetationPlacement.updated");
  const initial = () => createVegetationPlacementState(options);
  return defineInjectedRuntimeKit(nexusRealtime, { id: options.id ?? "vegetation-placement-kit", resources: { State }, events: { Generated, Updated }, requires: ["terrain:sampler", "biome:field", "vegetation:archetypes"], provides: ["vegetation:placement", "vegetation:patch-instances"], initWorld({ world }) { ensureResource(world, State, initial); }, install({ engine, world }) { const state = () => ensureResource(world, State, initial); const publish = (next, payload = {}) => { world.setResource(State, next); world.emit?.(Updated, { state: clone(next), ...payload }); return clone(next); }; const api = { getState: state, generateForPatch(patch = {}) { const next = state(); const key = patch.key ?? `${patch.px ?? patch.x ?? 0},${patch.pz ?? patch.z ?? 0}`; const instances = generateVegetationForPatch(engine, patch, next); next.byPatch[key] = instances; next.history = [{ type: "generated", patchKey: key, count: instances.length }, ...next.history].slice(0, 64); world.emit?.(Generated, { patchKey: key, instances: clone(instances) }); return publish(next, { patchKey: key }); }, generateForActivePatches() { return asList(engine.worldPatch?.listActive?.()).map((patch) => this.generateForPatch(patch)); }, clearPatch(patchKey) { const next = state(); delete next.byPatch[patchKey]; return publish(next, { patchKey, cleared: true }); }, listInstances(filter = {}) { return Object.values(state().byPatch).flat().filter((item) => (!filter.kind || item.kind === filter.kind) && (!filter.patchKey || item.patchKey === filter.patchKey)).map(clone); }, snapshot: () => clone(state()) }; engine.vegetationPlacement = api; engine.n ??= {}; engine.n.vegetationPlacement = api; }, metadata: { version: VEGETATION_PLACEMENT_KIT_VERSION, purpose: "Seeded renderer-agnostic vegetation placement descriptors over world patches." } });
}

export default createVegetationPlacementKit;
