import { add3, createDefinitions, createRng, dt, ensureState, forwardFromRotation, hashString, installApi, len3, makeRuntimeKit, mul3, norm3, now, num, terrainHeight, terrainNormal, writeState } from './core.js';

const stableUnit = (seed) => (hashString(seed) % 1000003) / 1000003;
const patchId = (px, pz) => `${px},${pz}`;
const queryFrom = (world, config = {}) => {
  const kit = config.terrainKit;
  const resource = kit?.definitions?.resources?.TerrainQuery ?? kit?.resources?.TerrainQuery;
  return resource ? world.getResource(resource) : null;
};
const heightAt = (world, state, config, x, z) => num(queryFrom(world, config)?.heightAt?.(x, z), terrainHeight(state.terrain, x, z));
const normalAt = (world, state, config, x, z) => queryFrom(world, config)?.normalAt?.(x, z) ?? terrainNormal(state.terrain, x, z);
function sample(world, state, config, query, x, z) {
  const y = num(query?.heightAt?.(x, z), terrainHeight(state.terrain, x, z));
  const normal = query?.normalAt?.(x, z) ?? terrainNormal(state.terrain, x, z);
  const material = query?.materialAt?.(x, z) ?? null;
  const terrain = state.terrain ?? {};
  const biome = material === 'rock' ? 'rock'
    : material === 'sand' || material === 'wet-sand' || material === 'seabed' ? 'shore'
    : y < num(terrain.shoreline, -32) ? 'shore'
    : y > num(terrain.timberline, 135) ? 'alpine'
    : (1 - num(normal.y, 1)) > num(terrain.rockSlope, 0.34) ? 'rock'
    : 'forest';
  return { x, y, z, normal, biome, material: material ?? biome };
}
function activeCoords(state, config) {
  const size = num(config.patchSize, num(state.terrain.patchSize, 420));
  const radius = Math.max(0, Math.floor(num(config.renderDistance ?? config.renderRadius, 2)));
  const cx = Math.round(num(state.body?.position?.x) / size);
  const cz = Math.round(num(state.body?.position?.z) / size);
  const coords = [];
  for (let dz = -radius; dz <= radius; dz += 1) for (let dx = -radius; dx <= radius; dx += 1) {
    coords.push({ px: cx + dx, pz: cz + dz, size, priority: Math.abs(dx) + Math.abs(dz) + Math.hypot(dx, dz) * 0.001 });
  }
  coords.sort((a, b) => a.priority - b.priority || a.px - b.px || a.pz - b.pz);
  return { cx, cz, radius, size, coords };
}
function scatter(world, state, config, px, pz, size, query) {
  const count = Math.max(0, Math.round(size * size * num(config.scatterDensity, 0.000075)));
  const key = patchId(px, pz);
  const centerX = px * size, centerZ = pz * size, items = [];
  for (let i = 0; i < count; i += 1) {
    const x = centerX - size / 2 + stableUnit(`${state.seed}:${key}:tree:${i}:x`) * size;
    const z = centerZ - size / 2 + stableUnit(`${state.seed}:${key}:tree:${i}:z`) * size;
    const s = sample(world, state, config, query, x, z);
    if (s.biome !== 'forest' || s.y < num(state.terrain.waterLevel, -42) + 4 || (1 - s.normal.y) > num(config.maxScatterSlope, 0.34)) continue;
    const scale = 0.75 + stableUnit(`${state.seed}:${key}:tree:${i}:s`) * 0.65;
    items.push({ id: `${key}:tree:${i}`, type: 'conifer', x, y: s.y, z, height: (12 + stableUnit(`${state.seed}:${key}:tree:${i}:h`) * 11) * scale, radius: 3.2 * scale, rotation: stableUnit(`${state.seed}:${key}:tree:${i}:r`) * Math.PI * 2 });
  }
  return items;
}\nfunction buildPatch(world, state, config, coord, revision, query) {
  const segments = Math.max(4, Math.floor(num(config.sampleSegments, num(state.terrain.sampleSegments, 28))));
  const centerX = coord.px * coord.size, centerZ = coord.pz * coord.size, samples = [];
  for (let zi = 0; zi <= segments; zi += 1) for (let xi = 0; xi <= segments; xi += 1) {
    const x = centerX - coord.size / 2 + (xi / segments) * coord.size;
    const z = centerZ - coord.size / 2 + (zi / segments) * coord.size;
    samples.push(sample(world, state, config, query, x, z));
  }
  const id = patchId(coord.px, coord.pz);
  return { id, key: id, px: coord.px, pz: coord.pz, size: coord.size, sampleSegments: segments, samples, scatter: scatter(world, state, config, coord.px, coord.pz, coord.size, query), revision, status: 'ready', builtAt: now(world) };
}
export const GENERIC_WORLD_PATCH_KIT_DEFINITION = Object.freeze({ id: 'generic-world-patch-kit', provides: ['world:patch-window', 'world:streaming-descriptors', 'world:patch-registry', 'world:patch-build-queue'], requires: ['terrain:height-sampler', 'aerial:body'], purpose: 'Budgeted deterministic patch registry with baked terrain, material, and scatter descriptors.' });
export function createGenericWorldPatchKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_WORLD_PATCH_KIT_DEFINITION.id, provides: GENERIC_WORLD_PATCH_KIT_DEFINITION.provides, requires: GENERIC_WORLD_PATCH_KIT_DEFINITION.requires, resources: { State: definitions.State },
    systems: [{ phase: 'simulate', name: 'generic-world-patch-system', system(world) {
      const state = ensureState(world, definitions, config);
      const { cx, cz, radius, size, coords } = activeCoords(state, config);
      const query = queryFrom(world, config), queryVersion = query?.queryVersion ?? 0;
      const segments = Math.max(4, Math.floor(num(config.sampleSegments, num(state.terrain.sampleSegments, 28))));
      const revision = `${queryVersion}:${segments}:${size}`;
      const desiredIds = coords.map((c) => patchId(c.px, c.pz)), desired = new Set(desiredIds);
      const previous = state.world ?? {};
      const registry = { ...(previous.patchRegistry ?? Object.fromEntries((previous.patches ?? []).map((p) => [p.id ?? p.key, p]))) };
      const priority = Object.fromEntries(coords.map((c) => [patchId(c.px, c.pz), c.priority]));
      let queue = (previous.buildQueue ?? []).filter((id) => desired.has(id));
      const queued = new Set(queue);
      for (const coord of coords) {
        const id = patchId(coord.px, coord.pz);
        if (registry[id]?.revision === revision || queued.has(id)) continue;
        queue.push(id); queued.add(id);
      }
      queue.sort((a, b) => num(priority[a], 9999) - num(priority[b], 9999) || a.localeCompare(b));
      const first = Object.keys(registry).length === 0;
      const maxBuilds = Math.max(1, Math.floor(num(first ? (config.initialPatchBuilds ?? config.maxPatchBuildsPerTick) : config.maxPatchBuildsPerTick, num(config.patchBuildBudget, 2))));
      let built = 0;
      while (built < maxBuilds && queue.length) {
        const id = queue.shift();
        const coord = coords.find((c) => patchId(c.px, c.pz) === id);
        if (!coord) continue;
        registry[id] = buildPatch(world, state, config, coord, revision, query);
        built += 1;
      }
      const maxCached = Math.max(desiredIds.length, Math.floor(num(config.maxCachedPatches, desiredIds.length + maxBuilds * 8)));
      for (const id of Object.keys(registry).sort()) {
        if (Object.keys(registry).length <= maxCached) break;
        if (!desired.has(id)) delete registry[id];
      }
      const patches = desiredIds.map((id) => registry[id]).filter((p) => p?.revision === revision);
      state.world = { ...previous, center: { px: cx, pz: cz }, radius, patchSize: size, sampleSegments: segments, queryVersion, revision, patchCacheKey: `${cx},${cz}:${radius}:${size}:${revision}`, desiredPatchIds: desiredIds, loadedPatchIds: patches.map((p) => p.id), pendingPatchIds: queue.slice(), buildQueue: queue, patchRegistry: registry, patches, streamingStats: { desired: desiredIds.length, ready: patches.length, pending: queue.length, builtThisTick: built, maxBuildsPerTick: maxBuilds, cached: Object.keys(registry).length, revision } };
      if (built || queue.length || previous.patchCacheKey !== state.world.patchCacheKey || (previous.patches?.length ?? 0) !== patches.length) writeState(world, definitions, state);
    } }],
    install({ engine, world }) {
      installApi(engine, world, definitions, 'genericWorldPatch', config);
      engine.genericWorldPatch.getStreamingState = () => ensureState(world, definitions, config).world?.streamingStats ?? null;
    },
    metadata: GENERIC_WORLD_PATCH_KIT_DEFINITION
  });
}
function checkpointForPatch(world, state, config, patch, index) {
  const seed = `${state.seed}:checkpoint:${patch.id}:${index}`;
  const x = patch.px * patch.size - patch.size / 2 + stableUnit(`${seed}:x`) * patch.size;
  const z = patch.pz * patch.size - patch.size / 2 + stableUnit(`${seed}:z`) * patch.size;
  const y = heightAt(world, state, config, x, z) + num(config.minHeight, 60) + stableUnit(`${seed}:h`) * num(config.heightRange, 130);
  return { id: `checkpoint-${patch.id}-${index}`, position: { x, y, z }, radius: num(config.radius, 15), rotationY: stableUnit(`${seed}:rot`) * Math.PI * 2 };
}
function liftForPatch(world, state, config, patch, index) {
  const seed = `${state.seed}:lift:${patch.id}:${index}`;
  const x = patch.px * patch.size - patch.size / 2 + stableUnit(`${seed}:x`) * patch.size;
  const z = patch.pz * patch.size - patch.size / 2 + stableUnit(`${seed}:z`) * patch.size;
  const y = heightAt(world, state, config, x, z) + num(config.baseHeight, 8);
  return { id: `lift-${patch.id}-${index}`, position: { x, y, z }, radius: num(config.radius, 26), height: num(config.height, 180), lift: num(config.lift, num(config.liftForce, 16.5)) };
}
export const GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION = Object.freeze({ id: 'generic-checkpoint-volume-kit', provides: ['aerial:checkpoint-volume'], requires: ['aerial:body', 'terrain:height-sampler', 'world:patch-window'], purpose: 'Patch-stable airborne ring, gate, and checkpoint volumes.' });
export function createGenericCheckpointVolumeKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, { id: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.id, provides: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.provides, requires: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.requires, events: { CheckpointCollected: definitions.CheckpointCollected }, resources: { State: definitions.State }, systems: [{ phase: 'resolve', name: 'generic-checkpoint-volume-system', system(world) {
    const state = ensureState(world, definitions, config), density = Math.max(0, Math.floor(num(config.density, 2))), collected = new Set(state.checkpoints?.collectedIds ?? []), items = [];
    let hitId = null;
    for (const patch of state.world?.patches ?? []) for (let index = 0; index < density; index += 1) {
      const checkpoint = checkpointForPatch(world, state, config, patch, index); checkpoint.collected = collected.has(checkpoint.id);
      const p = checkpoint.position, distance = Math.hypot(num(state.body.position.x) - p.x, num(state.body.position.y) - p.y, num(state.body.position.z) - p.z);
      if (!checkpoint.collected && distance < checkpoint.radius) { checkpoint.collected = true; checkpoint.collectedAt = now(world); collected.add(checkpoint.id); hitId = checkpoint.id; world.emit(definitions.CheckpointCollected, { id: checkpoint.id }); }
      items.push(checkpoint);
    }
    if (hitId) state.body.velocity = add3(state.body.velocity, mul3(forwardFromRotation(state.body.rotation), num(config.impulse ?? config.rewardImpulse, 30)));
    state.checkpoints = { ...state.checkpoints, items, collectedIds: Array.from(collected), score: collected.size * num(config.scorePerCheckpoint, 100), recentCollectedId: hitId ?? state.checkpoints?.recentCollectedId ?? null };
    writeState(world, definitions, state);
  } }], install({ engine, world }) { installApi(engine, world, definitions, 'genericCheckpointVolume', config); }, metadata: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION });
}
export const GENERIC_LIFT_VOLUME_KIT_DEFINITION = Object.freeze({ id: 'generic-lift-volume-kit', provides: ['aerial:lift-volume'], requires: ['aerial:body', 'terrain:height-sampler', 'world:patch-window'], purpose: 'Patch-stable thermals, vents, fans, and vertical force columns.' });
export function createGenericLiftVolumeKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, { id: GENERIC_LIFT_VOLUME_KIT_DEFINITION.id, provides: GENERIC_LIFT_VOLUME_KIT_DEFINITION.provides, requires: GENERIC_LIFT_VOLUME_KIT_DEFINITION.requires, resources: { State: definitions.State }, systems: [{ phase: 'resolve', name: 'generic-lift-volume-system', system(world) {
    const state = ensureState(world, definitions, config), density = Math.max(0, Math.floor(num(config.density, 1))), items = [], activeIds = [];
    for (const patch of state.world?.patches ?? []) for (let index = 0; index < density; index += 1) {
      const volume = liftForPatch(world, state, config, patch, index);
      const horizontal = Math.hypot(num(state.body.position.x) - volume.position.x, num(state.body.position.z) - volume.position.z);
      const relativeY = num(state.body.position.y) - volume.position.y;
      if (horizontal < volume.radius && relativeY > 0 && relativeY < volume.height) { state.body.velocity.y += volume.lift * dt(world); activeIds.push(volume.id); }
      items.push(volume);
    }
    state.liftVolumes = { ...state.liftVolumes, items, activeIds }; writeState(world, definitions, state);
  } }], install({ engine, world }) { installApi(engine, world, definitions, 'genericLiftVolume', config); }, metadata: GENERIC_LIFT_VOLUME_KIT_DEFINITION });
}
export const GENERIC_FLOCK_AGENT_KIT_DEFINITION = Object.freeze({ id: 'generic-flock-agent-kit', provides: ['ai:flock-agent'], requires: ['aerial:body', 'terrain:height-sampler'], purpose: 'Ambient companion flock agent state.' });
export function createGenericFlockAgentKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, { id: GENERIC_FLOCK_AGENT_KIT_DEFINITION.id, provides: GENERIC_FLOCK_AGENT_KIT_DEFINITION.provides, requires: GENERIC_FLOCK_AGENT_KIT_DEFINITION.requires, resources: { State: definitions.State }, systems: [{ phase: 'simulate', name: 'generic-flock-agent-system', system(world) {
    const state = ensureState(world, definitions, config), delta = dt(world);
    if (!state.flock.agents.length) {
      const random = createRng(`${state.seed}:flock`);
      state.flock.agents = Array.from({ length: num(config.count, 8) }, (_, index) => { const x = (random() - 0.5) * 260, z = -180 + (random() - 0.5) * 200; return { id: `agent-${index}`, position: { x, y: heightAt(world, state, config, x, z) + 95 + random() * 60, z }, velocity: { x: 0, y: 0, z: -28 }, offset: { x: (random() - 0.5) * 160, y: (random() - 0.5) * 60, z: -70 - random() * 80 }, phase: random() * Math.PI * 2 }; });
    }
    state.flock.agents = state.flock.agents.map((agent) => {
      const target = add3(state.body.position, agent.offset);
      let velocity = add3(agent.velocity, mul3(norm3({ x: target.x - agent.position.x, y: target.y - agent.position.y, z: target.z - agent.position.z }), num(config.followAcceleration, 18) * delta));
      const ground = heightAt(world, state, config, agent.position.x, agent.position.z) + num(config.groundClearance, 22);
      if (agent.position.y < ground) velocity.y += num(config.avoidanceLift, 18) * delta;
      velocity = add3(velocity, mul3(velocity, -num(config.damping, 0.18) * delta));
      if (len3(velocity) > num(config.maxSpeed, 45)) velocity = mul3(norm3(velocity), num(config.maxSpeed, 45));
      return { ...agent, position: add3(agent.position, mul3(velocity, delta)), velocity, phase: num(agent.phase) + delta * num(config.flapRate, 9) };
    });
    writeState(world, definitions, state);
  } }], install({ engine, world }) { installApi(engine, world, definitions, 'genericFlockAgent', config); }, metadata: GENERIC_FLOCK_AGENT_KIT_DEFINITION });
}
