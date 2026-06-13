import { clamp, createDefinitions, ensureState, installApi, makeRuntimeKit, norm3, num, terrainBiome, terrainHeight, terrainNormal, writeState } from './core.js';

export const GENERIC_ATMOSPHERE_SKY_KIT_DEFINITION = Object.freeze({ id: 'generic-atmosphere-sky-kit', provides: ['environment:sky', 'environment:lighting'], requires: [], purpose: 'Sky, sun, haze, and lighting descriptor state.' });
export function createGenericAtmosphereSkyKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_ATMOSPHERE_SKY_KIT_DEFINITION.id,
    provides: GENERIC_ATMOSPHERE_SKY_KIT_DEFINITION.provides,
    resources: { State: definitions.State },
    initWorld({ world }) {
      const state = ensureState(world, definitions, config);
      const elevation = num(config.sunElevation, 0.35) * Math.PI * 0.5;
      const azimuth = num(config.sunAzimuth, 0.75) * Math.PI * 2;
      state.sky = {
        topColor: config.topColor ?? '#42a5f5',
        horizonColor: config.horizonColor ?? '#ffdfb3',
        sunColor: config.sunColor ?? '#fff8e1',
        hazeDensity: num(config.hazeDensity, 0.0012),
        sunDirection: norm3({ x: Math.cos(elevation) * Math.sin(azimuth), y: Math.sin(elevation), z: Math.cos(elevation) * Math.cos(azimuth) }),
        sunIntensity: num(config.sunIntensity, 3.8),
        ambientColor: config.ambientColor ?? '#b3e5fc',
        ambientIntensity: num(config.ambientIntensity, 0.55),
        shadowCameraSize: num(config.shadowCameraSize, 180)
      };
      writeState(world, definitions, state);
    },
    install({ engine, world }) { installApi(engine, world, definitions, 'genericAtmosphereSky', config); },
    metadata: GENERIC_ATMOSPHERE_SKY_KIT_DEFINITION
  });
}

export const GENERIC_TERRAIN_SAMPLER_KIT_DEFINITION = Object.freeze({ id: 'generic-terrain-sampler-kit', provides: ['terrain:height-sampler', 'terrain:biome-sampler', 'terrain:normal-sampler'], requires: [], purpose: 'Deterministic terrain height, normal, biome, and optional NexusRealtime TerrainKit query bridge.' });
export function createGenericTerrainSamplerKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  const terrainKit = config.terrainKit ?? null;
  const terrainFocusResource = terrainKit?.definitions?.resources?.TerrainFocusState ?? terrainKit?.resources?.TerrainFocusState ?? null;
  const terrainSnapshotResource = terrainKit?.definitions?.resources?.TerrainSnapshot ?? terrainKit?.resources?.TerrainSnapshot ?? null;
  const terrainQueryResource = terrainKit?.definitions?.resources?.TerrainQuery ?? terrainKit?.resources?.TerrainQuery ?? null;
  const requires = terrainKit?.id ? [terrainKit.id] : [];

  function getCoreQuery(world) {
    if (terrainQueryResource) return world.getResource(terrainQueryResource);
    return null;
  }

  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_TERRAIN_SAMPLER_KIT_DEFINITION.id,
    provides: GENERIC_TERRAIN_SAMPLER_KIT_DEFINITION.provides,
    requires,
    resources: { State: definitions.State },
    systems: [{
      phase: 'input',
      name: 'generic-aerial-terrain-focus-system',
      system(world) {
        if (!terrainFocusResource) return;
        const state = ensureState(world, definitions, config);
        if (!state.body?.position) return;
        world.setResource(terrainFocusResource, { x: num(state.body.position.x), z: num(state.body.position.z) });
      }
    }],
    initWorld({ world }) {
      const state = ensureState(world, definitions, config);
      state.terrain = { ...state.terrain, ...(config.terrain ?? config), source: terrainKit ? 'nexus-terrain-kit' : 'aerial-fallback' };
      writeState(world, definitions, state);
    },
    install({ engine, world }) {
      const api = installApi(engine, world, definitions, 'genericTerrainSampler', config);
      api.usesNexusTerrain = Boolean(terrainKit);
      api.heightAt = (x, z) => {
        const query = getCoreQuery(world);
        return num(query?.heightAt?.(x, z), terrainHeight(api.getState().terrain, x, z));
      };
      api.biomeAt = (x, z) => {
        const query = getCoreQuery(world);
        const material = query?.materialAt?.(x, z);
        if (material === 'sand' || material === 'wet-sand' || material === 'seabed') return 'shore';
        if (material === 'rock') return 'rock';
        return terrainBiome(api.getState().terrain, x, z);
      };
      api.normalAt = (x, z) => {
        const query = getCoreQuery(world);
        return query?.normalAt?.(x, z) ?? terrainNormal(api.getState().terrain, x, z);
      };
      api.materialAt = (x, z) => getCoreQuery(world)?.materialAt?.(x, z) ?? api.biomeAt(x, z);
      api.getTerrainSnapshot = () => terrainSnapshotResource ? world.getResource(terrainSnapshotResource) : null;
    },
    metadata: GENERIC_TERRAIN_SAMPLER_KIT_DEFINITION
  });
}

export const GENERIC_FLIGHT_INPUT_KIT_DEFINITION = Object.freeze({ id: 'generic-flight-input-kit', provides: ['input:flight'], requires: [], purpose: 'Renderer-agnostic pitch, bank, yaw, brake, and boost input intent.' });
export function createGenericFlightInputKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_FLIGHT_INPUT_KIT_DEFINITION.id,
    provides: GENERIC_FLIGHT_INPUT_KIT_DEFINITION.provides,
    resources: { State: definitions.State },
    initWorld({ world }) { ensureState(world, definitions, config); },
    install({ engine, world }) {
      const api = installApi(engine, world, definitions, 'genericFlightInput', config);
      api.setInput = (input = {}) => {
        const state = api.getState();
        state.input = {
          pitch: clamp(input.pitch ?? 0, -1, 1),
          bank: clamp(input.bank ?? 0, -1, 1),
          yaw: clamp(input.yaw ?? 0, -1, 1),
          brake: clamp(input.brake ?? 0, 0, 1),
          boost: Boolean(input.boost)
        };
        writeState(world, definitions, state);
        return state.input;
      };
    },
    metadata: GENERIC_FLIGHT_INPUT_KIT_DEFINITION
  });
}
