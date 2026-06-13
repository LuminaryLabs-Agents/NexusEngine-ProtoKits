import {
  clamp,
  createDefinitions,
  createRng,
  dt,
  ensureState,
  forwardFromRotation,
  len3,
  makeRuntimeKit,
  mul3,
  now,
  num,
  terrainBiome,
  terrainHeight,
  writeState
} from './core.js';

function rightFromYaw(yaw = 0) {
  return { x: Math.cos(num(yaw)), y: 0, z: -Math.sin(num(yaw)) };
}

function addScaled(base = {}, vector = {}, scalar = 1) {
  return {
    x: num(base.x) + num(vector.x) * scalar,
    y: num(base.y) + num(vector.y) * scalar,
    z: num(base.z) + num(vector.z) * scalar
  };
}

function patchCenter(patch = {}, size = 420) {
  return { x: num(patch.px) * size, z: num(patch.pz) * size };
}

function terrainSampleGrid(state, patch, config = {}) {
  const terrain = state.terrain ?? {};
  const size = num(patch.size, num(terrain.patchSize, 420));
  const segments = Math.max(4, Math.floor(num(config.sampleSegments ?? terrain.sampleSegments, 14)));
  const center = patchCenter(patch, size);
  const samples = [];
  for (let gz = 0; gz <= segments; gz += 1) {
    for (let gx = 0; gx <= segments; gx += 1) {
      const x = center.x - size * 0.5 + (gx / segments) * size;
      const z = center.z - size * 0.5 + (gz / segments) * size;
      const y = terrainHeight(terrain, x, z);
      samples.push({ x, y, z, biome: terrainBiome(terrain, x, z) });
    }
  }
  return { samples, sampleSegments: segments };
}

function scatterForPatch(state, patch, config = {}) {
  const terrain = state.terrain ?? {};
  const size = num(patch.size, num(terrain.patchSize, 420));
  const density = num(config.scatterDensity ?? terrain.scatterDensity, 0.000075);
  const originExclusionRadius = num(config.originExclusionRadius ?? terrain.originExclusionRadius, 260);
  const random = createRng(`${state.seed}:aerial-scatter:${patch.id ?? `${patch.px},${patch.pz}`}`);
  const center = patchCenter(patch, size);
  const count = Math.max(0, Math.floor(size * size * density * (0.75 + random() * 0.5)));
  const scatter = [];
  for (let index = 0; index < count; index += 1) {
    const x = center.x + (random() - 0.5) * size;
    const z = center.z + (random() - 0.5) * size;
    if (Math.hypot(x, z) < originExclusionRadius) continue;
    if (terrainBiome(terrain, x, z) !== 'forest') continue;
    const y = terrainHeight(terrain, x, z);
    const variation = 0.72 + random() * 0.66;
    scatter.push({
      id: `scatter-${patch.id ?? `${patch.px},${patch.pz}`}-${index}`,
      type: 'conifer',
      x,
      y,
      z,
      radius: (2.7 + random() * 2.2) * variation,
      height: (9 + random() * 14) * variation,
      rotation: random() * Math.PI * 2
    });
  }
  return scatter;
}

function checkpointVolumes(state) {
  return (state.checkpoints?.items ?? []).map((checkpoint) => ({
    id: checkpoint.id,
    kind: checkpoint.kind ?? 'ring',
    x: num(checkpoint.position?.x),
    y: num(checkpoint.position?.y),
    z: num(checkpoint.position?.z),
    radius: num(checkpoint.radius, 15),
    rotationY: num(checkpoint.rotationY, 0),
    collected: Boolean(checkpoint.collected),
    collectedAt: checkpoint.collectedAt ?? null
  }));
}

function liftVolumes(state) {
  return (state.liftVolumes?.items ?? []).map((volume) => ({
    id: volume.id,
    kind: volume.kind ?? 'thermal',
    x: num(volume.position?.x),
    y: num(volume.position?.y),
    z: num(volume.position?.z),
    radius: num(volume.radius, 26),
    height: num(volume.height, 180),
    lift: num(volume.lift, 16.5)
  }));
}

function activeLiftIds(state, volumes = liftVolumes(state)) {
  const body = state.body ?? {};
  return volumes
    .filter((volume) => {
      const horizontal = Math.hypot(num(body.position?.x) - volume.x, num(body.position?.z) - volume.z);
      const relativeY = num(body.position?.y) - volume.y;
      return horizontal < volume.radius && relativeY > 0 && relativeY < volume.height;
    })
    .map((volume) => volume.id);
}

function buildBodyDescriptor(state) {
  const body = state.body ?? {};
  const ground = terrainHeight(state.terrain, num(body.position?.x), num(body.position?.z));
  return {
    ...body,
    position: { ...(body.position ?? {}) },
    velocity: { ...(body.velocity ?? {}) },
    rotation: { ...(body.rotation ?? {}) },
    speed: num(body.speed, len3(body.velocity)),
    altitude: Math.max(0, num(body.position?.y) - ground),
    grounded: Boolean(body.onGround),
    stalled: Boolean(body.stalled),
    groundHeight: ground
  };
}

export const GENERIC_FLIGHT_CHALLENGE_KIT_DEFINITION = Object.freeze({
  id: 'generic-flight-challenge-kit',
  provides: ['challenge:flight'],
  requires: ['aerial:checkpoint-volume'],
  purpose: 'Generic score, checkpoint count, prompt, completion, and altitude readout.'
});
export function createGenericFlightChallengeKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_FLIGHT_CHALLENGE_KIT_DEFINITION.id,
    provides: GENERIC_FLIGHT_CHALLENGE_KIT_DEFINITION.provides,
    requires: GENERIC_FLIGHT_CHALLENGE_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'generic-flight-challenge-system', system(world) {
      const state = ensureState(world, definitions, config);
      const checkpoints = state.checkpoints?.collectedIds?.length ?? 0;
      const targetCheckpoints = Math.max(1, Math.floor(num(config.targetCheckpoints, 12)));
      const completed = checkpoints >= targetCheckpoints;
      const altitude = buildBodyDescriptor(state).altitude;
      state.challenge = {
        ...(state.challenge ?? {}),
        checkpoints,
        targetCheckpoints,
        score: num(state.checkpoints?.score),
        altitude,
        completed,
        prompt: completed ? 'Challenge complete' : checkpoints > 0 ? 'Chain the next sky ring' : 'Find a glowing sky ring'
      };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { engine.genericFlightChallenge = { getState: () => ensureState(world, definitions, config).challenge }; },
    metadata: GENERIC_FLIGHT_CHALLENGE_KIT_DEFINITION
  });
}

export const GENERIC_FLIGHT_CAMERA_KIT_DEFINITION = Object.freeze({
  id: 'generic-flight-camera-kit',
  provides: ['camera:flight-follow'],
  requires: ['aerial:body'],
  purpose: 'Renderer-neutral chase camera descriptor for aerial traversal.'
});
export function createGenericFlightCameraKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_FLIGHT_CAMERA_KIT_DEFINITION.id,
    provides: GENERIC_FLIGHT_CAMERA_KIT_DEFINITION.provides,
    requires: GENERIC_FLIGHT_CAMERA_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'generic-flight-camera-system', system(world) {
      const state = ensureState(world, definitions, config);
      const body = state.body ?? {};
      const forward = forwardFromRotation(body.rotation);
      const right = rightFromYaw(body.rotation?.yaw);
      const followOffset = { x: 0, y: 4.2, z: 17.5, ...(config.followOffset ?? {}) };
      let position = { ...(body.position ?? {}) };
      position = addScaled(position, right, followOffset.x);
      position = addScaled(position, { x: 0, y: 1, z: 0 }, followOffset.y);
      position = addScaled(position, forward, -followOffset.z);
      const lookAt = addScaled(body.position, forward, num(config.lookAhead, 20));
      const speedFactor = clamp((len3(body.velocity) - num(config.speedThreshold, 55)) / Math.max(1, num(config.maxSpeed, 155) - num(config.speedThreshold, 55)), 0, 1);
      state.camera = { position, lookAt, fov: num(config.fov, 65) + speedFactor * num(config.speedFovBoost, 18), mode: 'flight-follow' };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { engine.genericFlightCamera = { getState: () => ensureState(world, definitions, config).camera }; },
    metadata: GENERIC_FLIGHT_CAMERA_KIT_DEFINITION
  });
}

export const GENERIC_FLIGHT_VFX_KIT_DEFINITION = Object.freeze({
  id: 'generic-flight-vfx-kit',
  provides: ['vfx:flight'],
  requires: ['aerial:body', 'aerial:boost-impulse'],
  purpose: 'Renderer-neutral speed trail, airflow, and boost flash descriptors.'
});
export function createGenericFlightVfxKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_FLIGHT_VFX_KIT_DEFINITION.id,
    provides: GENERIC_FLIGHT_VFX_KIT_DEFINITION.provides,
    requires: GENERIC_FLIGHT_VFX_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'generic-flight-vfx-system', system(world) {
      const state = ensureState(world, definitions, config);
      const random = createRng(`${state.seed}:flight-vfx`);
      const count = Math.max(0, Math.floor(num(config.trailCount, 20)));
      const speed = len3(state.body?.velocity);
      const speedFactor = clamp((speed - num(config.trailSpeedThreshold, 55)) / Math.max(1, num(config.maxSpeed, 155) - num(config.trailSpeedThreshold, 55)), 0, 1);
      const trails = Array.from({ length: count }, (_, index) => ({
        id: `trail-${index}`,
        length: 12 + random() * 18,
        offset: { x: (random() - 0.5) * 70, y: (random() - 0.5) * 36, z: (random() - 0.5) * 80 },
        opacity: speedFactor * (0.1 + random() * 0.12)
      }));
      const lastBoost = num(state.boost?.lastTriggeredAt, -999);
      state.vfx = { trails, speedFactor, boostFlash: clamp(1 - (now(world) - lastBoost) / num(config.boostFlashSeconds, 0.55), 0, 1) };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { engine.genericFlightVfx = { getState: () => ensureState(world, definitions, config).vfx }; },
    metadata: GENERIC_FLIGHT_VFX_KIT_DEFINITION
  });
}

export const GENERIC_FLIGHT_AUDIO_KIT_DEFINITION = Object.freeze({
  id: 'generic-flight-audio-kit',
  provides: ['audio:flight-descriptor'],
  requires: ['aerial:body'],
  purpose: 'Renderer-neutral wind audio gain and filter descriptors.'
});
export function createGenericFlightAudioKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_FLIGHT_AUDIO_KIT_DEFINITION.id,
    provides: GENERIC_FLIGHT_AUDIO_KIT_DEFINITION.provides,
    requires: GENERIC_FLIGHT_AUDIO_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'cleanup', name: 'generic-flight-audio-system', system(world) {
      const state = ensureState(world, definitions, config);
      const norm = clamp(len3(state.body?.velocity) / num(config.maxSpeed, 155), 0, 1);
      state.audio = {
        wind: {
          gain: num(config.minGain, 0.01) + norm * (num(config.maxGain, 0.25) - num(config.minGain, 0.01)),
          frequency: num(config.minFrequency, 110) + norm * (num(config.maxFrequency, 1060) - num(config.minFrequency, 110))
        }
      };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { engine.genericFlightAudio = { getState: () => ensureState(world, definitions, config).audio }; },
    metadata: GENERIC_FLIGHT_AUDIO_KIT_DEFINITION
  });
}

export const GENERIC_AERIAL_RENDER_DESCRIPTOR_KIT_DEFINITION = Object.freeze({
  id: 'generic-aerial-render-descriptor-kit',
  provides: ['render:aerial-descriptors'],
  requires: ['environment:sky', 'world:patch-window', 'aerial:checkpoint-volume', 'aerial:lift-volume', 'ai:flock-agent', 'challenge:flight', 'camera:flight-follow', 'vfx:flight', 'audio:flight-descriptor'],
  purpose: 'Single renderer-facing descriptor snapshot for aerial hosts.'
});
export function createGenericAerialRenderDescriptorKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  function buildDescriptor(world, state) {
    const body = buildBodyDescriptor(state);
    const patches = (state.world?.patches ?? []).map((patch) => {
      const grid = terrainSampleGrid(state, patch, config.terrain ?? config);
      return { ...patch, key: patch.id, ...grid, scatter: scatterForPatch(state, patch, config.terrain ?? config) };
    });
    const checkpoints = checkpointVolumes(state);
    const lifts = liftVolumes(state);
    const activeIds = activeLiftIds(state, lifts);
    return {
      version: state.version,
      elapsed: now(world),
      delta: dt(world),
      sky: state.sky ?? {},
      terrain: state.terrain ?? {},
      body,
      world: { ...(state.world ?? {}), patchCount: patches.length, patches },
      checkpoints: { ...(state.checkpoints ?? {}), volumes: checkpoints },
      liftVolumes: { ...(state.liftVolumes ?? {}), volumes: lifts, activeIds, activeCount: activeIds.length },
      flock: { agents: (state.flock?.agents ?? []).map((agent, index) => ({ ...agent, color: agent.color ?? ['#38bdf8', '#818cf8', '#c084fc', '#10b981', '#f43f5e'][index % 5], flapPhase: now(world) * 13 + index })) },
      challenge: state.challenge ?? {},
      camera: state.camera ?? {},
      vfx: state.vfx ?? {},
      audio: state.audio ?? {}
    };
  }
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_AERIAL_RENDER_DESCRIPTOR_KIT_DEFINITION.id,
    provides: GENERIC_AERIAL_RENDER_DESCRIPTOR_KIT_DEFINITION.provides,
    requires: GENERIC_AERIAL_RENDER_DESCRIPTOR_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'cleanup', name: 'generic-aerial-render-descriptor-system', system(world) {
      const state = ensureState(world, definitions, config);
      state.renderDescriptor = buildDescriptor(world, state);
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) {
      engine.genericAerialRenderDescriptor = {
        getState() {
          const state = ensureState(world, definitions, config);
          return state.renderDescriptor ?? buildDescriptor(world, state);
        },
        getRawState() { return ensureState(world, definitions, config); }
      };
    },
    metadata: GENERIC_AERIAL_RENDER_DESCRIPTOR_KIT_DEFINITION
  });
}
