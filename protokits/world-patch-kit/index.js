import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number, scopedSeed } from "../protokit-core/index.js";

export const WORLD_PATCH_KIT_VERSION = "0.1.0";

export const patchKey = (px, pz) => `${px},${pz}`;

export function createPatchState(options = {}) {
  return {
    version: WORLD_PATCH_KIT_VERSION,
    seed: options.seed ?? "world-patches",
    patchSize: number(options.patchSize, 500),
    radius: number(options.radius ?? options.renderDistance, 3),
    active: {},
    lastCenter: null,
    history: []
  };
}

export function computeVisiblePatchKeys(position = {}, state = {}) {
  const size = number(state.patchSize, 500);
  const radius = number(state.radius, 3);
  const cx = Math.round(number(position.x) / size);
  const cz = Math.round(number(position.z) / size);
  const keys = [];
  for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) keys.push({ px: cx + dx, pz: cz + dz, key: patchKey(cx + dx, cz + dz) });
  return { center: { px: cx, pz: cz }, keys };
}

export function createWorldPatchKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const WorldPatchState = resource(options.resourceName ?? "worldPatch.state");
  const WorldPatchLoaded = event("worldPatch.loaded");
  const WorldPatchUnloaded = event("worldPatch.unloaded");
  const WorldPatchCenterChanged = event("worldPatch.centerChanged");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "world-patch-kit",
    resources: { WorldPatchState },
    events: { WorldPatchLoaded, WorldPatchUnloaded, WorldPatchCenterChanged },
    provides: ["world-patch", "patch-lifecycle"],
    initWorld({ world }) { ensureResource(world, WorldPatchState, () => createPatchState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, WorldPatchState, () => createPatchState(options));
      const loadPatch = (next, px, pz) => {
        const key = patchKey(px, pz);
        if (next.active[key]) return next.active[key];
        const descriptor = engine.terrainSampler?.getPatchDescriptor?.(px, pz, next.patchSize) ?? { id: `patch:${key}`, px, pz, patchSize: next.patchSize, seed: scopedSeed(next.seed, key) };
        const patch = { ...descriptor, key, status: "active", content: {}, createdAt: next.history.length };
        next.active[key] = patch;
        next.history.push({ type: "loaded", key });
        world.emit(WorldPatchLoaded, { patch: clone(patch) });
        return patch;
      };
      engine.worldPatch = {
        getState: state,
        ensureAround(position = {}) {
          const next = state();
          const visible = computeVisiblePatchKeys(position, next);
          const wanted = new Set(visible.keys.map((entry) => entry.key));
          if (!next.lastCenter || next.lastCenter.px !== visible.center.px || next.lastCenter.pz !== visible.center.pz) world.emit(WorldPatchCenterChanged, { center: visible.center });
          next.lastCenter = visible.center;
          for (const entry of visible.keys) loadPatch(next, entry.px, entry.pz);
          for (const key of Object.keys(next.active)) {
            if (!wanted.has(key)) {
              const patch = next.active[key];
              delete next.active[key];
              next.history.push({ type: "unloaded", key });
              world.emit(WorldPatchUnloaded, { patch: clone(patch) });
            }
          }
          world.setResource(WorldPatchState, next);
          return Object.values(next.active).map(clone);
        },
        getPatch(px, pz) { return clone(state().active[patchKey(px, pz)]); },
        listActive: () => Object.values(state().active).map(clone),
        snapshot: () => clone(state())
      };
    },
    metadata: { version: WORLD_PATCH_KIT_VERSION, purpose: "Generic patch/chunk load, unload, seed, and lifecycle descriptors." }
  });
}
