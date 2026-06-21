import { defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const AERIAL_PATCH_WINDOW_DOMAIN_KIT_VERSION = "0.1.2";

function defineResource(NexusRealtime, name) {
  return typeof NexusRealtime.defineResource === "function" ? NexusRealtime.defineResource(name) : `resource:${name}`;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function patchId(lod, px, pz) {
  return `${lod}:${px},${pz}`;
}

function forwardFromBody(body = {}) {
  const yaw = number(body.rotation?.yaw, 0);
  return { x: Math.sin(yaw), z: Math.cos(yaw) || 1 };
}

function defaultRings(config = {}) {
  const size = number(config.chunkSize ?? config.patchSize, 768);
  return [
    { id: "near", radius: number(config.nearRadius, 2), size, segments: number(config.nearSegments, 64), ahead: number(config.preloadAhead, 4) },
    { id: "mid", radius: number(config.midRadius, 5), size: size * 2, segments: number(config.midSegments, 32), ahead: number(config.preloadAhead, 3) },
    { id: "far", radius: number(config.farRadius, 8), size: size * 4, segments: number(config.farSegments, 14), ahead: number(config.preloadAhead, 2) }
  ];
}

function normalizeRings(config = {}) {
  const raw = Array.isArray(config.lodRings) && config.lodRings.length ? config.lodRings : defaultRings(config);
  const baseSize = number(config.chunkSize ?? config.patchSize ?? raw[0]?.patchSize ?? raw[0]?.size, 768);
  const exclusiveGrid = config.exclusiveGrid !== false;
  return raw.map((ring, index) => ({
    id: ring.id ?? ["near", "mid", "far"][index] ?? `lod-${index}`,
    radius: Math.max(0, Math.floor(number(ring.radius, 1))),
    size: exclusiveGrid ? baseSize : number(ring.patchSize ?? ring.size, baseSize),
    segments: number(ring.sampleSegments ?? ring.segments, index === 0 ? 64 : index === 1 ? 32 : 14),
    ahead: number(ring.preloadAhead ?? ring.ahead, 0),
    exclusiveGrid,
    innerRadius: exclusiveGrid && index > 0 ? Math.max(-1, Math.floor(number(raw[index - 1]?.radius, 0))) : -1
  }));
}

function makePatch(engine, state, ring, index, px, pz, preload = false) {
  const size = number(ring.size, 768);
  const centerX = px * size;
  const centerZ = pz * size;
  const terrain = engine?.canyonTerrain ?? engine?.genericTerrainSampler;
  const patchClass = terrain?.patchAt?.(centerX, centerZ) ?? "red-canyon-floor";
  const material = terrain?.materialAt?.(centerX, centerZ) ?? patchClass;
  const id = patchId(ring.id, px, pz);
  return {
    id,
    key: id,
    lod: ring.id,
    lodIndex: index,
    px,
    pz,
    size,
    center: { x: centerX, z: centerZ },
    sampleSegments: Math.max(2, Math.floor(number(ring.segments, 16))),
    interactive: ring.id === "near",
    visualOnly: ring.id !== "near",
    preload,
    exclusiveGrid: Boolean(ring.exclusiveGrid),
    patch: patchClass,
    material,
    color: terrain?.patchColor?.(patchClass) ?? "#884111",
    materialDescriptorId: "aerialPatchWindow.terrainMaterial",
    revision: `${state.seed}:${id}:${ring.segments}:${size}:${ring.exclusiveGrid ? "exclusive" : "overlap"}`,
    status: "ready",
    builtAt: state.frame
  };
}

function initialState(config = {}, reason = "initialized") {
  return {
    id: config.id ?? "aerial-patch-window",
    version: AERIAL_PATCH_WINDOW_DOMAIN_KIT_VERSION,
    seed: config.seed ?? "sky-rogue-aerial-canyon",
    frame: 0,
    viewer: { x: 0, y: 100, z: 0, forward: { x: 0, z: 1 } },
    patches: [],
    patchRegistry: {},
    desiredPatchIds: [],
    loadedPatchIds: [],
    dirtyPatchIds: [],
    removedPatchIds: [],
    terrainMaterial: { id: "aerialPatchWindow.terrainMaterial", shader: "world-space-canyon-terrain" },
    streamingStats: { reason, desired: 0, ready: 0, dirty: 0, removed: 0, cached: 0, lodCounts: {}, exclusiveGrid: config.exclusiveGrid !== false }
  };
}

export function createAerialPatchWindowDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialPatchWindow.state");
  let installedEngine = null;

  function system(world) {
    const previous = world.getResource(State) ?? initialState(config);
    const state = clone(previous);
    const body = installedEngine?.poweredAerialFlight?.getBody?.() ?? installedEngine?.genericAerialBody?.getActiveBody?.();
    if (body?.position) {
      state.viewer = { x: number(body.position.x), y: number(body.position.y), z: number(body.position.z), forward: forwardFromBody(body) };
    }
    const coordMap = new Map();
    const rings = normalizeRings(config);
    rings.forEach((ring, index) => {
      const cx = Math.round(number(state.viewer.x) / ring.size);
      const cz = Math.round(number(state.viewer.z) / ring.size);
      for (let dz = -ring.radius; dz <= ring.radius; dz += 1) {
        for (let dx = -ring.radius; dx <= ring.radius; dx += 1) {
          if (ring.exclusiveGrid && index > 0 && Math.max(Math.abs(dx), Math.abs(dz)) <= ring.innerRadius) continue;
          const id = patchId(ring.id, cx + dx, cz + dz);
          coordMap.set(id, makePatch(installedEngine, state, ring, index, cx + dx, cz + dz, false));
        }
      }
      for (let step = 1; step <= ring.ahead; step += 1) {
        const px = cx + Math.round(number(state.viewer.forward?.x) * step);
        const pz = cz + Math.round(number(state.viewer.forward?.z, 1) * step);
        const dx = px - cx;
        const dz = pz - cz;
        if (ring.exclusiveGrid && index > 0 && Math.max(Math.abs(dx), Math.abs(dz)) <= ring.innerRadius) continue;
        const id = patchId(ring.id, px, pz);
        coordMap.set(id, makePatch(installedEngine, state, ring, index, px, pz, true));
      }
    });
    const patches = Array.from(coordMap.values()).sort((a, b) => a.lodIndex - b.lodIndex || a.id.localeCompare(b.id));
    const registry = Object.fromEntries(patches.map((patch) => [patch.id, patch]));
    const previousRegistry = state.patchRegistry ?? {};
    const desiredPatchIds = patches.map((patch) => patch.id);
    const desiredSet = new Set(desiredPatchIds);
    const dirtyPatchIds = patches.filter((patch) => previousRegistry[patch.id]?.revision !== patch.revision).map((patch) => patch.id);
    const removedPatchIds = Object.keys(previousRegistry).filter((id) => !desiredSet.has(id));
    const lodCounts = {};
    for (const patch of patches) lodCounts[patch.lod] = (lodCounts[patch.lod] ?? 0) + 1;
    world.setResource(State, {
      ...state,
      frame: number(state.frame) + 1,
      patches,
      patchRegistry: registry,
      desiredPatchIds,
      loadedPatchIds: desiredPatchIds,
      dirtyPatchIds,
      removedPatchIds,
      patchCount: patches.length,
      streamingStats: { desired: desiredPatchIds.length, ready: patches.length, dirty: dirtyPatchIds.length, removed: removedPatchIds.length, cached: Object.keys(registry).length, lodCounts, qualityTier: config.qualityTier ?? "high", exclusiveGrid: config.exclusiveGrid !== false }
    });
  }

  return defineInjectedRuntimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-patch-window-domain-kit",
    requires: ["terrain:height-sampler", "aerial:body"],
    provides: ["world:patch-window", "world:streaming-descriptors", "world:terrain-lod", "render:terrain-material-descriptor"],
    resources: { State },
    systems: [{ phase: "simulate", name: "aerialPatchWindowSystem", system }],
    initWorld({ world }) { world.setResource(State, initialState(config)); },
    install({ engine, world }) {
      installedEngine = engine;
      engine.aerialPatchWindow = {
        getState() { return world.getResource(State); },
        getPatches() { return world.getResource(State)?.patches ?? []; },
        getStats() { return world.getResource(State)?.streamingStats ?? null; },
        reset() { world.setResource(State, initialState(config, "reset")); return world.getResource(State); }
      };
      engine.genericWorldPatch ??= engine.aerialPatchWindow;
      engine.terrainStreamer ??= engine.aerialPatchWindow;
    },
    metadata: { version: AERIAL_PATCH_WINDOW_DOMAIN_KIT_VERSION, domain: "aerial-patch-window", purpose: "Flight-biased exclusive-grid patch window provider for terrain, vegetation, procedural objects and render bundles." }
  });
}

export default createAerialPatchWindowDomainKit;
