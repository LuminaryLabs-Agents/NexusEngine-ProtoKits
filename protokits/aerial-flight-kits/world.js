import { add3, createDefinitions, createRng, dt, ensureState, forwardFromRotation, hashString, installApi, len3, makeRuntimeKit, mul3, norm3, now, num, terrainHeight, terrainNormal, writeState } from './core.js';

const u = (s) => (hashString(s) % 1000003) / 1000003;
const pid = (x, z) => `${x},${z}`;
const h = (state, x, z) => terrainHeight(state.terrain, x, z);
const sample = (state, x, z) => {
  const y = h(state, x, z);
  const normal = terrainNormal(state.terrain, x, z);
  const t = state.terrain ?? {};
  const biome = y < num(t.shoreline, -32) ? 'shore' : y > num(t.timberline, 135) ? 'alpine' : (1 - num(normal.y, 1)) > num(t.rockSlope, 0.34) ? 'rock' : 'forest';
  return { x, y, z, normal, biome, material: biome };
};
const coordsFor = (state, config) => {
  const size = num(config.patchSize, num(state.terrain.patchSize, 420));
  const radius = Math.max(0, Math.floor(num(config.renderDistance ?? config.renderRadius, 2)));
  const cx = Math.round(num(state.body?.position?.x) / size);
  const cz = Math.round(num(state.body?.position?.z) / size);
  const coords = [];
  for (let dz = -radius; dz <= radius; dz += 1) for (let dx = -radius; dx <= radius; dx += 1) coords.push({ px: cx + dx, pz: cz + dz, size, p: Math.abs(dx) + Math.abs(dz) });
  coords.sort((a, b) => a.p - b.p || a.px - b.px || a.pz - b.pz);
  return { cx, cz, radius, size, coords };
};
const makePatch = (state, config, c, revision) => {
  const segments = Math.max(4, Math.floor(num(config.sampleSegments, num(state.terrain.sampleSegments, 28))));
  const samples = [];
  for (let zi = 0; zi <= segments; zi += 1) for (let xi = 0; xi <= segments; xi += 1) {
    const x = c.px * c.size - c.size / 2 + (xi / segments) * c.size;
    const z = c.pz * c.size - c.size / 2 + (zi / segments) * c.size;
    samples.push(sample(state, x, z));
  }
  const key = pid(c.px, c.pz);
  return { id: key, key, px: c.px, pz: c.pz, size: c.size, sampleSegments: segments, samples, scatter: [], revision };
};

export const GENERIC_WORLD_PATCH_KIT_DEFINITION = Object.freeze({ id: 'generic-world-patch-kit', provides: ['world:patch-window', 'world:streaming-descriptors', 'world:patch-registry', 'world:patch-build-queue'], requires: ['terrain:height-sampler', 'aerial:body'], purpose: 'Budgeted deterministic patch registry.' });
export function createGenericWorldPatchKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, { id: GENERIC_WORLD_PATCH_KIT_DEFINITION.id, provides: GENERIC_WORLD_PATCH_KIT_DEFINITION.provides, requires: GENERIC_WORLD_PATCH_KIT_DEFINITION.requires, resources: { State: definitions.State }, systems: [{ phase: 'simulate', name: 'generic-world-patch-system', system(world) {
    const state = ensureState(world, definitions, config);
    const { cx, cz, radius, size, coords } = coordsFor(state, config);
    const segments = Math.max(4, Math.floor(num(config.sampleSegments, num(state.terrain.sampleSegments, 28))));
    const revision = `${segments}:${size}`;
    const desired = coords.map((c) => pid(c.px, c.pz));
    const set = new Set(desired);
    const prev = state.world ?? {};
    const registry = { ...(prev.patchRegistry ?? Object.fromEntries((prev.patches ?? []).map((p) => [p.id ?? p.key, p]))) };
    let queue = (prev.buildQueue ?? []).filter((key) => set.has(key));
    for (const c of coords) if (registry[pid(c.px, c.pz)]?.revision !== revision && !queue.includes(pid(c.px, c.pz))) queue.push(pid(c.px, c.pz));
    const budget = Math.max(1, Math.floor(num(config.maxPatchBuildsPerTick, num(config.patchBuildBudget, 2))));
    let built = 0;
    while (built < budget && queue.length) {
      const key = queue.shift();
      const c = coords.find((entry) => pid(entry.px, entry.pz) === key);
      if (c) { registry[key] = makePatch(state, config, c, revision); built += 1; }
    }
    for (const key of Object.keys(registry)) if (!set.has(key) && Object.keys(registry).length > Math.max(desired.length, num(config.maxCachedPatches, desired.length + 16))) delete registry[key];
    const patches = desired.map((key) => registry[key]).filter((p) => p?.revision === revision);
    state.world = { ...prev, center: { px: cx, pz: cz }, radius, patchSize: size, desiredPatchIds: desired, loadedPatchIds: patches.map((p) => p.id), pendingPatchIds: queue.slice(), buildQueue: queue, patchRegistry: registry, patches, patchCacheKey: `${cx},${cz}:${radius}:${size}:${revision}`, streamingStats: { desired: desired.length, ready: patches.length, pending: queue.length, builtThisTick: built, maxBuildsPerTick: budget, cached: Object.keys(registry).length } };
    if (built || queue.length || prev.patchCacheKey !== state.world.patchCacheKey) writeState(world, definitions, state);
  } }], install({ engine, world }) { installApi(engine, world, definitions, 'genericWorldPatch', config); engine.genericWorldPatch.getStreamingState = () => ensureState(world, definitions, config).world?.streamingStats ?? null; }, metadata: GENERIC_WORLD_PATCH_KIT_DEFINITION });
}

const cp = (state, config, patch, index) => {
  const s = `${state.seed}:checkpoint:${patch.id}:${index}`;
  const x = patch.px * patch.size - patch.size / 2 + u(`${s}:x`) * patch.size;
  const z = patch.pz * patch.size - patch.size / 2 + u(`${s}:z`) * patch.size;
  return { id: `checkpoint-${patch.id}-${index}`, position: { x, y: h(state, x, z) + num(config.minHeight, 60) + u(`${s}:h`) * num(config.heightRange, 130), z }, radius: num(config.radius, 15), rotationY: u(`${s}:r`) * Math.PI * 2 };
};
export const GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION = Object.freeze({ id: 'generic-checkpoint-volume-kit', provides: ['aerial:checkpoint-volume'], requires: ['aerial:body', 'terrain:height-sampler', 'world:patch-window'], purpose: 'Patch-stable checkpoint volumes.' });
export function createGenericCheckpointVolumeKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, { id: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.id, provides: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.provides, requires: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.requires, events: { CheckpointCollected: definitions.CheckpointCollected }, resources: { State: definitions.State }, systems: [{ phase: 'resolve', name: 'generic-checkpoint-volume-system', system(world) {
    const state = ensureState(world, definitions, config), collected = new Set(state.checkpoints?.collectedIds ?? []), items = [];
    let hitId = null;
    for (const patch of state.world?.patches ?? []) for (let i = 0; i < Math.max(0, Math.floor(num(config.density, 2))); i += 1) {
      const c = cp(state, config, patch, i); c.collected = collected.has(c.id);
      const p = c.position;
      if (!c.collected && Math.hypot(num(state.body.position.x) - p.x, num(state.body.position.y) - p.y, num(state.body.position.z) - p.z) < c.radius) { c.collected = true; collected.add(c.id); hitId = c.id; world.emit(definitions.CheckpointCollected, { id: c.id }); }
      items.push(c);
    }
    if (hitId) state.body.velocity = add3(state.body.velocity, mul3(forwardFromRotation(state.body.rotation), num(config.impulse ?? config.rewardImpulse, 30)));
    state.checkpoints = { ...state.checkpoints, items, collectedIds: Array.from(collected), score: collected.size * num(config.scorePerCheckpoint, 100), recentCollectedId: hitId ?? state.checkpoints?.recentCollectedId ?? null };
    writeState(world, definitions, state);
  } }], install({ engine, world }) { installApi(engine, world, definitions, 'genericCheckpointVolume', config); }, metadata: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION });
}

const lift = (state, config, patch, index) => {
  const s = `${state.seed}:lift:${patch.id}:${index}`;
  const x = patch.px * patch.size - patch.size / 2 + u(`${s}:x`) * patch.size;
  const z = patch.pz * patch.size - patch.size / 2 + u(`${s}:z`) * patch.size;
  return { id: `lift-${patch.id}-${index}`, position: { x, y: h(state, x, z) + num(config.baseHeight, 8), z }, radius: num(config.radius, 26), height: num(config.height, 180), lift: num(config.lift, num(config.liftForce, 16.5)) };
};
export const GENERIC_LIFT_VOLUME_KIT_DEFINITION = Object.freeze({ id: 'generic-lift-volume-kit', provides: ['aerial:lift-volume'], requires: ['aerial:body', 'terrain:height-sampler', 'world:patch-window'], purpose: 'Patch-stable lift volumes.' });
export function createGenericLiftVolumeKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, { id: GENERIC_LIFT_VOLUME_KIT_DEFINITION.id, provides: GENERIC_LIFT_VOLUME_KIT_DEFINITION.provides, requires: GENERIC_LIFT_VOLUME_KIT_DEFINITION.requires, resources: { State: definitions.State }, systems: [{ phase: 'resolve', name: 'generic-lift-volume-system', system(world) {
    const state = ensureState(world, definitions, config), items = [], activeIds = [];
    for (const patch of state.world?.patches ?? []) for (let i = 0; i < Math.max(0, Math.floor(num(config.density, 1))); i += 1) {
      const v = lift(state, config, patch, i);
      const horizontal = Math.hypot(num(state.body.position.x) - v.position.x, num(state.body.position.z) - v.position.z), ry = num(state.body.position.y) - v.position.y;
      if (horizontal < v.radius && ry > 0 && ry < v.height) { state.body.velocity.y += v.lift * dt(world); activeIds.push(v.id); }
      items.push(v);
    }
    state.liftVolumes = { ...state.liftVolumes, items, activeIds }; writeState(world, definitions, state);
  } }], install({ engine, world }) { installApi(engine, world, definitions, 'genericLiftVolume', config); }, metadata: GENERIC_LIFT_VOLUME_KIT_DEFINITION });
}

export const GENERIC_FLOCK_AGENT_KIT_DEFINITION = Object.freeze({ id: 'generic-flock-agent-kit', provides: ['ai:flock-agent'], requires: ['aerial:body', 'terrain:height-sampler'], purpose: 'Ambient companion flock agent state.' });
export function createGenericFlockAgentKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, { id: GENERIC_FLOCK_AGENT_KIT_DEFINITION.id, provides: GENERIC_FLOCK_AGENT_KIT_DEFINITION.provides, requires: GENERIC_FLOCK_AGENT_KIT_DEFINITION.requires, resources: { State: definitions.State }, systems: [{ phase: 'simulate', name: 'generic-flock-agent-system', system(world) {
    const state = ensureState(world, definitions, config), delta = dt(world);
    if (!state.flock.agents.length) { const r = createRng(`${state.seed}:flock`); state.flock.agents = Array.from({ length: num(config.count, 8) }, (_, i) => ({ id: `agent-${i}`, position: { x: (r() - 0.5) * 260, y: 120 + r() * 60, z: -180 + (r() - 0.5) * 200 }, velocity: { x: 0, y: 0, z: -28 }, offset: { x: (r() - 0.5) * 160, y: (r() - 0.5) * 60, z: -70 - r() * 80 }, phase: r() * Math.PI * 2 })); }
    state.flock.agents = state.flock.agents.map((a) => { const target = add3(state.body.position, a.offset); let velocity = add3(a.velocity, mul3(norm3({ x: target.x - a.position.x, y: target.y - a.position.y, z: target.z - a.position.z }), num(config.followAcceleration, 18) * delta)); if (len3(velocity) > num(config.maxSpeed, 45)) velocity = mul3(norm3(velocity), num(config.maxSpeed, 45)); return { ...a, position: add3(a.position, mul3(velocity, delta)), velocity, phase: num(a.phase) + delta * num(config.flapRate, 9) }; });
    writeState(world, definitions, state);
  } }], install({ engine, world }) { installApi(engine, world, definitions, 'genericFlockAgent', config); }, metadata: GENERIC_FLOCK_AGENT_KIT_DEFINITION });
}
