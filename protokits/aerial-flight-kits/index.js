export * from './core.js';
export * from './environment.js';
export * from './flight.js';
export * from './world.js';
export * from './descriptors.js';

import { createGenericAtmosphereSkyKit, createGenericFlightInputKit, createGenericTerrainSamplerKit } from './environment.js';
import { createGenericAerialBodyKit, createGenericBoostImpulseKit, createGenericGlidePhysicsKit } from './flight.js';
import { createGenericCheckpointVolumeKit, createGenericFlockAgentKit, createGenericLiftVolumeKit, createGenericWorldPatchKit } from './world.js';
import { createGenericAerialRenderDescriptorKit, createGenericFlightAudioKit, createGenericFlightCameraKit, createGenericFlightChallengeKit, createGenericFlightVfxKit } from './descriptors.js';

export const GENERIC_AERIAL_ADVENTURE_STACK_DEFINITION = Object.freeze({
  id: 'generic-aerial-adventure-stack',
  provides: ['preset:aerial-adventure'],
  requires: [],
  purpose: 'Convenience stack for open-world aerial traversal, eroded patch terrain, lift volumes, companion flocks, and checkpoint collection.'
});

function createOptionalNexusTerrainKit(NexusRealtime = {}, config = {}) {
  if (config.useNexusTerrain === false || typeof NexusRealtime.createTerrainKit !== 'function' || !NexusRealtime.terrainLayers) return null;
  const terrain = config.terrain ?? {};
  const size = Number(terrain.patchSize ?? config.world?.patchSize ?? 420);
  const radius = Number(terrain.renderRadius ?? config.world?.renderDistance ?? config.world?.renderRadius ?? 2);
  const layers = NexusRealtime.terrainLayers;
  return NexusRealtime.createTerrainKit({
    id: 'generic-aerial-terrain-core-kit',
    width: Number(terrain.width ?? 200000),
    depth: Number(terrain.depth ?? 200000),
    waterLevel: Number(terrain.waterLevel ?? -42),
    chunks: {
      size,
      viewRadius: radius,
      activeRadius: radius,
      preloadRadius: radius + 1,
      unloadRadius: radius + 2,
      lod: terrain.lod ?? [
        { distance: size * 1.6, resolution: Number(terrain.nearResolution ?? 40) },
        { distance: size * 3.0, resolution: Number(terrain.midResolution ?? 26) },
        { distance: size * 5.0, resolution: Number(terrain.farResolution ?? 16) }
      ]
    },
    smoothing: { extraPasses: Number(terrain.extraSmoothingPasses ?? 2), slopeLimit: terrain.slopeLimit ?? 0.62 },
    materialColors: {
      sand: terrain.sandColor ?? '#e3b167',
      'wet-sand': terrain.wetSandColor ?? '#a98155',
      rock: terrain.rockColor ?? '#4b5320',
      grass: terrain.grassColor ?? '#1e3f20',
      seabed: terrain.seabedColor ?? '#1d3557',
      alpine: terrain.alpineColor ?? '#7a8d9a',
      snow: terrain.snowColor ?? '#f8f9fa'
    },
    layers: terrain.layers ?? [
      layers.baseNoise({ id: 'aerial-continental', amplitude: Number(terrain.continentalAmplitude ?? 52), frequency: Number(terrain.continentalFrequency ?? 0.0028), seed: `${config.seed ?? 'aerial'}:continental` }),
      layers.baseNoise({ id: 'aerial-ridges', amplitude: Number(terrain.ridgeAmplitude ?? 118), frequency: Number(terrain.ridgeFrequency ?? 0.0062), seed: `${config.seed ?? 'aerial'}:ridges` }),
      layers.baseNoise({ id: 'aerial-detail', amplitude: Number(terrain.detailAmplitude ?? 13), frequency: Number(terrain.detailFrequency ?? 0.021), seed: `${config.seed ?? 'aerial'}:detail` }),
      layers.carve({ id: 'aerial-valley', shape: 'spline', points: terrain.valleyPath ?? [{ x: -80000, z: -1200 }, { x: 0, z: 0 }, { x: 80000, z: 1200 }], depth: Number(terrain.valleyDepth ?? 36), falloff: Number(terrain.valleyFalloff ?? 900) }),
      layers.erosion({ id: 'aerial-soft-erosion', iterations: Number(terrain.erosionIterations ?? 7), strength: Number(terrain.erosionStrength ?? 0.16), preserveRidges: true }),
      layers.waterInfluence({ id: 'aerial-water', waterLevel: Number(terrain.waterLevel ?? -42), falloff: Number(terrain.waterFalloff ?? 12) }),
      layers.materials({ id: 'aerial-materials', rules: terrain.materialRules ?? [
        { material: 'seabed', belowWater: true },
        { material: 'wet-sand', nearWater: true },
        { material: 'rock', aboveSlope: 0.38 },
        { material: 'grass', belowSlope: 0.38 }
      ] })
    ]
  });
}

export function createGenericAerialAdventureKits(NexusRealtime, config = {}) {
  const terrainKit = createOptionalNexusTerrainKit(NexusRealtime, config);
  const shared = { seed: config.seed ?? 'generic-aerial-adventure', terrain: config.terrain ?? {}, terrainKit };
  const kits = [];
  if (terrainKit) kits.push(terrainKit);
  kits.push(
    createGenericAtmosphereSkyKit(NexusRealtime, { ...shared, ...(config.sky ?? {}) }),
    createGenericTerrainSamplerKit(NexusRealtime, shared),
    createGenericFlightInputKit(NexusRealtime, config.input ?? {}),
    createGenericAerialBodyKit(NexusRealtime, { ...shared, ...(config.body ?? {}) }),
    createGenericGlidePhysicsKit(NexusRealtime, config.physics ?? {}),
    createGenericBoostImpulseKit(NexusRealtime, config.boost ?? {}),
    createGenericWorldPatchKit(NexusRealtime, { ...shared, ...(config.world ?? {}), ...(config.terrain ?? {}) }),
    createGenericCheckpointVolumeKit(NexusRealtime, { ...shared, ...(config.checkpoints ?? {}) }),
    createGenericLiftVolumeKit(NexusRealtime, { ...shared, ...(config.liftVolumes ?? {}) }),
    createGenericFlockAgentKit(NexusRealtime, { ...shared, ...(config.flock ?? {}) }),
    createGenericFlightChallengeKit(NexusRealtime, config.challenge ?? {}),
    createGenericFlightCameraKit(NexusRealtime, config.camera ?? {}),
    createGenericFlightVfxKit(NexusRealtime, config.vfx ?? {}),
    createGenericFlightAudioKit(NexusRealtime, config.audio ?? {}),
    createGenericAerialRenderDescriptorKit(NexusRealtime, config.renderDescriptor ?? {})
  );
  return kits;
}

export function createGenericAerialAdventureGame(NexusRealtime, config = {}) {
  return NexusRealtime.createRealtimeGame({ ...(config.engine ?? {}), kits: createGenericAerialAdventureKits(NexusRealtime, config) });
}

export default createGenericAerialAdventureKits;
