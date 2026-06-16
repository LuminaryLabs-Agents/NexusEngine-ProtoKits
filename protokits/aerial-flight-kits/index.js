export * from './core.js';
export * from './environment.js';
export * from './flight.js';
export * from './world.js';
export * from './descriptors.js';
export * from './rig.js';

import { createGenericAtmosphereSkyKit, createGenericFlightInputKit, createGenericTerrainSamplerKit } from './environment.js';
import { createGenericAerialBodyKit, createGenericBoostImpulseKit, createGenericGlidePhysicsKit } from './flight.js';
import { createGenericCheckpointVolumeKit, createGenericFlockAgentKit, createGenericLiftVolumeKit, createGenericWorldPatchKit } from './world.js';
import {
  createGenericAerialRenderDescriptorKit,
  createGenericFlightAudioKit,
  createGenericFlightCameraKit,
  createGenericFlightChallengeKit,
  createGenericFlightVfxKit
} from './descriptors.js';
import {
  createArticulatedRigDescriptorKit,
  createFlightPoseDriverKit,
  createProceduralWingFlapKit,
  createRigAnimationDescriptorKit
} from './rig.js';

export const GENERIC_AERIAL_ADVENTURE_STACK_DEFINITION = Object.freeze({
  id: 'generic-aerial-adventure-stack',
  provides: ['preset:aerial-adventure'],
  requires: [],
  purpose: 'Convenience stack for open-world aerial traversal, lift volumes, companion flocks, gates, articulated rig animation, camera, VFX, audio, challenge state, and render descriptors.'
});

export function createDefaultGenericAerialAdventureConfig(config = {}) {
  const seed = config.seed ?? 'generic-aerial-adventure';
  return {
    seed,
    terrain: {
      seed,
      scale: 0.00145,
      heightScale: 155,
      waterLevel: -45,
      shoreline: -35,
      timberline: 140,
      patchSize: 450,
      sampleSegments: 30,
      renderDistance: 2,
      scatterDensity: 0.000065,
      originExclusionRadius: 280,
      ...(config.terrain ?? {})
    },
    body: {
      spawnAltitude: 125,
      ...(config.body ?? {})
    },
    physics: {
      gravity: 1.28,
      pitchSpeed: 1.22,
      rollSpeed: 1.55,
      diveAcceleration: 34,
      dragCoeff: 0.000045,
      minForwardSpeed: 20,
      forwardRecovery: 7.5,
      maxSpeed: 138,
      clearance: 2.4,
      ...(config.physics ?? {})
    },
    boost: {
      impulse: 42,
      cooldown: 1.35,
      ...(config.boost ?? {})
    },
    world: {
      renderDistance: 2,
      patchSize: 450,
      sampleSegments: 30,
      scatterDensity: 0.000065,
      ...(config.world ?? {})
    },
    checkpoints: {
      count: 54,
      range: 4200,
      minHeight: 76,
      heightRange: 150,
      radius: 18,
      impulse: 24,
      ...(config.checkpoints ?? {})
    },
    liftVolumes: {
      count: 36,
      range: 3800,
      radius: 30,
      height: 190,
      lift: 14.5,
      ...(config.liftVolumes ?? {})
    },
    flock: {
      count: 7,
      ...(config.flock ?? {})
    },
    challenge: {
      targetCheckpoints: 12,
      ...(config.challenge ?? {})
    },
    camera: {
      fov: 65,
      speedFovBoost: 12,
      followOffset: { x: 0, y: 4.8, z: 19.5, ...(config.camera?.followOffset ?? {}) },
      ...(config.camera ?? {})
    },
    vfx: {
      trailCount: 18,
      trailSpeedThreshold: 48,
      ...(config.vfx ?? {})
    },
    rig: {
      wingSpan: 8.6,
      innerWingLength: 3.8,
      outerWingLength: 3.25,
      baseFlapRate: 3.15,
      speedFlapRate: 0.012,
      maxAmplitude: 0.68,
      tipLag: 0.55,
      tipFold: 0.72,
      boostAmplitude: 0.28,
      climbAmplitude: 0.24,
      glideFlattening: 0.82,
      ...(config.rig ?? {})
    },
    audio: {
      maxGain: 0.22,
      ...(config.audio ?? {})
    },
    sky: {
      ...(config.sky ?? {})
    },
    input: {
      ...(config.input ?? {})
    },
    engine: config.engine ?? {}
  };
}

export function createGenericAerialAdventureKits(NexusRealtime, config = {}) {
  const shared = createDefaultGenericAerialAdventureConfig(config);
  return [
    createGenericAtmosphereSkyKit(NexusRealtime, { ...shared, ...(shared.sky ?? {}) }),
    createGenericTerrainSamplerKit(NexusRealtime, shared),
    createGenericFlightInputKit(NexusRealtime, shared),
    createGenericAerialBodyKit(NexusRealtime, shared),
    createGenericGlidePhysicsKit(NexusRealtime, shared),
    createGenericBoostImpulseKit(NexusRealtime, shared),
    createGenericWorldPatchKit(NexusRealtime, { ...shared.terrain, ...shared.world }),
    createGenericCheckpointVolumeKit(NexusRealtime, { ...shared, ...shared.checkpoints }),
    createGenericLiftVolumeKit(NexusRealtime, { ...shared, ...shared.liftVolumes }),
    createGenericFlockAgentKit(NexusRealtime, { ...shared, ...shared.flock }),
    createGenericFlightChallengeKit(NexusRealtime, shared.challenge),
    createGenericFlightCameraKit(NexusRealtime, shared.camera),
    createGenericFlightVfxKit(NexusRealtime, shared.vfx),
    createArticulatedRigDescriptorKit(NexusRealtime, shared.rig),
    createProceduralWingFlapKit(NexusRealtime, shared.rig),
    createFlightPoseDriverKit(NexusRealtime, shared.rig),
    createRigAnimationDescriptorKit(NexusRealtime, shared.rig),
    createGenericFlightAudioKit(NexusRealtime, shared.audio),
    createGenericAerialRenderDescriptorKit(NexusRealtime, shared)
  ];
}

export function createGenericAerialAdventureGame(NexusRealtime, config = {}) {
  return NexusRealtime.createRealtimeGame({ ...(config.engine ?? {}), kits: createGenericAerialAdventureKits(NexusRealtime, config) });
}

export default createGenericAerialAdventureKits;
