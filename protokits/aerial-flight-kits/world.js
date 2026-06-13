import { add3, clamp, createDefinitions, createRng, dt, ensureState, forwardFromRotation, hashString, installApi, len3, makeRuntimeKit, mul3, norm3, now, num, terrainBiome, terrainHeight, terrainNormal, writeState } from './core.js';

function stableUnit(seed) {
  return (hashString(seed) % 1000003) / 1000003;
}

function terrainQueryFromConfig(world, config = {}) {
  const terrainKit = config.terrainKit;
  const queryResource = terrainKit?.definitions?.resources?.TerrainQuery ?? terrainKit?.resources?.TerrainQuery;
  return queryResource ? world.getResource(queryResource) : null;
}

function heightAt(world, state, config, x, z) {
  return num(terrainQueryFromConfig(world, config)?.heightAt?.(x, z), terrainHeight(state.terrain, x, z));
}

function normalAt(world, state, config, x, z) {
  return terrainQueryFromConfig(world, config)?.normalAt?.(x, z) ?? terrainNormal(state.terrain, x, z);
}

function biomeAt(world, state, config, x, z) {
  const material = terrainQueryFromConfig(world, config)?.materialAt?.(x, z);
  if (material === 'sand' || material === 'wet-sand' || material === 'seabed') return 'shore';
  if (material === 'rock') return 'rock';
  return terrainBiome(state.terrain, x, z);
}

function materialAt(world, state, config, x, z) {
  return terrainQueryFromConfig(world, config)?.materialAt?.(x, z) ?? biomeAt(world, state, config, x, z);
}

function activePatchCoordinates(state, config) {
  const size = num(config.patchSize, num(state.terrain.patchSize, 420));
  const radius = Math.max(0, Math.floor(num(config.renderDistance ?? config.renderRadius, 2)));
  const centerX = Math.round(num(state.body?.position?.x) / size);
  const centerZ = Math.round(num(state.body?.position?.z) / size);
  const coords = [];
  for (let dz = -radius; dz <= radius; dz += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      coords.push({ px: centerX + dx, pz: centerZ + dz, size });
    }
  }
  return { centerX, centerZ, size, radius, coords };
}

function createScatterForPatch(world, state, config, px, pz, size) {
  const density = num(config.scatterDensity, 0.000075);
  const count = Math.max(0, Math.round(size * size * density));
  const items = [];
  const key = `${px},${pz}`;
  const centerX = px * size;
  const centerZ = pz * size;
  for (let i = 0; i < count; i += 1) {
    const x = centerX - size / 2 + stableUnit(`${state.seed}:${key}:tree:${i}:x`) * size;
    const z = centerZ - size / 2 + stableUnit(`${state.seed}:${key}:tree:${i}:z`) * size;
    const y = heightAt(world, state, config, x, z);
    const normal = normalAt(world, state, config, x, z);
    const biome = biomeAt(world, state, config, x, z);
    if (biome !== 'forest' || y < num(state.terrain.waterLevel, -42) + 4 || (1 - normal.y) > num(config.maxScatterSlope, 0.34)) continue;
    const scale = 0.75 + stableUnit(`${state.seed}:${key}:tree:${i}:s`) * 0.65;
    items.push({ id: `${key}:tree:${i}`, type: 'conifer', x, y, z, height: (12 + stableUnit(`${state.seed}:${key}:tree:${i}:h`) * 11) * scale, radius: 3.2 * scale, rotation: stableUnit(`${state.seed}:${key}:tree:${i}:r`) * Math.PI * 2 });
  }
  return items;
}

function createPatchDescriptor(world, state, config, px, pz, size) {
  const segments = Math.max(4, Math.floor(num(config.sampleSegments, num(state.terrain.sampleSegments, 28))));
  const centerX = px * size;
  const centerZ = pz * size;
  const samples = [];
  for (let zIndex = 0; zIndex <= segments; zIndex += 1) {
    for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
      const x = centerX - size / 2 + (xIndex / segments) * size;
      const z = centerZ - size / 2 + (zIndex / segments) * size;
      const y = heightAt(world, state, config, x, z);
      const normal = normalAt(world, state, config, x, z);
      const biome = biomeAt(world, state, config, x, z);
      samples.push({ x, y, z, normal, biome, material: materialAt(world, state, config, x, z) });
    }
  }
  const id = `${px},${pz}`;
  return { id, key: id, px, pz, size, sampleSegments: segments, samples, scatter: createScatterForPatch(world, state, config, px, pz, size) };
}

export const GENERIC_WORLD_PATCH_KIT_DEFINITION = Object.freeze({ id: 'generic-world-patch-kit', provides: ['world:patch-window', 'world:streaming-descriptors'], requires: ['terrain:height-sampler', 'aerial:body'], purpose: 'Active deterministic patch window with baked terrain, normal, material, and scatter descriptors.' });
export function createGenericWorldPatchKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_WORLD_PATCH_KIT_DEFINITION.id,
    provides: GENERIC_WORLD_PATCH_KIT_DEFINITION.provides,
    requires: GENERIC_WORLD_PATCH_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'simulate', name: 'generic-world-patch-system', system(world) {
      const state = ensureState(world, definitions, config);
      const { centerX, centerZ, size, radius, coords } = activePatchCoordinates(state, config);
      const queryVersion = terrainQueryFromConfig(world, config)?.queryVersion ?? 0;
      const cacheKey = `${centerX},${centerZ}:${radius}:${size}:${queryVersion}:${num(config.sampleSegments, state.terrain.sampleSegments)}`;
      if (state.world?.patchCacheKey !== cacheKey) {
        state.world = { center: { px: centerX, pz: centerZ }, patches: coords.map(({ px, pz, size }) => createPatchDescriptor(world, state, config, px, pz, size)), patchSize: size, patchCacheKey: cacheKey, queryVersion };
        writeState(world, definitions, state);
      }
    } }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericWorldPatch', config); },
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
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.id,
    provides: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.provides,
    requires: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.requires,
    events: { CheckpointCollected: definitions.CheckpointCollected },
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'generic-checkpoint-volume-system', system(world) {
      const state = ensureState(world, definitions, config);
      const density = Math.max(0, Math.floor(num(config.density, 2)));
      const collected = new Set(state.checkpoints?.collectedIds ?? []);
      const patches = state.world?.patches ?? [];
      const items = [];
      let hitId = null;
      for (const patch of patches) {
        for (let index = 0; index < density; index += 1) {
          const checkpoint = checkpointForPatch(world, state, config, patch, index);
          checkpoint.collected = collected.has(checkpoint.id);
          const p = checkpoint.position;
          const distance = Math.hypot(num(state.body.position.x) - p.x, num(state.body.position.y) - p.y, num(state.body.position.z) - p.z);
          if (!checkpoint.collected && distance < checkpoint.radius) {
            checkpoint.collected = true;
            checkpoint.collectedAt = now(world);
            collected.add(checkpoint.id);
            hitId = checkpoint.id;
            world.emit(definitions.CheckpointCollected, { id: checkpoint.id });
          }
          items.push(checkpoint);
        }
      }
      if (hitId) state.body.velocity = add3(state.body.velocity, mul3(forwardFromRotation(state.body.rotation), num(config.impulse ?? config.rewardImpulse, 30)));
      state.checkpoints = { ...state.checkpoints, items, collectedIds: Array.from(collected), score: collected.size * num(config.scorePerCheckpoint, 100), recentCollectedId: hitId ?? state.checkpoints?.recentCollectedId ?? null };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericCheckpointVolume', config); },
    metadata: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION
  });
}

export const GENERIC_LIFT_VOLUME_KIT_DEFINITION = Object.freeze({ id: 'generic-lift-volume-kit', provides: ['aerial:lift-volume'], requires: ['aerial:body', 'terrain:height-sampler', 'world:patch-window'], purpose: 'Patch-stable thermals, vents, fans, and vertical force columns.' });
export function createGenericLiftVolumeKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_LIFT_VOLUME_KIT_DEFINITION.id,
    provides: GENERIC_LIFT_VOLUME_KIT_DEFINITION.provides,
    requires: GENERIC_LIFT_VOLUME_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'generic-lift-volume-system', system(world) {
      const state = ensureState(world, definitions, config);
      const density = Math.max(0, Math.floor(num(config.density, 1)));
      const items = [];
      const activeIds = [];
      for (const patch of state.world?.patches ?? []) {
        for (let index = 0; index < density; index += 1) {
          const volume = liftForPatch(world, state, config, patch, index);
          const horizontal = Math.hypot(num(state.body.position.x) - volume.position.x, num(state.body.position.z) - volume.position.z);
          const relativeY = num(state.body.position.y) - volume.position.y;
          if (horizontal < volume.radius && relativeY > 0 && relativeY < volume.height) {
            state.body.velocity.y += volume.lift * dt(world);
            activeIds.push(volume.id);
          }
          items.push(volume);
        }
      }
      state.liftVolumes = { ...state.liftVolumes, items, activeIds };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericLiftVolume', config); },
    metadata: GENERIC_LIFT_VOLUME_KIT_DEFINITION
  });
}

export const GENERIC_FLOCK_AGENT_KIT_DEFINITION = Object.freeze({ id: 'generic-flock-agent-kit', provides: ['ai:flock-agent'], requires: ['aerial:body', 'terrain:height-sampler'], purpose: 'Ambient companion flock agent state.' });
export function createGenericFlockAgentKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_FLOCK_AGENT_KIT_DEFINITION.id,
    provides: GENERIC_FLOCK_AGENT_KIT_DEFINITION.provides,
    requires: GENERIC_FLOCK_AGENT_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'simulate', name: 'generic-flock-agent-system', system(world) {
      const state = ensureState(world, definitions, config);
      const delta = dt(world);
      if (!state.flock.agents.length) {
        const random = createRng(`${state.seed}:flock`);
        state.flock.agents = Array.from({ length: num(config.count, 8) }, (_, index) => {
          const x = (random() - 0.5) * 260;
          const z = -180 + (random() - 0.5) * 200;
          return { id: `agent-${index}`, position: { x, y: heightAt(world, state, config, x, z) + 95 + random() * 60, z }, velocity: { x: 0, y: 0, z: -28 }, offset: { x: (random() - 0.5) * 160, y: (random() - 0.5) * 60, z: -70 - random() * 80 }, phase: random() * Math.PI * 2 };
        });
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
    } }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericFlockAgent', config); },
    metadata: GENERIC_FLOCK_AGENT_KIT_DEFINITION
  });
}
