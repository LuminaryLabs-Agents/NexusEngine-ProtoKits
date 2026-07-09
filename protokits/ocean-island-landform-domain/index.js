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

export const OCEAN_ISLAND_LANDFORM_DOMAIN_VERSION = "0.1.0";

const TWO_PI = Math.PI * 2;

const vec2 = (value = {}, fallback = {}) => ({
  x: number(value.x, number(fallback.x, 0)),
  z: number(value.z, number(fallback.z, 0))
});

const vec3 = (value = {}, fallback = {}) => ({
  x: number(value.x, number(fallback.x, 0)),
  y: number(value.y, number(fallback.y, 0)),
  z: number(value.z, number(fallback.z, 0))
});

function smoothstep(edge0, edge1, value) {
  const t = clamp((number(value) - number(edge0)) / Math.max(0.000001, number(edge1) - number(edge0)), 0, 1);
  return t * t * (3 - 2 * t);
}

function hashUnit(seed = "seed", ...parts) {
  let hash = 2166136261;
  for (const char of [seed, ...parts].join(":").toString()) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function valueNoise(seed, x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hashUnit(seed, xi, zi);
  const b = hashUnit(seed, xi + 1, zi);
  const c = hashUnit(seed, xi, zi + 1);
  const d = hashUnit(seed, xi + 1, zi + 1);
  const x1 = a + (b - a) * u;
  const x2 = c + (d - c) * u;
  return x1 + (x2 - x1) * v;
}

function fbm(seed, x, z, octaves = 4) {
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    total += valueNoise(`${seed}:${i}`, x * frequency, z * frequency) * amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return norm > 0 ? total / norm : 0;
}

export const OCEAN_ISLAND_LANDFORM_PRESETS = Object.freeze({
  "tropical-small-island": Object.freeze({
    id: "tropical-small-island",
    radius: 420,
    seaLevel: 0,
    maxHeight: 82,
    beachWidth: 46,
    shelfWidth: 150,
    shelfDepth: 22,
    roughness: 0.42,
    coastIrregularity: 0.18,
    peakBias: 0.55,
    lagoonRadius: 0,
    craterRadius: 0,
    biome: "tropical",
    objectPalette: ["palm", "bush", "rock", "boulder", "driftwood", "reef"]
  }),
  "rocky-cliff-island": Object.freeze({
    id: "rocky-cliff-island",
    radius: 360,
    seaLevel: 0,
    maxHeight: 128,
    beachWidth: 22,
    shelfWidth: 95,
    shelfDepth: 32,
    roughness: 0.68,
    coastIrregularity: 0.24,
    peakBias: 0.78,
    lagoonRadius: 0,
    craterRadius: 0,
    biome: "rocky",
    objectPalette: ["rock", "boulder", "coastal-rock", "cave-mouth"]
  }),
  "volcanic-island": Object.freeze({
    id: "volcanic-island",
    radius: 500,
    seaLevel: 0,
    maxHeight: 210,
    beachWidth: 28,
    shelfWidth: 130,
    shelfDepth: 34,
    roughness: 0.58,
    coastIrregularity: 0.17,
    peakBias: 1,
    lagoonRadius: 0,
    craterRadius: 0.18,
    biome: "volcanic",
    objectPalette: ["rock", "boulder", "cliff-rock", "smoke-vent"]
  }),
  "lagoon-island": Object.freeze({
    id: "lagoon-island",
    radius: 470,
    seaLevel: 0,
    maxHeight: 64,
    beachWidth: 56,
    shelfWidth: 180,
    shelfDepth: 16,
    roughness: 0.35,
    coastIrregularity: 0.16,
    peakBias: 0.32,
    lagoonRadius: 0.24,
    craterRadius: 0,
    biome: "tropical-lagoon",
    objectPalette: ["palm", "bush", "driftwood", "reef", "coral", "ruin"]
  }),
  "atoll-island": Object.freeze({
    id: "atoll-island",
    radius: 520,
    seaLevel: 0,
    maxHeight: 28,
    beachWidth: 64,
    shelfWidth: 210,
    shelfDepth: 12,
    roughness: 0.22,
    coastIrregularity: 0.12,
    peakBias: 0.1,
    lagoonRadius: 0.42,
    craterRadius: 0,
    biome: "atoll",
    objectPalette: ["palm", "reef", "coral", "driftwood"]
  })
});

export const DEFAULT_ISLAND_OBJECT_RULES = Object.freeze({
  palm: Object.freeze({ id: "palm", kind: "vegetation", density: 18, masks: ["beach", "grass"], avoid: ["water", "cliff"], minShore: 8, maxShore: 120, maxSlope: 0.45, scale: [0.75, 1.45] }),
  tree: Object.freeze({ id: "tree", kind: "vegetation", density: 16, masks: ["grass"], avoid: ["water", "beach", "cliff"], minShore: 40, maxShore: 260, maxSlope: 0.38, scale: [0.8, 1.35] }),
  bush: Object.freeze({ id: "bush", kind: "vegetation", density: 24, masks: ["grass", "beach"], avoid: ["water", "cliff"], minShore: 14, maxShore: 240, maxSlope: 0.55, scale: [0.55, 1.25] }),
  rock: Object.freeze({ id: "rock", kind: "rock", density: 22, masks: ["rock", "grass", "beach"], avoid: ["water"], minShore: 0, maxShore: 360, maxSlope: 0.9, scale: [0.4, 1.6] }),
  boulder: Object.freeze({ id: "boulder", kind: "rock", density: 10, masks: ["rock", "cliff", "grass"], avoid: ["water"], minShore: 25, maxShore: 360, maxSlope: 1, scale: [0.9, 2.4] }),
  "coastal-rock": Object.freeze({ id: "coastal-rock", kind: "rock", density: 18, masks: ["beach", "shallowShelf", "rock"], avoid: [], minShore: -18, maxShore: 34, maxSlope: 1, scale: [0.6, 2.1] }),
  "cliff-rock": Object.freeze({ id: "cliff-rock", kind: "rock", density: 18, masks: ["cliff", "rock"], avoid: ["water"], minShore: 20, maxShore: 420, maxSlope: 1, scale: [0.8, 2.6] }),
  driftwood: Object.freeze({ id: "driftwood", kind: "shore-prop", density: 9, masks: ["beach", "wetSand"], avoid: ["water"], minShore: 0, maxShore: 34, maxSlope: 0.32, scale: [0.6, 1.4] }),
  reef: Object.freeze({ id: "reef", kind: "ocean-edge", density: 20, masks: ["shallowShelf"], avoid: ["land"], minShore: -90, maxShore: -12, maxSlope: 1, scale: [0.8, 2.8] }),
  coral: Object.freeze({ id: "coral", kind: "ocean-edge", density: 18, masks: ["shallowShelf"], avoid: ["land"], minShore: -120, maxShore: -24, maxSlope: 1, scale: [0.4, 1.3] }),
  ruin: Object.freeze({ id: "ruin", kind: "authored", density: 1, masks: ["grass", "rock"], avoid: ["water", "cliff"], minShore: 70, maxShore: 240, maxSlope: 0.22, scale: [1, 1.35] }),
  "cave-mouth": Object.freeze({ id: "cave-mouth", kind: "authored", density: 1, masks: ["cliff", "rock"], avoid: ["water"], minShore: 40, maxShore: 260, maxSlope: 1, scale: [1, 1.8] }),
  "smoke-vent": Object.freeze({ id: "smoke-vent", kind: "volcanic", density: 4, masks: ["rock", "cliff"], avoid: ["water", "beach"], minShore: 120, maxShore: 460, maxSlope: 1, scale: [0.8, 1.7] })
});

export function resolveOceanIslandPreset(name = "tropical-small-island") {
  return clone(OCEAN_ISLAND_LANDFORM_PRESETS[name] ?? OCEAN_ISLAND_LANDFORM_PRESETS["tropical-small-island"]);
}

export function createOceanIslandLandformState(options = {}) {
  const preset = resolveOceanIslandPreset(options.preset ?? options.presetId ?? "tropical-small-island");
  const radius = Math.max(16, number(options.radius, preset.radius));
  const seaLevel = number(options.seaLevel, preset.seaLevel);
  return {
    id: options.id ?? stableId("ocean-island-landform", options.seed ?? preset.id, radius, seaLevel),
    version: OCEAN_ISLAND_LANDFORM_DOMAIN_VERSION,
    seed: String(options.seed ?? `${preset.id}:seed`),
    preset: preset.id,
    biome: options.biome ?? preset.biome,
    transform: {
      position: vec3(options.transform?.position ?? options.position, { x: 0, y: 0, z: 0 }),
      rotation: number(options.transform?.rotation ?? options.rotation, 0),
      scale: number(options.transform?.scale ?? options.scale, 1)
    },
    radius,
    seaLevel,
    maxHeight: Math.max(0, number(options.maxHeight, preset.maxHeight)),
    beachWidth: Math.max(0, number(options.beachWidth, preset.beachWidth)),
    shelfWidth: Math.max(1, number(options.shelfWidth, preset.shelfWidth)),
    shelfDepth: Math.max(0, number(options.shelfDepth, preset.shelfDepth)),
    roughness: clamp(options.roughness ?? preset.roughness, 0, 1),
    coastIrregularity: clamp(options.coastIrregularity ?? preset.coastIrregularity, 0, 0.6),
    peakBias: clamp(options.peakBias ?? preset.peakBias, 0, 1.5),
    lagoonRadius: clamp(options.lagoonRadius ?? preset.lagoonRadius, 0, 0.85),
    craterRadius: clamp(options.craterRadius ?? preset.craterRadius, 0, 0.6),
    objectPalette: clone(options.objectPalette ?? preset.objectPalette ?? []),
    objectRules: clone({ ...DEFAULT_ISLAND_OBJECT_RULES, ...(options.objectRules ?? {}) }),
    render: {
      heightfieldResolution: Math.round(clamp(options.render?.heightfieldResolution ?? 49, 9, 129)),
      shorelineSegments: Math.round(clamp(options.render?.shorelineSegments ?? 96, 16, 256)),
      lod: clone(options.render?.lod ?? { near: 2, mid: 6, far: 18 })
    },
    validation: {
      rendererIndependent: true,
      oceanIsExternal: true,
      ownsLandformOnly: true,
      deterministic: true,
      insertableObject: true
    }
  };
}

function toLocalPoint(state, point = {}) {
  const p = vec2(point, { x: 0, z: 0 });
  const position = vec3(state.transform?.position, { x: 0, y: 0, z: 0 });
  const scale = Math.max(0.0001, number(state.transform?.scale, 1));
  const dx = (p.x - position.x) / scale;
  const dz = (p.z - position.z) / scale;
  const c = Math.cos(-number(state.transform?.rotation, 0));
  const s = Math.sin(-number(state.transform?.rotation, 0));
  return { x: dx * c - dz * s, z: dx * s + dz * c };
}

function toWorldPoint(state, local = {}) {
  const scale = Math.max(0.0001, number(state.transform?.scale, 1));
  const c = Math.cos(number(state.transform?.rotation, 0));
  const s = Math.sin(number(state.transform?.rotation, 0));
  const position = vec3(state.transform?.position, { x: 0, y: 0, z: 0 });
  return {
    x: position.x + (number(local.x) * c - number(local.z) * s) * scale,
    z: position.z + (number(local.x) * s + number(local.z) * c) * scale
  };
}

export function createIslandFootprint(stateInput = createOceanIslandLandformState(), point = {}) {
  const state = createOceanIslandLandformState(stateInput);
  const local = toLocalPoint(state, point);
  const distance = Math.hypot(local.x, local.z);
  const angle = Math.atan2(local.z, local.x);
  const coast = 1
    + Math.sin(angle * 3 + hashUnit(state.seed, "coast-a") * TWO_PI) * state.coastIrregularity * 0.45
    + Math.sin(angle * 7 + hashUnit(state.seed, "coast-b") * TWO_PI) * state.coastIrregularity * 0.28
    + (fbm(`${state.seed}:coast`, Math.cos(angle) * 2.1, Math.sin(angle) * 2.1, 3) - 0.5) * state.coastIrregularity;
  const radius = Math.max(8, state.radius * coast);
  const normalizedRadius = distance / radius;
  const signedDistance = distance - radius;
  return {
    local,
    distance,
    angle,
    coastFactor: coast,
    radius,
    normalizedRadius,
    signedDistance,
    isLand: normalizedRadius <= 1,
    shoreDistance: -signedDistance
  };
}

export function sampleIslandHeight(stateInput = createOceanIslandLandformState(), point = {}) {
  const state = createOceanIslandLandformState(stateInput);
  const footprint = createIslandFootprint(state, point);
  const d = footprint.normalizedRadius;
  const shoreInward = Math.max(0, 1 - d);
  const beachBand = state.beachWidth / Math.max(1, state.radius);
  const landBlend = smoothstep(0, Math.max(0.001, beachBand), shoreInward);
  const shelfBand = state.shelfWidth / Math.max(1, state.radius);

  if (d > 1) {
    const shelfT = smoothstep(0, Math.max(0.001, shelfBand), d - 1);
    return state.seaLevel - state.shelfDepth * shelfT;
  }

  const local = footprint.local;
  const broad = fbm(`${state.seed}:broad`, local.x / state.radius * 2.4, local.z / state.radius * 2.4, 4);
  const detail = fbm(`${state.seed}:detail`, local.x / state.radius * 9.5, local.z / state.radius * 9.5, 4);
  const centralRise = Math.pow(clamp(1 - d, 0, 1), 0.82) * (0.48 + state.peakBias * 0.52);
  const ridge = Math.pow(clamp(1 - Math.abs(d - 0.38) / 0.38, 0, 1), 1.8) * 0.18;
  const rough = (broad - 0.5) * state.roughness * 0.32 + (detail - 0.5) * state.roughness * 0.1;
  let height = state.seaLevel + state.maxHeight * landBlend * clamp(centralRise + ridge + rough, 0, 1.35);

  if (state.lagoonRadius > 0) {
    const lagoonEdge = state.lagoonRadius;
    const lagoonCut = 1 - smoothstep(lagoonEdge, lagoonEdge + 0.12, d);
    height -= lagoonCut * state.maxHeight * (state.preset === "atoll-island" ? 0.92 : 0.54);
  }

  if (state.craterRadius > 0) {
    const craterCut = 1 - smoothstep(state.craterRadius, state.craterRadius + 0.12, d);
    height -= craterCut * state.maxHeight * 0.34;
  }

  return height;
}

export function sampleIslandNormalHint(stateInput = createOceanIslandLandformState(), point = {}) {
  const state = createOceanIslandLandformState(stateInput);
  const eps = Math.max(1, state.radius / 256);
  const hL = sampleIslandHeight(state, { x: number(point.x) - eps, z: number(point.z) });
  const hR = sampleIslandHeight(state, { x: number(point.x) + eps, z: number(point.z) });
  const hD = sampleIslandHeight(state, { x: number(point.x), z: number(point.z) - eps });
  const hU = sampleIslandHeight(state, { x: number(point.x), z: number(point.z) + eps });
  const nx = hL - hR;
  const ny = eps * 2;
  const nz = hD - hU;
  const length = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / length, y: ny / length, z: nz / length };
}

export function sampleIslandMasks(stateInput = createOceanIslandLandformState(), point = {}) {
  const state = createOceanIslandLandformState(stateInput);
  const height = sampleIslandHeight(state, point);
  const footprint = createIslandFootprint(state, point);
  const normal = sampleIslandNormalHint(state, point);
  const slope = clamp(1 - normal.y, 0, 1);
  const shoreDistance = footprint.shoreDistance;
  const aboveSea = height - state.seaLevel;
  const water = aboveSea < 0;
  const beach = !water && shoreDistance >= 0 && shoreDistance <= state.beachWidth * 1.25 && slope < 0.42;
  const wetSand = !water && shoreDistance >= 0 && shoreDistance <= Math.max(4, state.beachWidth * 0.28);
  const shallowShelf = water && shoreDistance < 0 && Math.abs(shoreDistance) <= state.shelfWidth;
  const cliff = !water && slope > 0.48;
  const rock = !water && (cliff || slope > 0.3 || aboveSea > state.maxHeight * 0.54);
  const grass = !water && !beach && !rock;
  return {
    height,
    slope,
    shoreDistance,
    water: water ? 1 : 0,
    land: water ? 0 : 1,
    beach: beach ? 1 : 0,
    wetSand: wetSand ? 1 : 0,
    shallowShelf: shallowShelf ? 1 : 0,
    grass: grass ? 1 : 0,
    rock: rock ? 1 : 0,
    cliff: cliff ? 1 : 0,
    foam: Math.max(0, 1 - Math.abs(shoreDistance) / Math.max(1, state.beachWidth * 0.36)),
    vegetation: grass ? clamp(1 - slope * 1.6, 0, 1) : beach ? 0.22 : 0,
    walkable: !water && slope < 0.44 ? 1 : 0
  };
}

export function createIslandShoreline(stateInput = createOceanIslandLandformState(), options = {}) {
  const state = createOceanIslandLandformState(stateInput);
  const segments = Math.round(clamp(options.segments ?? state.render.shorelineSegments, 16, 256));
  return Array.from({ length: segments }, (_, index) => {
    const angle = index / segments * TWO_PI;
    const localProbe = { x: Math.cos(angle) * state.radius, z: Math.sin(angle) * state.radius };
    const probeWorld = toWorldPoint(state, localProbe);
    const footprint = createIslandFootprint(state, probeWorld);
    const local = { x: Math.cos(angle) * footprint.radius, z: Math.sin(angle) * footprint.radius };
    const world = toWorldPoint(state, local);
    return {
      id: `${state.id}:shore:${index}`,
      x: world.x,
      z: world.z,
      y: state.seaLevel,
      angle,
      radius: footprint.radius
    };
  });
}

export function createIslandHeightfield(stateInput = createOceanIslandLandformState(), options = {}) {
  const state = createOceanIslandLandformState(stateInput);
  const resolution = Math.round(clamp(options.resolution ?? state.render.heightfieldResolution, 9, 129));
  const extent = state.radius + state.shelfWidth;
  const samples = [];
  for (let zIndex = 0; zIndex < resolution; zIndex += 1) {
    for (let xIndex = 0; xIndex < resolution; xIndex += 1) {
      const u = resolution <= 1 ? 0 : xIndex / (resolution - 1);
      const v = resolution <= 1 ? 0 : zIndex / (resolution - 1);
      const local = { x: (u * 2 - 1) * extent, z: (v * 2 - 1) * extent };
      const world = toWorldPoint(state, local);
      const height = sampleIslandHeight(state, world);
      const masks = sampleIslandMasks(state, world);
      samples.push({ x: world.x, z: world.z, y: height, u, v, masks });
    }
  }
  return {
    type: "island-heightfield",
    resolution,
    extent,
    samples
  };
}

function maskAllowed(rule, masks) {
  const allowed = Array.isArray(rule.masks) ? rule.masks : [];
  const avoid = Array.isArray(rule.avoid) ? rule.avoid : [];
  const hasAllowed = allowed.length === 0 || allowed.some((key) => number(masks[key], 0) > 0.35);
  const hasAvoid = avoid.some((key) => number(masks[key], 0) > 0.35);
  return hasAllowed && !hasAvoid && masks.slope <= number(rule.maxSlope, 1);
}

export function createIslandObjectPlacements(stateInput = createOceanIslandLandformState(), options = {}) {
  const state = createOceanIslandLandformState(stateInput);
  const rng = createSeededRandom(`${state.seed}:objects:${state.preset}`);
  const palette = Array.isArray(options.objectPalette) ? options.objectPalette : state.objectPalette;
  const placements = [];
  for (const objectId of palette) {
    const rule = state.objectRules[objectId];
    if (!rule) continue;
    const targetCount = Math.round(clamp(number(rule.density, 1) * (state.radius / 420) * number(options.densityScale, 1), 0, 80));
    let tries = 0;
    let placed = 0;
    while (placed < targetCount && tries < targetCount * 30 + 40) {
      tries += 1;
      const angle = rng.range(0, TWO_PI);
      const radius = state.radius * Math.sqrt(rng.range(0, 1));
      const local = { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
      const world = toWorldPoint(state, local);
      const masks = sampleIslandMasks(state, world);
      const shore = masks.shoreDistance;
      if (shore < number(rule.minShore, -Infinity) || shore > number(rule.maxShore, Infinity)) continue;
      if (!maskAllowed(rule, masks)) continue;
      const scale = rng.range(rule.scale?.[0] ?? 1, rule.scale?.[1] ?? 1);
      placements.push({
        id: stableId("island-object", state.id, objectId, placed, tries),
        objectId,
        kind: rule.kind ?? "object",
        position: { x: world.x, y: masks.height, z: world.z },
        rotation: rng.range(0, TWO_PI),
        scale,
        masks: clone(masks),
        renderDescriptor: `${objectId}-descriptor`
      });
      placed += 1;
    }
  }
  return placements;
}

export function createIslandWaterInterface(stateInput = createOceanIslandLandformState()) {
  const state = createOceanIslandLandformState(stateInput);
  return {
    type: "island-water-interface",
    seaLevel: state.seaLevel,
    shoreline: createIslandShoreline(state),
    shallowShelf: {
      width: state.shelfWidth,
      depth: state.shelfDepth,
      descriptor: "underwater-shelf-contract"
    },
    foam: {
      mask: "shore-distance-foam-mask",
      bandWidth: Math.max(4, state.beachWidth * 0.36)
    },
    waveBreak: {
      radius: state.radius,
      shorelineDriven: true
    },
    oceanOwnership: "external-ocean-domain"
  };
}

export function createIslandBiomeProfile(stateInput = createOceanIslandLandformState()) {
  const state = createOceanIslandLandformState(stateInput);
  return {
    id: `${state.id}:biome`,
    biome: state.biome,
    preset: state.preset,
    materialPriority: ["water", "shallowShelf", "wetSand", "beach", "grass", "rock", "cliff"],
    vegetationBias: state.biome.includes("tropical") ? 1 : state.biome.includes("rocky") ? 0.22 : 0.55,
    rockBias: state.biome.includes("rocky") || state.biome.includes("volcanic") ? 1 : 0.45,
    authoredObjectPalette: clone(state.objectPalette)
  };
}

export function createOceanIslandLandformRenderContract(stateInput = createOceanIslandLandformState(), options = {}) {
  const state = createOceanIslandLandformState(stateInput);
  return {
    id: `${state.id}:render-contract`,
    type: "ocean-island-landform-render-contract",
    version: OCEAN_ISLAND_LANDFORM_DOMAIN_VERSION,
    rendererBoundary: {
      ownsRendererObjects: false,
      adapterRequired: true,
      oceanRendererExternal: true,
      terrainRendererExternal: true
    },
    transform: clone(state.transform),
    radius: state.radius,
    seaLevel: state.seaLevel,
    bounds: {
      center: clone(state.transform.position),
      radius: (state.radius + state.shelfWidth) * number(state.transform.scale, 1)
    },
    biome: createIslandBiomeProfile(state),
    heightfield: createIslandHeightfield(state, options.heightfield),
    shoreline: createIslandShoreline(state, options.shoreline),
    waterInterface: createIslandWaterInterface(state),
    objects: createIslandObjectPlacements(state, options.objects),
    navigation: {
      spawnPoint: (() => {
        const world = toWorldPoint(state, { x: state.radius * 0.18, z: -state.radius * 0.12 });
        return { x: world.x, y: sampleIslandHeight(state, world), z: world.z };
      })(),
      cameraFocus: (() => {
        const world = toWorldPoint(state, { x: 0, z: 0 });
        return { x: world.x, y: state.seaLevel + state.maxHeight * 0.38, z: world.z };
      })(),
      landingZones: []
    },
    lod: clone(state.render.lod),
    samplers: {
      height: "engine.oceanIslandLandform.sampleHeight(point)",
      masks: "engine.oceanIslandLandform.sampleMasks(point)"
    }
  };
}

export function validateOceanIslandLandform(stateInput = createOceanIslandLandformState()) {
  const state = createOceanIslandLandformState(stateInput);
  const failures = [];
  if (state.version !== OCEAN_ISLAND_LANDFORM_DOMAIN_VERSION) failures.push("version mismatch");
  if (!state.seed) failures.push("missing seed");
  if (state.radius <= 0) failures.push("radius must be positive");
  if (!Number.isFinite(state.seaLevel)) failures.push("seaLevel must be finite");
  if (state.validation.rendererIndependent !== true) failures.push("domain must stay renderer independent");
  if (state.validation.oceanIsExternal !== true) failures.push("ocean rendering must stay external");
  const contract = createOceanIslandLandformRenderContract(state, { heightfield: { resolution: 9 }, shoreline: { segments: 16 }, objects: { densityScale: 0.15 } });
  if (contract.rendererBoundary.ownsRendererObjects !== false) failures.push("render contract cannot own renderer objects");
  if (!contract.waterInterface || contract.waterInterface.oceanOwnership !== "external-ocean-domain") failures.push("water interface must point to external ocean domain");
  return { passed: failures.length === 0, failures };
}

export function createOceanIslandLandformDomainKit(nexusEngine = {}, options = {}) {
  const defs = createDefinitionFactory(nexusEngine);
  const IslandState = defs.resource(options.resourceName ?? "oceanIslandLandform.state");
  const IslandUpdated = defs.event("oceanIslandLandform.updated");
  const initial = () => createOceanIslandLandformState(options);

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.kitId ?? "ocean-island-landform-domain",
    resources: { IslandState },
    events: { IslandUpdated },
    systems: [],
    requires: [],
    provides: [
      "terrain:ocean-island-landform",
      "terrain:island-heightfield",
      "terrain:island-shoreline",
      "terrain:island-surface-masks",
      "terrain:island-object-placement",
      "water:island-interface",
      "render:island-landform-contract"
    ],
    initWorld({ world }) {
      ensureResource(world, IslandState, initial);
    },
    install({ engine, world }) {
      const getState = () => ensureResource(world, IslandState, initial);
      const commit = (next) => {
        world.setResource(IslandState, next);
        if (world.emit) world.emit(IslandUpdated, { state: clone(next) });
        return clone(next);
      };
      const api = {
        getState,
        getSnapshot: () => clone(getState()),
        reset: () => commit(initial()),
        set(config = {}) { return commit(createOceanIslandLandformState({ ...getState(), ...config })); },
        setPreset(preset) { return api.set({ preset, presetId: preset }); },
        setTransform(transform = {}) { return api.set({ transform: { ...getState().transform, ...transform } }); },
        setSeaLevel(seaLevel = 0) { return api.set({ seaLevel }); },
        setObjectPalette(objectPalette = []) { return api.set({ objectPalette }); },
        sampleHeight(point = {}) { return sampleIslandHeight(getState(), point); },
        sampleMasks(point = {}) { return sampleIslandMasks(getState(), point); },
        getRenderContract(config = {}) { return createOceanIslandLandformRenderContract(getState(), config); },
        validate: () => validateOceanIslandLandform(getState())
      };
      engine.oceanIslandLandform = api;
      engine.n = engine.n || {};
      engine.n.oceanIslandLandform = api;
    },
    metadata: {
      version: OCEAN_ISLAND_LANDFORM_DOMAIN_VERSION,
      domain: "ocean-island-landform",
      purpose: "Deterministic renderer-agnostic insertable island landform objects for ocean scenes."
    }
  });
}

export default createOceanIslandLandformDomainKit;
