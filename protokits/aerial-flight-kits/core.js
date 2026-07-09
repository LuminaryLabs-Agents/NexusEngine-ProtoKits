export const GENERIC_AERIAL_FLIGHT_KITS_VERSION = '0.2.0';

export const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, num(value, min)));
export const mix = (a, b, t) => num(a) + (num(b) - num(a)) * clamp(t, 0, 1);
export const smoothstep = (edge0, edge1, value) => {
  const t = clamp((num(value) - num(edge0)) / Math.max(0.000001, num(edge1) - num(edge0)), 0, 1);
  return t * t * (3 - 2 * t);
};
export const smootherstep = (t) => {
  t = clamp(t, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const dt = (world) => clamp(num(world?.__nexusClock?.delta, 1 / 60), 0, 0.1);
export const now = (world) => num(world?.__nexusClock?.elapsed, 0);
export const len3 = (v = {}) => Math.hypot(num(v.x), num(v.y), num(v.z));
export const norm3 = (v = {}) => {
  const length = len3(v) || 1;
  return { x: num(v.x) / length, y: num(v.y) / length, z: num(v.z) / length };
};
export const add3 = (a = {}, b = {}) => ({ x: num(a.x) + num(b.x), y: num(a.y) + num(b.y), z: num(a.z) + num(b.z) });
export const sub3 = (a = {}, b = {}) => ({ x: num(a.x) - num(b.x), y: num(a.y) - num(b.y), z: num(a.z) - num(b.z) });
export const mul3 = (v = {}, scalar = 1) => ({ x: num(v.x) * scalar, y: num(v.y) * scalar, z: num(v.z) * scalar });
export const lerp3 = (a = {}, b = {}, t = 0) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) });

export function hashString(input) {
  let hash = 2166136261;
  for (const char of String(input ?? 'seed')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed = 'seed') {
  let state = hashString(seed) || 1;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function hashGrid(seed, x, z) {
  let h = hashString(seed);
  h ^= Math.imul(Math.floor(x), 374761393);
  h ^= Math.imul(Math.floor(z), 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function valueNoise(seed, x = 0, z = 0) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const u = smootherstep(fx);
  const v = smootherstep(fz);
  const a = hashGrid(seed, ix, iz);
  const b = hashGrid(seed, ix + 1, iz);
  const c = hashGrid(seed, ix, iz + 1);
  const d = hashGrid(seed, ix + 1, iz + 1);
  return mix(mix(a, b, u), mix(c, d, u), v) * 2 - 1;
}

export function fbm(seed, x = 0, z = 0, options = {}) {
  const octaves = Math.max(1, Math.floor(num(options.octaves, 5)));
  let amplitude = num(options.amplitude, 0.5);
  let frequency = num(options.frequency, 1);
  const lacunarity = num(options.lacunarity, 2);
  const gain = num(options.gain, 0.5);
  let value = 0;
  let total = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    value += valueNoise(`${seed}:${octave}`, x * frequency, z * frequency) * amplitude;
    total += amplitude;
    frequency *= lacunarity;
    amplitude *= gain;
  }
  return total > 0 ? value / total : 0;
}

export function ridgedFbm(seed, x = 0, z = 0, options = {}) {
  const octaves = Math.max(1, Math.floor(num(options.octaves, 4)));
  let amplitude = num(options.amplitude, 0.55);
  let frequency = num(options.frequency, 1);
  const lacunarity = num(options.lacunarity, 2.05);
  const gain = num(options.gain, 0.48);
  let value = 0;
  let total = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    const n = valueNoise(`${seed}:ridge:${octave}`, x * frequency, z * frequency);
    const ridge = 1 - Math.abs(n);
    value += ridge * ridge * amplitude;
    total += amplitude;
    frequency *= lacunarity;
    amplitude *= gain;
  }
  return total > 0 ? value / total : 0;
}

export function terrainHeight(config = {}, x = 0, z = 0) {
  const seed = config.seed ?? 'generic-aerial-terrain';
  const scale = num(config.scale, 0.0028);
  const nx = x * scale;
  const nz = z * scale;
  const warpStrength = num(config.domainWarp, 0.72);
  const wx = fbm(`${seed}:warp-x`, nx * 0.42, nz * 0.42, { octaves: 3, amplitude: 0.5 }) * warpStrength;
  const wz = fbm(`${seed}:warp-z`, nx * 0.42 + 17.1, nz * 0.42 - 9.7, { octaves: 3, amplitude: 0.5 }) * warpStrength;
  const xw = nx + wx;
  const zw = nz + wz;

  const continental = fbm(`${seed}:continental`, xw * 0.42, zw * 0.42, { octaves: 5, amplitude: 0.55, gain: 0.52 });
  const hills = fbm(`${seed}:hills`, xw * 1.15, zw * 1.15, { octaves: 5, amplitude: 0.5, gain: 0.48 });
  const ridges = ridgedFbm(`${seed}:mountains`, xw * 0.82, zw * 0.82, { octaves: 5, amplitude: 0.62, gain: 0.46 });
  const valleyMask = smoothstep(0.33, 0.82, ridges);
  const river = 1 - Math.abs(fbm(`${seed}:valleys`, xw * 0.58, zw * 0.58, { octaves: 4, amplitude: 0.5 }));
  const valleyCut = smoothstep(0.68, 0.96, river) * num(config.valleyDepth, 44) * (1 - valleyMask * 0.45);
  const detail = fbm(`${seed}:detail`, xw * 3.25, zw * 3.25, { octaves: 3, amplitude: 0.32, gain: 0.45 }) * num(config.detailScale, 9);

  let height = continental * num(config.continentalScale, 65)
    + hills * num(config.hillScale, 34)
    + ridges * num(config.heightScale, 145)
    + detail
    - valleyCut
    + num(config.baseHeight, -42);

  const waterLevel = num(config.waterLevel, -42);
  if (height < waterLevel) height = waterLevel + (height - waterLevel) * 0.08;
  return height;
}

export function terrainBiome(config, x, z) {
  const height = terrainHeight(config, x, z);
  if (height < num(config.shoreline, -32)) return 'shore';
  if (height > num(config.timberline, 135)) return 'alpine';
  const slope = 1 - terrainNormal(config, x, z).y;
  if (slope > num(config.rockSlope, 0.34)) return 'rock';
  return 'forest';
}

export function terrainNormal(config = {}, x = 0, z = 0, step = 3) {
  const hL = terrainHeight(config, x - step, z);
  const hR = terrainHeight(config, x + step, z);
  const hD = terrainHeight(config, x, z - step);
  const hU = terrainHeight(config, x, z + step);
  return norm3({ x: hL - hR, y: step * 4, z: hD - hU });
}

export function forwardFromRotation(rotation = {}) {
  const pitch = num(rotation.pitch);
  const yaw = num(rotation.yaw);
  return norm3({ x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) });
}

export function createDefinitions(NexusEngine = {}) {
  const defineResource = NexusEngine.defineResource ?? ((name) => Object.freeze({ kind: 'resource', name }));
  const defineEvent = NexusEngine.defineEvent ?? ((name) => Object.freeze({ kind: 'event', name }));
  return {
    State: defineResource('generic.aerial.state'),
    Command: defineEvent('generic.aerial.command'),
    CheckpointCollected: defineEvent('generic.aerial.checkpoint.collected'),
    Boosted: defineEvent('generic.aerial.boosted'),
    ChallengeCompleted: defineEvent('generic.aerial.challenge.completed')
  };
}

export function createBaseState(config = {}) {
  const seed = config.seed ?? 'generic-aerial-adventure';
  const terrain = { seed, scale: 0.0028, heightScale: 145, waterLevel: -42, shoreline: -32, timberline: 135, patchSize: 420, sampleSegments: 28, ...(config.terrain ?? {}) };
  const body = {
    id: config.bodyId ?? 'player',
    position: { x: 0, y: terrainHeight(terrain, 0, 0) + num(config.spawnAltitude, 120), z: 0 },
    velocity: { x: 0, y: -2, z: -38 },
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    speed: 38,
    onGround: false,
    stalled: false,
    lastGroundHeight: terrainHeight(terrain, 0, 0)
  };
  return {
    version: GENERIC_AERIAL_FLIGHT_KITS_VERSION,
    seed,
    sky: {},
    terrain,
    input: { pitch: 0, bank: 0, yaw: 0, brake: 0, boost: false },
    body,
    world: { patches: [], patchSize: terrain.patchSize, patchCacheKey: null },
    checkpoints: { items: [], collectedIds: [], score: 0, recentCollectedId: null },
    liftVolumes: { items: [], activeIds: [] },
    flock: { agents: [] },
    challenge: { prompt: 'Find a glowing ring', completed: false, targetCheckpoints: num(config.challenge?.targetCheckpoints, 10) },
    camera: {},
    vfx: {},
    audio: {},
    renderDescriptor: null,
    boost: { cooldown: 0, lastTriggeredAt: -999 },
    updatedAt: 0
  };
}

export function ensureState(world, definitions, config) {
  let state = world.getResource(definitions.State);
  if (!state) {
    state = createBaseState(config);
    world.setResource(definitions.State, state);
  }
  return state;
}

export function writeState(world, definitions, state) {
  world.setResource(definitions.State, { ...state, updatedAt: now(world) });
}

export function makeRuntimeKit(NexusEngine, config) {
  return (NexusEngine.defineRuntimeKit ?? ((kit) => Object.freeze(kit)))(config);
}

export function installApi(engine, world, definitions, key, config) {
  const api = {
    getState: () => ensureState(world, definitions, config),
    command(payload = {}) {
      world.emit(definitions.Command, payload);
      return api.getState();
    }
  };
  engine[key] = api;
  return api;
}
