import {
  clamp,
  clone,
  createDefinitionFactory,
  createSeededRandom,
  defineInjectedRuntimeKit,
  ensureResource,
  number,
  stableId
} from "../protokit-core/index.js";

export const MATTAZ_CLOUDS_DOMAIN_VERSION = "0.1.0";
export const MATTAZ_CLOUD_COUNT_MIN = 1;
export const MATTAZ_CLOUD_COUNT_MAX = 20;

const v3 = (value = {}, fallback = {}) => ({
  x: number(value.x, number(fallback.x, 0)),
  y: number(value.y, number(fallback.y, 0)),
  z: number(value.z, number(fallback.z, 0))
});

const unit2 = (value = {}, fallback = { x: 1, z: 0 }) => {
  const x = number(value.x, number(fallback.x, 1));
  const z = number(value.z, number(fallback.z, 0));
  const length = Math.hypot(x, z) || 1;
  return { x: x / length, z: z / length };
};

export function clampMattatzCloudCount(count = 12) {
  return Math.round(clamp(count, MATTAZ_CLOUD_COUNT_MIN, MATTAZ_CLOUD_COUNT_MAX));
}

export function clampMattatzLayerCloudCount(count = 0) {
  return Math.round(clamp(count, 0, MATTAZ_CLOUD_COUNT_MAX));
}

export const MATTAZ_CLOUD_WEATHER_PRESETS = Object.freeze({
  clear: Object.freeze({
    name: "clear",
    cloudCount: 1,
    coverage: 0.08,
    density: 0.18,
    softness: 0.72,
    windSpeed: 0.045,
    layerWeights: [0.2, 0.25, 0.55],
    cumulonimbus: { enabled: false }
  }),
  scattered: Object.freeze({
    name: "scattered",
    cloudCount: 10,
    coverage: 0.42,
    density: 0.48,
    softness: 0.62,
    windSpeed: 0.075,
    layerWeights: [0.4, 0.38, 0.22],
    cumulonimbus: { enabled: false }
  }),
  overcast: Object.freeze({
    name: "overcast",
    cloudCount: 18,
    coverage: 0.86,
    density: 0.68,
    softness: 0.5,
    windSpeed: 0.055,
    layerWeights: [0.48, 0.4, 0.12],
    cumulonimbus: { enabled: false }
  }),
  "storm-front": Object.freeze({
    name: "storm-front",
    cloudCount: 20,
    coverage: 0.95,
    density: 0.84,
    softness: 0.42,
    windSpeed: 0.11,
    layerWeights: [0.38, 0.34, 0.28],
    cumulonimbus: { enabled: true, towers: 2, anvil: 0.82, rainShaft: 0.65, lightningHooks: true }
  }),
  "mountain-fog": Object.freeze({
    name: "mountain-fog",
    cloudCount: 14,
    coverage: 0.72,
    density: 0.5,
    softness: 0.82,
    windSpeed: 0.035,
    layerWeights: [0.76, 0.18, 0.06],
    cumulonimbus: { enabled: false }
  }),
  "sunrise-haze": Object.freeze({
    name: "sunrise-haze",
    cloudCount: 12,
    coverage: 0.55,
    density: 0.42,
    softness: 0.74,
    windSpeed: 0.05,
    layerWeights: [0.36, 0.34, 0.3],
    cumulonimbus: { enabled: false },
    tint: { r: 1, g: 0.62, b: 0.42 }
  }),
  "high-windy-sky": Object.freeze({
    name: "high-windy-sky",
    cloudCount: 16,
    coverage: 0.48,
    density: 0.34,
    softness: 0.78,
    windSpeed: 0.16,
    layerWeights: [0.08, 0.24, 0.68],
    cumulonimbus: { enabled: false }
  })
});

export function resolveMattatzCloudWeatherPreset(name = "scattered") {
  return clone(MATTAZ_CLOUD_WEATHER_PRESETS[name] ?? MATTAZ_CLOUD_WEATHER_PRESETS.scattered);
}

function distributeCloudCount(total, weights = [0.4, 0.38, 0.22]) {
  const count = clampMattatzCloudCount(total);
  const safeWeights = weights.map((weight) => Math.max(0, number(weight, 0)));
  const sum = safeWeights.reduce((acc, weight) => acc + weight, 0) || 1;
  const raw = safeWeights.map((weight) => weight / sum * count);
  const base = raw.map(Math.floor);
  let remaining = count - base.reduce((acc, value) => acc + value, 0);
  raw
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder)
    .forEach(({ index }) => { if (remaining-- > 0) base[index] += 1; });
  return base;
}

export function createMattatzCloudPrimitiveDescriptor(options = {}) {
  const seed = String(options.seed ?? "mattatz-cloud");
  return {
    id: options.id ?? stableId("mattatz-cloud", seed, options.layerId, options.index),
    type: "mattatz-cloud-primitive",
    version: MATTAZ_CLOUDS_DOMAIN_VERSION,
    rendererBoundary: "descriptor-only",
    adapterHint: "THREE.Cloud-style box volume raymarch primitive",
    position: v3(options.position, { x: 0, y: 900, z: 0 }),
    scale: v3(options.scale, { x: 220, y: 90, z: 140 }),
    bounds: v3(options.bounds, options.scale ?? { x: 220, y: 90, z: 140 }),
    density: clamp(options.density ?? 0.5, 0, 1),
    softness: clamp(options.softness ?? 0.6, 0, 1),
    opacity: clamp(options.opacity ?? 0.8, 0, 1),
    coverage: clamp(options.coverage ?? 0.5, 0, 1),
    color: clone(options.color ?? { r: 1, g: 1, b: 1 }),
    undersideColor: clone(options.undersideColor ?? { r: 0.44, g: 0.47, b: 0.52 }),
    scattering: {
      forward: clamp(options.scattering?.forward ?? 0.65, 0, 1),
      silverLining: clamp(options.scattering?.silverLining ?? 0.45, 0, 1),
      ambient: clamp(options.scattering?.ambient ?? 0.35, 0, 1)
    },
    noise: {
      seed,
      octaves: Math.round(clamp(options.noise?.octaves ?? 5, 1, 8)),
      scale: number(options.noise?.scale, 1),
      turbulence: clamp(options.noise?.turbulence ?? 0.5, 0, 2),
      billow: clamp(options.noise?.billow ?? 0.75, 0, 1)
    },
    raymarch: {
      steps: Math.round(clamp(options.raymarch?.steps ?? 28, 4, 96)),
      shadowSteps: Math.round(clamp(options.raymarch?.shadowSteps ?? 6, 0, 32)),
      earlyExit: options.raymarch?.earlyExit !== false
    },
    drift: unit2(options.drift, { x: 1, z: 0 }),
    driftSpeed: number(options.driftSpeed, 0.05),
    lod: options.lod ?? "near-volumetric"
  };
}

export function createMattatzCloudLayerDescriptor(options = {}) {
  return {
    id: String(options.id ?? "cloud-layer"),
    type: "mattatz-cloud-layer",
    family: options.family ?? "cumulus",
    altitudeMin: number(options.altitudeMin, 250),
    altitudeMax: number(options.altitudeMax, 600),
    thickness: Math.max(1, number(options.thickness, 160)),
    cloudCount: clampMattatzLayerCloudCount(options.cloudCount ?? 4),
    coverage: clamp(options.coverage ?? 0.5, 0, 1),
    density: clamp(options.density ?? 0.5, 0, 1),
    softness: clamp(options.softness ?? 0.6, 0, 1),
    driftSpeed: number(options.driftSpeed, 0.05),
    spreadRadius: Math.max(1, number(options.spreadRadius, 900)),
    scale: v3(options.scale, { x: 260, y: 80, z: 160 }),
    color: clone(options.color ?? { r: 1, g: 1, b: 1 }),
    raymarch: clone(options.raymarch ?? { steps: 28, shadowSteps: 6, earlyExit: true })
  };
}

export function createDefaultMattatzCloudLayers(options = {}) {
  const preset = resolveMattatzCloudWeatherPreset(options.weather ?? "scattered");
  const count = clampMattatzCloudCount(options.cloudCount ?? preset.cloudCount);
  const [low, mid, high] = distributeCloudCount(count, preset.layerWeights);
  const coverage = clamp(options.coverage ?? preset.coverage, 0, 1);
  const density = clamp(options.density ?? preset.density, 0, 1);
  const softness = clamp(options.softness ?? preset.softness, 0, 1);
  return [
    createMattatzCloudLayerDescriptor({
      id: "low-cloud-layer",
      family: preset.name === "mountain-fog" ? "fog-bank" : "cumulus",
      altitudeMin: 220,
      altitudeMax: 520,
      thickness: 180,
      cloudCount: low,
      coverage,
      density,
      softness,
      driftSpeed: number(preset.windSpeed, 0.05) * 1.35,
      spreadRadius: 760,
      scale: { x: 220, y: 78, z: 150 },
      raymarch: { steps: 30, shadowSteps: 6, earlyExit: true }
    }),
    createMattatzCloudLayerDescriptor({
      id: "mid-cloud-layer",
      family: "cumulus-congestus",
      altitudeMin: 720,
      altitudeMax: 1200,
      thickness: 260,
      cloudCount: mid,
      coverage: coverage * 0.92,
      density: density * 0.94,
      softness: Math.min(1, softness + 0.04),
      driftSpeed: number(preset.windSpeed, 0.05),
      spreadRadius: 1120,
      scale: { x: 320, y: 130, z: 220 },
      raymarch: { steps: 24, shadowSteps: 5, earlyExit: true }
    }),
    createMattatzCloudLayerDescriptor({
      id: "high-cloud-layer",
      family: "cirrus-or-high-cumulus",
      altitudeMin: 1750,
      altitudeMax: 2950,
      thickness: 190,
      cloudCount: high,
      coverage: coverage * 0.68,
      density: density * 0.62,
      softness: Math.min(1, softness + 0.14),
      driftSpeed: number(preset.windSpeed, 0.05) * 0.74,
      spreadRadius: 1520,
      scale: { x: 520, y: 62, z: 210 },
      raymarch: { steps: 16, shadowSteps: 2, earlyExit: true }
    })
  ];
}

export function createMattatzCloudsState(options = {}) {
  const preset = resolveMattatzCloudWeatherPreset(options.weather ?? options.weatherPreset ?? "scattered");
  const cloudCount = clampMattatzCloudCount(options.cloudCount ?? preset.cloudCount);
  const seed = String(options.seed ?? "mattatz-cloud-suite");
  return {
    version: MATTAZ_CLOUDS_DOMAIN_VERSION,
    seed,
    weather: preset.name,
    cloudCount,
    wind: {
      direction: unit2(options.wind?.direction, { x: 1, z: 0.18 }),
      speed: number(options.wind?.speed, preset.windSpeed)
    },
    sun: {
      direction: v3(options.sun?.direction, { x: -0.35, y: 0.72, z: 0.46 }),
      color: clone(options.sun?.color ?? preset.tint ?? { r: 1, g: 0.94, b: 0.82 }),
      intensity: number(options.sun?.intensity, 1.15)
    },
    lighting: {
      rim: clamp(options.lighting?.rim ?? 0.7, 0, 2),
      silverLining: clamp(options.lighting?.silverLining ?? 0.55, 0, 2),
      undersideDarkness: clamp(options.lighting?.undersideDarkness ?? 0.65, 0, 2),
      atmosphericFade: clamp(options.lighting?.atmosphericFade ?? 0.35, 0, 1)
    },
    layers: clone(options.layers ?? createDefaultMattatzCloudLayers({
      weather: preset.name,
      cloudCount,
      coverage: preset.coverage,
      density: preset.density,
      softness: preset.softness
    })),
    cumulonimbus: clone(options.cumulonimbus ?? preset.cumulonimbus ?? { enabled: false }),
    lod: {
      nearDistance: number(options.lod?.nearDistance, 900),
      midDistance: number(options.lod?.midDistance, 2200),
      farDistance: number(options.lod?.farDistance, 5200),
      horizonBand: options.lod?.horizonBand !== false,
      maxRaymarchSteps: Math.round(clamp(options.lod?.maxRaymarchSteps ?? 32, 8, 96))
    },
    shadows: {
      enabled: options.shadows?.enabled !== false,
      opacity: clamp(options.shadows?.opacity ?? 0.28, 0, 1),
      driftScale: number(options.shadows?.driftScale, 1)
    }
  };
}

function layerCloudDescriptors(layer, state, layerIndex = 0, time = 0) {
  const rng = createSeededRandom(`${state.seed}:${state.weather}:${layer.id}`);
  const count = Math.max(0, Math.round(number(layer.cloudCount, 0)));
  const clouds = [];
  for (let index = 0; index < count; index += 1) {
    const angle = rng.range(0, Math.PI * 2);
    const radius = rng.range(layer.spreadRadius * 0.22, layer.spreadRadius);
    const altitude = rng.range(layer.altitudeMin, layer.altitudeMax);
    const wind = unit2(state.wind.direction);
    const drift = number(time, 0) * number(state.wind.speed, 0) * number(layer.driftSpeed, 0.05) * 120;
    const x = Math.cos(angle) * radius + wind.x * drift;
    const z = Math.sin(angle) * radius + wind.z * drift;
    const scaleJitter = rng.range(0.72, 1.34);
    clouds.push(createMattatzCloudPrimitiveDescriptor({
      id: stableId("mattatz-cloud", state.seed, layer.id, index),
      index,
      layerId: layer.id,
      seed: `${state.seed}:${layer.id}:${index}`,
      position: { x, y: altitude, z },
      scale: {
        x: layer.scale.x * scaleJitter,
        y: layer.scale.y * rng.range(0.72, 1.18),
        z: layer.scale.z * rng.range(0.7, 1.28)
      },
      density: layer.density * rng.range(0.84, 1.16),
      softness: layer.softness,
      opacity: Math.min(1, layer.coverage * rng.range(0.72, 1.1)),
      coverage: layer.coverage,
      color: layer.color,
      raymarch: layer.raymarch,
      drift: wind,
      driftSpeed: number(layer.driftSpeed, 0.05),
      noise: {
        seed: `${state.seed}:${layer.id}:${index}`,
        octaves: layer.family.includes("cirrus") ? 3 : 5,
        scale: rng.range(0.75, 1.45),
        turbulence: rng.range(0.2, 0.9),
        billow: layer.family.includes("fog") ? 0.32 : 0.78
      },
      scattering: {
        forward: number(state.lighting.rim, 0.7),
        silverLining: number(state.lighting.silverLining, 0.55),
        ambient: 0.42 + layerIndex * 0.1
      },
      lod: layerIndex === 2 ? "far-or-thin-volume" : layerIndex === 1 ? "mid-reduced-volume" : "near-volumetric"
    }));
  }
  return clouds;
}

function cumulonimbusDescriptors(state, time = 0) {
  const config = state.cumulonimbus ?? {};
  if (!config.enabled) return [];
  const rng = createSeededRandom(`${state.seed}:cumulonimbus:${state.weather}`);
  const towers = Math.round(clamp(config.towers ?? 1, 1, 4));
  const wind = unit2(state.wind.direction);
  return Array.from({ length: towers }, (_, index) => {
    const angle = rng.range(-0.55, 0.55) + Math.PI * 0.8;
    const radius = rng.range(950, 1650);
    const drift = number(time, 0) * number(state.wind.speed, 0) * 28;
    return {
      id: stableId("mattatz-cumulonimbus", state.seed, index),
      type: "mattatz-cumulonimbus-tower",
      position: {
        x: Math.cos(angle) * radius + wind.x * drift,
        y: 540,
        z: Math.sin(angle) * radius + wind.z * drift
      },
      baseAltitude: 420,
      topAltitude: rng.range(4200, 6200),
      coreScale: { x: rng.range(360, 620), y: rng.range(1800, 2900), z: rng.range(360, 700) },
      anvil: clamp(config.anvil ?? 0.72, 0, 1),
      rainShaft: clamp(config.rainShaft ?? 0, 0, 1),
      lightningHooks: Boolean(config.lightningHooks),
      undersideDarkness: 0.86,
      density: 0.92,
      adapterHint: "Stacked mattatz-cloud-primitive volumes plus anvil cap descriptor"
    };
  });
}

export function createMattatzCloudRenderContract(stateInput = createMattatzCloudsState(), time = 0) {
  const state = { ...createMattatzCloudsState(stateInput), ...clone(stateInput) };
  const layers = state.layers.map((layer) => createMattatzCloudLayerDescriptor(layer));
  const clouds = layers.flatMap((layer, index) => layerCloudDescriptors(layer, state, index, time));
  return {
    type: "mattatz-cloud-render-contract",
    version: MATTAZ_CLOUDS_DOMAIN_VERSION,
    weather: state.weather,
    time: number(time, 0),
    seed: state.seed,
    cloudCount: clouds.length,
    rendererBoundary: {
      ownsRendererObjects: false,
      adapterRequired: true,
      preferredNearAdapter: "THREE.Cloud-style box volume raymarch",
      preferredFarAdapter: "impostor card or horizon band"
    },
    wind: clone(state.wind),
    sun: clone(state.sun),
    lighting: clone(state.lighting),
    lod: clone(state.lod),
    shadows: clone(state.shadows),
    layers,
    clouds,
    cumulonimbus: cumulonimbusDescriptors(state, time),
    horizonBand: state.lod.horizonBand ? {
      id: "mattatz-cloud-horizon-band",
      type: "mattatz-cloud-horizon-band",
      altitude: 2100,
      density: state.weather === "clear" ? 0.08 : 0.42,
      drift: clone(state.wind.direction)
    } : null
  };
}

export function validateMattatzCloudsState(state = createMattatzCloudsState()) {
  const errors = [];
  if (state.version !== MATTAZ_CLOUDS_DOMAIN_VERSION) errors.push("version mismatch");
  if (!state.seed) errors.push("missing seed");
  if (state.cloudCount < MATTAZ_CLOUD_COUNT_MIN || state.cloudCount > MATTAZ_CLOUD_COUNT_MAX) errors.push("cloudCount must be 1-20");
  if (!Array.isArray(state.layers) || state.layers.length !== 3) errors.push("expected exactly three cloud layers");
  if (!state.wind || !state.sun || !state.lod) errors.push("missing wind, sun, or lod policy");
  return { ok: errors.length === 0, errors };
}

function createCloudSuiteRuntimeKit(nexusEngine = {}, options = {}) {
  const defs = createDefinitionFactory(nexusEngine);
  const CloudSuiteState = defs.resource(options.resourceName ?? "mattatzClouds.state");
  const CloudSuiteUpdated = defs.event("mattatzClouds.updated");
  const WeatherChanged = defs.event("mattatzClouds.weatherChanged");
  const initial = () => createMattatzCloudsState(options);

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "mattatz-clouds-domain",
    resources: { CloudSuiteState },
    events: { CloudSuiteUpdated, WeatherChanged },
    provides: [
      "rendering:cloud-primitive-descriptor",
      "rendering:cloud-layer-descriptor",
      "rendering:cloud-weather-presets",
      "rendering:cumulonimbus-descriptor",
      "rendering:cloud-lod-policy",
      "weather:cloud-suite"
    ],
    initWorld({ world }) {
      ensureResource(world, CloudSuiteState, initial);
    },
    install({ engine, world }) {
      const getState = () => ensureResource(world, CloudSuiteState, initial);
      const commit = (next, event = CloudSuiteUpdated) => {
        world.setResource(CloudSuiteState, next);
        if (world.emit) world.emit(event, { state: clone(next) });
        return clone(next);
      };
      const api = {
        getState,
        snapshot: () => clone(getState()),
        reset: () => commit(initial()),
        set(config = {}) { return commit(createMattatzCloudsState({ ...getState(), ...config })); },
        setWeather(name = "scattered") {
          const current = getState();
          return commit(createMattatzCloudsState({ ...current, weather: name, cloudCount: current.cloudCount, seed: current.seed }), WeatherChanged);
        },
        setCloudCount(count = 12) {
          const current = getState();
          return commit(createMattatzCloudsState({ ...current, cloudCount: clampMattatzCloudCount(count), layers: undefined }));
        },
        setWind(wind = {}) { return api.set({ wind: { ...getState().wind, ...wind } }); },
        setSun(sun = {}) { return api.set({ sun: { ...getState().sun, ...sun } }); },
        getRenderContract(time = number(world?.__nexusClock?.elapsed, 0)) {
          return createMattatzCloudRenderContract(getState(), time);
        },
        validate: () => validateMattatzCloudsState(getState())
      };
      engine.mattatzClouds = api;
      engine.n = engine.n || {};
      engine.n.mattatzClouds = api;
    },
    metadata: {
      version: MATTAZ_CLOUDS_DOMAIN_VERSION,
      purpose: "Renderer-agnostic cloud suite domain inspired by mattatz/THREE.Cloud.",
      role: options.role ?? "composite-domain",
      rendererBoundary: "descriptor-only"
    }
  });
}

export function createMattatzCloudsDomainKit(nexusEngine = {}, options = {}) {
  return createCloudSuiteRuntimeKit(nexusEngine, { ...options, id: options.id ?? "mattatz-clouds-domain", role: "composite-domain" });
}

export function createMattatzCloudCoreKit(nexusEngine = {}, options = {}) {
  return createCloudSuiteRuntimeKit(nexusEngine, { ...options, id: options.id ?? "mattatz-cloud-core-kit", role: "cloud-primitive-descriptor" });
}

export function createMattatzCloudLayerKit(nexusEngine = {}, options = {}) {
  return createCloudSuiteRuntimeKit(nexusEngine, { ...options, id: options.id ?? "mattatz-cloud-layer-kit", role: "cloud-layer-composition" });
}

export function createMattatzCloudWeatherKit(nexusEngine = {}, options = {}) {
  return createCloudSuiteRuntimeKit(nexusEngine, { ...options, id: options.id ?? "mattatz-cloud-weather-kit", role: "weather-preset-composition" });
}

export function createMattatzCumulonimbusKit(nexusEngine = {}, options = {}) {
  return createCloudSuiteRuntimeKit(nexusEngine, { ...options, id: options.id ?? "mattatz-cumulonimbus-kit", role: "storm-tower-descriptor" });
}

export function createMattatzCloudLightingKit(nexusEngine = {}, options = {}) {
  return createCloudSuiteRuntimeKit(nexusEngine, { ...options, id: options.id ?? "mattatz-cloud-lighting-kit", role: "cloud-lighting-descriptor" });
}

export function createMattatzCloudLodKit(nexusEngine = {}, options = {}) {
  return createCloudSuiteRuntimeKit(nexusEngine, { ...options, id: options.id ?? "mattatz-cloud-lod-kit", role: "cloud-lod-policy" });
}

export default createMattatzCloudsDomainKit;
