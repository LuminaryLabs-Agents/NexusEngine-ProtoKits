import { clamp, createDefinitions, ensureState, makeRuntimeKit, now, num, writeState } from './core.js';

export const ATMOSPHERIC_WEATHER_KIT_VERSION = '0.1.0';
export const VOLUMETRIC_LIGHTING_KIT_VERSION = '0.1.0';

function weatherConfig(config = {}) {
  return {
    windSpeed: num(config.windSpeed, 18),
    windDirection: config.windDirection ?? { x: 0.65, y: 0.05, z: -0.76 },
    fogDensity: num(config.fogDensity, 0.0012),
    fogColor: config.fogColor ?? '#ffdfb3',
    hazeDensity: num(config.hazeDensity, 0.00075),
    cloudOpacity: num(config.cloudOpacity, 0.34),
    cloudSpeed: num(config.cloudSpeed, 0.018),
    cloudScale: num(config.cloudScale, 0.00042),
    weatherBlend: num(config.weatherBlend, 1),
    ...config
  };
}

function normalize3(v = {}, fallback = { x: 1, y: 0, z: 0 }) {
  const x = num(v.x, fallback.x);
  const y = num(v.y, fallback.y);
  const z = num(v.z, fallback.z);
  const len = Math.hypot(x, y, z) || 1;
  return { x: x / len, y: y / len, z: z / len };
}

export const ATMOSPHERIC_WEATHER_KIT_DEFINITION = Object.freeze({
  id: 'atmospheric-weather-kit',
  provides: ['weather:atmosphere', 'weather:fog', 'weather:wind', 'render:weather-descriptor'],
  requires: ['environment:sky', 'aerial:body'],
  purpose: 'Renderer-neutral aerial weather descriptor for wind, cloud layers, fog, haze, and transition state.'
});

export function createAtmosphericWeatherKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: config.kitId ?? ATMOSPHERIC_WEATHER_KIT_DEFINITION.id,
    provides: ATMOSPHERIC_WEATHER_KIT_DEFINITION.provides,
    requires: ATMOSPHERIC_WEATHER_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'atmospheric-weather-system', system(world) {
      const state = ensureState(world, definitions, config);
      const c = weatherConfig(config);
      const elapsed = now(world);
      const windDirection = normalize3(c.windDirection);
      const altitude = num(state.body?.position?.y, 0);
      const altitudeHaze = clamp(1 - altitude / num(c.clearAltitude, 2200), 0.18, 1);
      state.weather = {
        version: ATMOSPHERIC_WEATHER_KIT_VERSION,
        blend: clamp(c.weatherBlend, 0, 1),
        wind: {
          direction: windDirection,
          speed: c.windSpeed,
          turbulence: num(c.turbulence, 0.18),
          gust: Math.sin(elapsed * 0.37) * num(c.gustStrength, 0.16)
        },
        fog: {
          enabled: c.fog !== false,
          color: c.fogColor,
          density: c.fogDensity * altitudeHaze,
          hazeDensity: c.hazeDensity * altitudeHaze,
          heightFalloff: num(c.fogHeightFalloff, 0.0018),
          noiseScale: num(c.fogNoiseScale, 0.0015),
          noiseSpeed: num(c.fogNoiseSpeed, 0.025)
        },
        cloudLayers: [
          {
            id: 'lower-clouds',
            altitude: num(c.lowerCloudAltitude, 760),
            thickness: num(c.lowerCloudThickness, 180),
            opacity: c.cloudOpacity,
            scale: c.cloudScale,
            drift: { x: windDirection.x * c.cloudSpeed, z: windDirection.z * c.cloudSpeed }
          },
          {
            id: 'high-veil',
            altitude: num(c.highCloudAltitude, 1500),
            thickness: num(c.highCloudThickness, 260),
            opacity: c.cloudOpacity * 0.42,
            scale: c.cloudScale * 0.46,
            drift: { x: windDirection.x * c.cloudSpeed * 0.45, z: windDirection.z * c.cloudSpeed * 0.45 }
          }
        ],
        precipitation: {
          type: config.precipitationType ?? 'none',
          amount: num(config.precipitationAmount, 0)
        }
      };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) {
      engine.atmosphericWeather = { getState: () => ensureState(world, definitions, config).weather ?? {} };
    },
    metadata: ATMOSPHERIC_WEATHER_KIT_DEFINITION
  });
}

export const VOLUMETRIC_LIGHTING_KIT_DEFINITION = Object.freeze({
  id: 'volumetric-lighting-kit',
  provides: ['lighting:volumetric', 'lighting:sun-scattering', 'render:volumetric-lighting-descriptor'],
  requires: ['environment:sky', 'weather:fog'],
  purpose: 'Renderer-neutral sun-lit fog, aerial perspective, and god-ray descriptor service.'
});

export function createVolumetricLightingKit(NexusRealtime, config = {}) {
  const definitions = createDefinitions(NexusRealtime);
  return makeRuntimeKit(NexusRealtime, {
    id: config.kitId ?? VOLUMETRIC_LIGHTING_KIT_DEFINITION.id,
    provides: VOLUMETRIC_LIGHTING_KIT_DEFINITION.provides,
    requires: VOLUMETRIC_LIGHTING_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'cleanup', name: 'volumetric-lighting-system', system(world) {
      const state = ensureState(world, definitions, config);
      const sunDirection = normalize3(state.sky?.sunDirection ?? config.sunDirection ?? { x: 0.18, y: 0.72, z: -0.42 });
      const fog = state.weather?.fog ?? {};
      const sunPower = num(config.sunPower, 1.15);
      const density = num(fog.density, num(config.fogDensity, 0.001));
      state.volumetricLighting = {
        version: VOLUMETRIC_LIGHTING_KIT_VERSION,
        enabled: config.enabled !== false,
        sunDirection,
        sunColor: config.sunColor ?? '#fff8e1',
        fogColor: fog.color ?? config.fogColor ?? '#ffdfb3',
        scattering: {
          density,
          anisotropy: num(config.anisotropy, 0.42),
          intensity: sunPower * clamp(density * 900, 0.18, 1.4),
          horizonBoost: num(config.horizonBoost, 0.55),
          altitudeFalloff: num(fog.heightFalloff, 0.0018)
        },
        aerialPerspective: {
          distanceDensity: num(config.distanceDensity, density * 0.8),
          colorMix: num(config.colorMix, 0.42),
          maxDistance: num(config.maxDistance, 12000)
        },
        godRays: {
          enabled: config.godRays !== false,
          exposure: num(config.godRayExposure, 0.22),
          decay: num(config.godRayDecay, 0.92),
          weight: num(config.godRayWeight, 0.48)
        }
      };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) {
      engine.volumetricLighting = { getState: () => ensureState(world, definitions, config).volumetricLighting ?? {} };
    },
    metadata: VOLUMETRIC_LIGHTING_KIT_DEFINITION
  });
}
