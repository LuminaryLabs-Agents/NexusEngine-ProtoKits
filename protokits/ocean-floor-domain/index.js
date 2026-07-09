import {
  clone,
  createDefinitionFactory,
  defineInjectedRuntimeKit,
  ensureResource,
  number,
  stableId
} from "../protokit-core/index.js";

export const OCEAN_FLOOR_DOMAIN_VERSION = "0.1.0";

const TWO_PI = Math.PI * 2;

function hashUnit(seed = "seed", ...parts) {
  let hash = 2166136261;
  for (const char of [seed, ...parts].join(":").toString()) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function rng(seed) {
  let state = Math.floor(hashUnit(seed) * 0xffffffff) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
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
  return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
}

function fbm(seed, x, z, octaves = 4) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i += 1) {
    sum += valueNoise(`${seed}:${i}`, x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return norm ? sum / norm : 0;
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / Math.max(0.000001, edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function createOceanFloorState(options = {}) {
  return {
    id: options.id ?? "ocean-floor",
    version: OCEAN_FLOOR_DOMAIN_VERSION,
    seed: String(options.seed ?? "ocean-floor-001"),
    size: number(options.size, 3600),
    resolution: Math.round(Math.max(17, Math.min(81, number(options.resolution, 49)))),
    baseDepth: number(options.baseDepth, -128),
    islandRadius: number(options.islandRadius, 100),
    islandShelfRadius: number(options.islandShelfRadius, 155),
    islandInfluenceRadius: number(options.islandInfluenceRadius, 255),
    seaLevel: number(options.seaLevel, 0),
    shelfDepth: number(options.shelfDepth, -18),
    moundDepth: number(options.moundDepth, -42),
    noiseAmplitude: number(options.noiseAmplitude, 9),
    objects: {
      seaFloorRocks: Math.round(Math.max(0, number(options.objects?.seaFloorRocks, 42))),
      seaFloorBoulders: Math.round(Math.max(0, number(options.objects?.seaFloorBoulders, 18))),
      reefClusters: Math.round(Math.max(0, number(options.objects?.reefClusters, 18))),
      coralClusters: Math.round(Math.max(0, number(options.objects?.coralClusters, 24)))
    }
  };
}

export function sampleOceanFloorHeight(stateInput = createOceanFloorState(), point = {}) {
  const state = createOceanFloorState(stateInput);
  const x = number(point.x, 0);
  const z = number(point.z, 0);
  const d = Math.hypot(x, z);
  const broad = (fbm(`${state.seed}:broad`, x * 0.0026, z * 0.0026, 4) - 0.5) * state.noiseAmplitude * 1.2;
  const medium = (fbm(`${state.seed}:medium`, x * 0.009, z * 0.009, 3) - 0.5) * state.noiseAmplitude * 0.45;
  const base = state.baseDepth + broad + medium;
  const islandMound = smoothstep(state.islandInfluenceRadius, 0, d);
  const shelf = 1 - smoothstep(state.islandShelfRadius, state.islandInfluenceRadius, d);
  const nearIslandFloor = state.moundDepth * islandMound + base * (1 - islandMound);
  const shelfFloor = state.shelfDepth * shelf + nearIslandFloor * (1 - shelf);
  return Math.min(state.seaLevel - 2, shelfFloor);
}

export function createOceanFloorHeightfield(stateInput = createOceanFloorState(), options = {}) {
  const state = createOceanFloorState({ ...stateInput, ...options });
  const resolution = Math.round(Math.max(17, Math.min(81, number(options.resolution, state.resolution))));
  const size = number(options.size, state.size);
  const half = size * 0.5;
  const samples = [];
  for (let zi = 0; zi < resolution; zi += 1) {
    for (let xi = 0; xi < resolution; xi += 1) {
      const u = xi / (resolution - 1);
      const v = zi / (resolution - 1);
      const x = (u * 2 - 1) * half;
      const z = (v * 2 - 1) * half;
      const y = sampleOceanFloorHeight(state, { x, z });
      const d = Math.hypot(x, z);
      samples.push({
        x,
        y,
        z,
        u,
        v,
        masks: {
          shallowShelf: d <= state.islandInfluenceRadius ? 1 : 0,
          reefBand: d >= state.islandShelfRadius * 0.75 && d <= state.islandInfluenceRadius * 1.15 ? 1 : 0,
          deepFloor: d > state.islandInfluenceRadius ? 1 : 0
        }
      });
    }
  }
  return { type: "ocean-floor-heightfield", resolution, size, samples };
}

function request(id, objectType, position, scale, rotation, reason) {
  return {
    id,
    objectType,
    type: objectType,
    position,
    rotation,
    scale,
    reason,
    render: { meshType: objectType, lod: "seafloor-simple" },
    state: { procedural: true },
    parentId: "ocean-floor:objects"
  };
}

export function createOceanFloorObjectPlacements(stateInput = createOceanFloorState(), options = {}) {
  const state = createOceanFloorState({ ...stateInput, ...options });
  const random = rng(`${state.seed}:objects`);
  const objects = [];
  let index = 0;
  function placeRing(objectType, count, minRadius, maxRadius, scaleMin, scaleMax, reason) {
    for (let i = 0; i < count; i += 1) {
      const angle = random() * TWO_PI;
      const radius = minRadius + (maxRadius - minRadius) * Math.sqrt(random());
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = sampleOceanFloorHeight(state, { x, z });
      const scale = scaleMin + (scaleMax - scaleMin) * random();
      objects.push(request(stableId("ocean-floor-object", state.seed, objectType, index++), objectType, { x, y, z }, scale, angle, reason));
    }
  }
  placeRing("reef-cluster", state.objects.reefClusters, state.islandShelfRadius * 0.75, state.islandInfluenceRadius * 1.08, 0.9, 2.3, "shallow-reef-band");
  placeRing("coral-cluster", state.objects.coralClusters, state.islandShelfRadius * 0.85, state.islandInfluenceRadius * 1.18, 0.45, 1.35, "shallow-coral-band");
  placeRing("sea-floor-rock", state.objects.seaFloorRocks, state.islandInfluenceRadius * 0.8, state.size * 0.46, 0.45, 1.7, "bumpy-seafloor-rock");
  placeRing("sea-floor-boulder", state.objects.seaFloorBoulders, state.islandInfluenceRadius * 1.05, state.size * 0.42, 1.15, 3.4, "deep-seafloor-boulder");
  return objects;
}

export function createOceanFloorRenderContract(stateInput = createOceanFloorState(), options = {}) {
  const state = createOceanFloorState({ ...stateInput, ...options });
  return {
    id: `${state.id}:render-contract`,
    type: "ocean-floor-render-contract",
    version: OCEAN_FLOOR_DOMAIN_VERSION,
    seaLevel: state.seaLevel,
    heightfield: createOceanFloorHeightfield(state, options.heightfield ?? {}),
    objects: createOceanFloorObjectPlacements(state, options.objects ?? {}),
    waterMaterial: {
      opacity: 0.75,
      transparency: 0.25,
      roughness: 0.14,
      metalness: 0.12,
      envMapIntensity: 1.8,
      color: "#22b9c9",
      deepColor: "#07536a",
      shallowColor: "#7fe6d3"
    },
    rendererBoundary: { ownsRendererObjects: false, adapterRequired: true }
  };
}

export function createOceanFloorDomainKit(nexusEngine = {}, options = {}) {
  const defs = createDefinitionFactory(nexusEngine);
  const State = defs.resource(options.resourceName ?? "oceanFloor.state");
  const initial = () => createOceanFloorState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.kitId ?? "ocean-floor-domain",
    resources: { State },
    provides: ["ocean:floor-heightfield", "ocean:island-floor-influence", "ocean:floor-object-placement", "render:ocean-floor-contract"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const getState = () => ensureResource(world, State, initial);
      engine.oceanFloor = {
        getState,
        getSnapshot: () => clone(getState()),
        sampleHeight: (point) => sampleOceanFloorHeight(getState(), point),
        getRenderContract: (config = {}) => createOceanFloorRenderContract(getState(), config),
        reset() { const next = initial(); world.setResource(State, next); return next; }
      };
      engine.n = engine.n || {};
      engine.n.oceanFloor = engine.oceanFloor;
    },
    metadata: { version: OCEAN_FLOOR_DOMAIN_VERSION, domain: "ocean-floor", purpose: "Generate bumpy seafloor heightfields, island influence mounds, and procedural underwater rock/reef/coral placements." }
  });
}

export default createOceanFloorDomainKit;
