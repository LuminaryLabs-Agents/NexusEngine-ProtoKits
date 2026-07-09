export * from './core.js';
export * from './environment.js';
export * from './flight.js';
export * from './world.js';
export * from './descriptors.js';
export * from './rig.js';
export * from './weather.js';
export * from './sky-cycle.js';

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
import {
  createAtmosphericWeatherKit,
  createVolumetricLightingKit
} from './weather.js';
import { createSkyCycleKit } from './sky-cycle.js';

export const GENERIC_AERIAL_ADVENTURE_STACK_DEFINITION = Object.freeze({
  id: 'generic-aerial-adventure-stack',
  provides: ['preset:aerial-adventure'],
  requires: [],
  purpose: 'Convenience stack for open-world aerial traversal, lift volumes, companion flocks, gates, articulated rig animation, atmospheric weather, volumetric lighting, optional sky cycle, camera, VFX, audio, challenge state, and render descriptors.'
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
    weather: {
      fogDensity: 0.00105,
      hazeDensity: 0.00072,
      cloudOpacity: 0.32,
      windSpeed: 18,
      ...(config.weather ?? {})
    },
    lighting: {
      sunPower: 1.15,
      anisotropy: 0.42,
      godRays: true,
      ...(config.lighting ?? {})
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

export function createGenericAerialAdventureKits(NexusEngine, config = {}) {
  const shared = createDefaultGenericAerialAdventureConfig(config);
  return [
    createGenericAtmosphereSkyKit(NexusEngine, { ...shared, ...(shared.sky ?? {}) }),
    ...((shared.sky?.dayNightCycle || shared.sky?.dayLengthSeconds) ? [createSkyCycleKit(NexusEngine, shared.sky)] : []),
    createGenericTerrainSamplerKit(NexusEngine, shared),
    createGenericFlightInputKit(NexusEngine, shared),
    createGenericAerialBodyKit(NexusEngine, shared),
    createGenericGlidePhysicsKit(NexusEngine, shared),
    createGenericBoostImpulseKit(NexusEngine, shared),
    createGenericWorldPatchKit(NexusEngine, { ...shared.terrain, ...shared.world }),
    createGenericCheckpointVolumeKit(NexusEngine, { ...shared, ...shared.checkpoints }),
    createGenericLiftVolumeKit(NexusEngine, { ...shared, ...shared.liftVolumes }),
    createGenericFlockAgentKit(NexusEngine, { ...shared, ...shared.flock }),
    createGenericFlightChallengeKit(NexusEngine, shared.challenge),
    createGenericFlightCameraKit(NexusEngine, shared.camera),
    createGenericFlightVfxKit(NexusEngine, shared.vfx),
    createArticulatedRigDescriptorKit(NexusEngine, shared.rig),
    createProceduralWingFlapKit(NexusEngine, shared.rig),
    createFlightPoseDriverKit(NexusEngine, shared.rig),
    createRigAnimationDescriptorKit(NexusEngine, shared.rig),
    createAtmosphericWeatherKit(NexusEngine, shared.weather),
    createVolumetricLightingKit(NexusEngine, { ...shared.weather, ...shared.lighting }),
    createGenericFlightAudioKit(NexusEngine, shared.audio),
    createGenericAerialRenderDescriptorKit(NexusEngine, shared)
  ];
}

export function createGenericAerialAdventureGame(NexusEngine, config = {}) {
  return NexusEngine.createRealtimeGame({ ...(config.engine ?? {}), kits: createGenericAerialAdventureKits(NexusEngine, config) });
}

export default createGenericAerialAdventureKits;
