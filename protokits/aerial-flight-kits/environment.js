import { clamp, createDefinitions, ensureState, installApi, makeRuntimeKit, norm3, num, terrainBiome, terrainHeight, writeState } from './core.js';

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
        ambientIntensity: num(config.ambientIntensity, 0.55)
      };
      writeState(world, definitions, state);
    },
    install({ engine, world }) { installApi(engine, world, definitions, 'genericAtmosphereSky', config); },
    metadata: GENERIC_ATMOSPHERE_SKY_KIT_DEFINITION
  });
}

export const GENERIC_TERRAIN_SAMPLER_KIT_DEFINITION = Object.freeze({ id: 'generic-terrain-sampler-kit', provides: ['terrain:height-sampler', 'terrain:biome-sampler'], requires: [], purpose: 'Deterministic terrain height, normal, and biome queries.' });
export function createGenericTerrainSamplerKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: GENERIC_TERRAIN_SAMPLER_KIT_DEFINITION.id,
    provides: GENERIC_TERRAIN_SAMPLER_KIT_DEFINITION.provides,
    resources: { State: definitions.State },
    initWorld({ world }) {
      const state = ensureState(world, definitions, config);
      state.terrain = { ...state.terrain, ...(config.terrain ?? config) };
      writeState(world, definitions, state);
    },
    install({ engine, world }) {
      const api = installApi(engine, world, definitions, 'genericTerrainSampler', config);
      api.heightAt = (x, z) => terrainHeight(api.getState().terrain, x, z);
      api.biomeAt = (x, z) => terrainBiome(api.getState().terrain, x, z);
      api.normalAt = (x, z) => norm3({
        x: terrainHeight(api.getState().terrain, x - 2, z) - terrainHeight(api.getState().terrain, x + 2, z),
        y: 8,
        z: terrainHeight(api.getState().terrain, x, z - 2) - terrainHeight(api.getState().terrain, x, z + 2)
      });
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
