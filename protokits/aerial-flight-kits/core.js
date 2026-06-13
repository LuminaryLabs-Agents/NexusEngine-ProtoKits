export const GENERIC_AERIAL_FLIGHT_KITS_VERSION = '0.1.0';

export const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, num(value, min)));
export const dt = (world) => clamp(num(world?.__nexusClock?.delta, 1 / 60), 0, 0.1);
export const now = (world) => num(world?.__nexusClock?.elapsed, 0);
export const len3 = (v = {}) => Math.hypot(num(v.x), num(v.y), num(v.z));
export const norm3 = (v = {}) => {
  const length = len3(v) || 1;
  return { x: num(v.x) / length, y: num(v.y) / length, z: num(v.z) / length };
};
export const add3 = (a = {}, b = {}) => ({ x: num(a.x) + num(b.x), y: num(a.y) + num(b.y), z: num(a.z) + num(b.z) });
export const mul3 = (v = {}, scalar = 1) => ({ x: num(v.x) * scalar, y: num(v.y) * scalar, z: num(v.z) * scalar });

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

export function noise2(seed, x, z) {
  const value = Math.sin(x * 12.9898 + z * 78.233 + hashString(seed) * 0.00001) * 43758.5453;
  return value - Math.floor(value);
}

export function terrainHeight(config = {}, x = 0, z = 0) {
  const scale = num(config.scale, 0.004);
  const nx = x * scale;
  const nz = z * scale;
  let ridge = 1 - Math.abs(2 * noise2(`${config.seed}:ridge`, nx, nz) - 1);
  ridge *= ridge;
  let height = noise2(`${config.seed}:base`, nx * 0.3, nz * 0.3) * 42 + ridge * num(config.heightScale, 110) + noise2(`${config.seed}:detail`, nx * 4, nz * 4) * 24 - 42;
  const waterLevel = num(config.waterLevel, -42);
  if (height < waterLevel) height = waterLevel + (height - waterLevel) * 0.08;
  return height;
}

export function terrainBiome(config, x, z) {
  const height = terrainHeight(config, x, z);
  if (height < num(config.shoreline, -32)) return 'shore';
  if (height > num(config.timberline, 135)) return 'alpine';
  return 'forest';
}

export function forwardFromRotation(rotation = {}) {
  const pitch = num(rotation.pitch);
  const yaw = num(rotation.yaw);
  return norm3({ x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) });
}

export function createDefinitions(NexusRealtime = {}) {
  const defineResource = NexusRealtime.defineResource ?? ((name) => Object.freeze({ kind: 'resource', name }));
  const defineEvent = NexusRealtime.defineEvent ?? ((name) => Object.freeze({ kind: 'event', name }));
  return {
    State: defineResource('generic.aerial.state'),
    Command: defineEvent('generic.aerial.command'),
    CheckpointCollected: defineEvent('generic.aerial.checkpoint.collected'),
    Boosted: defineEvent('generic.aerial.boosted')
  };
}

export function createBaseState(config = {}) {
  const seed = config.seed ?? 'generic-aerial-adventure';
  const terrain = { seed, scale: 0.004, heightScale: 110, waterLevel: -42, shoreline: -32, timberline: 135, patchSize: 420, ...(config.terrain ?? {}) };
  const body = {
    id: config.bodyId ?? 'player',
    position: { x: 0, y: terrainHeight(terrain, 0, 0) + num(config.spawnAltitude, 110), z: 0 },
    velocity: { x: 0, y: -2, z: -38 },
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    speed: 38,
    onGround: false,
    lastGroundHeight: terrainHeight(terrain, 0, 0)
  };
  return {
    version: GENERIC_AERIAL_FLIGHT_KITS_VERSION,
    seed,
    sky: {},
    terrain,
    input: { pitch: 0, bank: 0, yaw: 0, brake: 0, boost: false },
    body,
    world: { patches: [] },
    checkpoints: { items: [], collectedIds: [], score: 0 },
    liftVolumes: { items: [] },
    flock: { agents: [] },
    challenge: { prompt: 'Find a glowing ring', completed: false },
    camera: {},
    vfx: {},
    audio: {},
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

export function makeRuntimeKit(NexusRealtime, config) {
  return (NexusRealtime.defineRuntimeKit ?? ((kit) => Object.freeze(kit)))(config);
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
