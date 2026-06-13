import { add3, createDefinitions, createRng, dt, ensureState, forwardFromRotation, installApi, len3, makeRuntimeKit, mul3, norm3, now, num, terrainBiome, terrainHeight, writeState } from './core.js';

export const GENERIC_WORLD_PATCH_KIT_DEFINITION = Object.freeze({ id: 'generic-world-patch-kit', provides: ['world:patch-window', 'world:streaming-descriptors'], requires: ['terrain:height-sampler', 'aerial:body'], purpose: 'Active deterministic patch window and scatter descriptors.' });
export function createGenericWorldPatchKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_WORLD_PATCH_KIT_DEFINITION.id,
    provides: GENERIC_WORLD_PATCH_KIT_DEFINITION.provides,
    requires: GENERIC_WORLD_PATCH_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'simulate', name: 'generic-world-patch-system', system(world) {
      const state = ensureState(world, definitions, config);
      const size = num(config.patchSize, num(state.terrain.patchSize, 420));
      const radius = Math.max(0, Math.floor(num(config.renderDistance, 2)));
      const centerX = Math.round(state.body.position.x / size);
      const centerZ = Math.round(state.body.position.z / size);
      const patches = [];
      for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
        const px = centerX + dx;
        const pz = centerZ + dz;
        patches.push({ id: `${px},${pz}`, px, pz, size, biome: terrainBiome(state.terrain, px * size, pz * size) });
      }
      state.world = { center: { px: centerX, pz: centerZ }, patches, patchSize: size };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericWorldPatch', config); },
    metadata: GENERIC_WORLD_PATCH_KIT_DEFINITION
  });
}

function ensurePoints(state, field, prefix, count, range, make) {
  if (state[field].items?.length) return;
  const random = createRng(`${state.seed}:${prefix}`);
  const items = [];
  for (let index = 0; index < count; index++) {
    const x = (random() - 0.5) * range;
    const z = (random() - 0.5) * range;
    items.push(make(index, x, z, random));
  }
  state[field] = { items };
}

export const GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION = Object.freeze({ id: 'generic-checkpoint-volume-kit', provides: ['aerial:checkpoint-volume'], requires: ['aerial:body', 'terrain:height-sampler'], purpose: 'Deterministic airborne ring, gate, and checkpoint volumes.' });
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
      ensurePoints(state, 'checkpoints', 'checkpoints', num(config.count, 72), num(config.range, 3800), (index, x, z, random) => ({ id: `checkpoint-${index}`, position: { x, y: terrainHeight(state.terrain, x, z) + num(config.minHeight, 60) + random() * num(config.heightRange, 130), z }, radius: num(config.radius, 15), collected: false }));
      let hit = false;
      state.checkpoints.items = state.checkpoints.items.map((checkpoint) => {
        const p = checkpoint.position;
        const distance = Math.hypot(state.body.position.x - p.x, state.body.position.y - p.y, state.body.position.z - p.z);
        if (!checkpoint.collected && distance < checkpoint.radius) {
          hit = true;
          world.emit(definitions.CheckpointCollected, { id: checkpoint.id });
          return { ...checkpoint, collected: true, collectedAt: now(world) };
        }
        return checkpoint;
      });
      state.checkpoints.collectedIds = state.checkpoints.items.filter((item) => item.collected).map((item) => item.id);
      state.checkpoints.score = state.checkpoints.collectedIds.length * num(config.scorePerCheckpoint, 100);
      if (hit) state.body.velocity = add3(state.body.velocity, mul3(forwardFromRotation(state.body.rotation), num(config.impulse, 26)));
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericCheckpointVolume', config); },
    metadata: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION
  });
}

export const GENERIC_LIFT_VOLUME_KIT_DEFINITION = Object.freeze({ id: 'generic-lift-volume-kit', provides: ['aerial:lift-volume'], requires: ['aerial:body', 'terrain:height-sampler'], purpose: 'Thermals, vents, fans, and vertical force columns.' });
export function createGenericLiftVolumeKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_LIFT_VOLUME_KIT_DEFINITION.id,
    provides: GENERIC_LIFT_VOLUME_KIT_DEFINITION.provides,
    requires: GENERIC_LIFT_VOLUME_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'generic-lift-volume-system', system(world) {
      const state = ensureState(world, definitions, config);
      ensurePoints(state, 'liftVolumes', 'lift', num(config.count, 48), num(config.range, 3600), (index, x, z) => ({ id: `lift-${index}`, position: { x, y: terrainHeight(state.terrain, x, z) + 8, z }, radius: num(config.radius, 26), height: num(config.height, 180), lift: num(config.lift, 16.5) }));
      for (const volume of state.liftVolumes.items) {
        const horizontal = Math.hypot(state.body.position.x - volume.position.x, state.body.position.z - volume.position.z);
        const relativeY = state.body.position.y - volume.position.y;
        if (horizontal < volume.radius && relativeY > 0 && relativeY < volume.height) {
          state.body.velocity.y += volume.lift * dt(world);
          break;
        }
      }
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
      if (!state.flock.agents.length) {
        const random = createRng(`${state.seed}:flock`);
        state.flock.agents = Array.from({ length: num(config.count, 8) }, (_, index) => ({ id: `agent-${index}`, position: { x: (random() - 0.5) * 260, y: 100 + random() * 60, z: -180 + (random() - 0.5) * 200 }, velocity: { x: 0, y: 0, z: -28 }, offset: { x: (random() - 0.5) * 160, y: (random() - 0.5) * 60, z: -70 - random() * 80 } }));
      }
      state.flock.agents = state.flock.agents.map((agent) => {
        const target = add3(state.body.position, agent.offset);
        let velocity = add3(agent.velocity, mul3(norm3({ x: target.x - agent.position.x, y: target.y - agent.position.y, z: target.z - agent.position.z }), 18 * dt(world)));
        if (len3(velocity) > 45) velocity = mul3(norm3(velocity), 45);
        return { ...agent, position: add3(agent.position, mul3(velocity, dt(world))), velocity };
      });
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericFlockAgent', config); },
    metadata: GENERIC_FLOCK_AGENT_KIT_DEFINITION
  });
}
