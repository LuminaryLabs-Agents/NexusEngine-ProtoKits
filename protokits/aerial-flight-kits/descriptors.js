import { clamp, createDefinitions, ensureState, forwardFromRotation, len3, makeRuntimeKit, now, num, terrainHeight, writeState } from './core.js';

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
  if (Array.isArray(state.liftVolumes?.activeIds)) return state.liftVolumes.activeIds.slice();
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
  const fallbackGround = terrainHeight(state.terrain, num(body.position?.x), num(body.position?.z));
  const ground = num(body.lastGroundHeight, fallbackGround);
  return {
    ...body,
    position: { ...(body.position ?? {}) },
    velocity: { ...(body.velocity ?? {}) },
    rotation: { ...(body.rotation ?? {}) },
    forward: forwardFromRotation(body.rotation),
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
    events: { ChallengeCompleted: definitions.ChallengeCompleted },
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'generic-flight-challenge-system', system(world) {
      const state = ensureState(world, definitions, config);
      const checkpoints = state.checkpoints?.collectedIds?.length ?? 0;
      const targetCheckpoints = Math.max(1, Math.floor(num(config.targetCheckpoints, 12)));
      const completed = checkpoints >= targetCheckpoints;
      if (completed && !state.challenge?.completed) world.emit(definitions.ChallengeCompleted, { checkpoints, targetCheckpoints, score: num(state.checkpoints?.score) });
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
      const follow = { distance: num(config.distance, 18), height: num(config.height, 4.4), lookAhead: num(config.lookAhead, 24) };
      const speedFactor = clamp((len3(body.velocity) - num(config.speedThreshold, 55)) / Math.max(1, num(config.maxSpeed, 155) - num(config.speedThreshold, 55)), 0, 1);
      state.camera = {
        position: {
          x: num(body.position?.x) - forward.x * follow.distance,
          y: num(body.position?.y) + follow.height - forward.y * num(config.pitchPullback, 3.2),
          z: num(body.position?.z) - forward.z * follow.distance
        },
        lookAt: {
          x: num(body.position?.x) + forward.x * follow.lookAhead,
          y: num(body.position?.y) + forward.y * follow.lookAhead,
          z: num(body.position?.z) + forward.z * follow.lookAhead
        },
        fov: num(config.fov, 65) + speedFactor * num(config.speedFovBoost, 18),
        mode: 'flight-follow',
        smoothing: num(config.smoothing, 8)
      };
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
      const count = Math.max(0, Math.floor(num(config.trailCount, 20)));
      const speed = len3(state.body?.velocity);
      const speedFactor = clamp((speed - num(config.trailSpeedThreshold, 55)) / Math.max(1, num(config.maxSpeed, 155) - num(config.trailSpeedThreshold, 55)), 0, 1);
      const trails = Array.from({ length: count }, (_, index) => ({
        id: `trail-${index}`,
        length: 12 + (index % 9) * 2,
        offset: { x: ((index * 37) % 70) - 35, y: ((index * 19) % 36) - 18, z: ((index * 53) % 80) - 40 },
        opacity: speedFactor * (0.1 + (index % 5) * 0.02)
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
  requires: ['environment:sky', 'world:streaming-descriptors', 'aerial:checkpoint-volume', 'aerial:lift-volume', 'ai:flock-agent', 'challenge:flight', 'camera:flight-follow', 'vfx:flight', 'audio:flight-descriptor'],
  purpose: 'Single renderer-facing descriptor snapshot for aerial hosts.'
});
export function createGenericAerialRenderDescriptorKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  function buildDescriptor(world, state) {
    const body = buildBodyDescriptor(state);
    const patches = (state.world?.patches ?? []).map((patch) => ({
      ...patch,
      key: patch.key ?? patch.id,
      samples: patch.samples ?? [],
      scatter: patch.scatter ?? [],
      sampleSegments: num(patch.sampleSegments, num(state.terrain?.sampleSegments, 28))
    }));
    const checkpoints = checkpointVolumes(state);
    const lifts = liftVolumes(state);
    const activeIds = activeLiftIds(state, lifts);
    return {
      version: state.version,
      elapsed: now(world),
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
      rig: state.rig ?? {},
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
