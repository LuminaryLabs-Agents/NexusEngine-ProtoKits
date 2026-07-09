export const FOUNDATION_KIT_VERSION = "0.0.1";

export function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return number(a) + (number(b) - number(a)) * clamp(t, 0, 1);
}

export function approach(current, target, rate, delta) {
  return lerp(current, target, 1 - Math.exp(-Math.max(0, rate) * Math.max(0, delta)));
}

export function wrapRadians(value) {
  let angle = number(value);
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

export function normalize2(x, y) {
  const length = Math.hypot(number(x), number(y));
  if (length <= 0.000001) return { x: 0, y: 0, length: 0 };
  return { x: number(x) / length, y: number(y) / length, length };
}

export function distance2(a, b) {
  return Math.hypot(number(a?.x) - number(b?.x), number(a?.y ?? a?.z) - number(b?.y ?? b?.z));
}

export function hashString(value = "foundation") {
  let hash = 2166136261;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed = "foundation") {
  let state = hashString(seed) || 1;
  function random() {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  random.range = (min = 0, max = 1) => min + (max - min) * random();
  random.int = (min = 0, max = 1) => Math.floor(random.range(min, max + 1));
  random.pick = (values, fallback = null) => values?.length ? values[Math.floor(random() * values.length)] : fallback;
  random.chance = (probability = 0.5) => random() < probability;
  random.seed = seed;
  return random;
}

export function createIdFactory(prefix = "id") {
  let next = 0;
  return function makeId(label = prefix) {
    next += 1;
    return `${label}-${next.toString(36)}`;
  };
}

export function defineInjectedRuntimeKit(nexusEngine = {}, config = {}) {
  if (typeof nexusEngine.defineRuntimeKit === "function") {
    return nexusEngine.defineRuntimeKit(config);
  }

  return Object.freeze({
    id: config.id ?? "runtime-kit",
    components: config.components ?? {},
    resources: config.resources ?? {},
    events: config.events ?? {},
    systems: (config.systems ?? []).map((entry) => (
      typeof entry === "function"
        ? { phase: "simulate", system: entry, name: entry.name || "anonymousSystem" }
        : {
            phase: entry.phase ?? "simulate",
            system: entry.system,
            name: entry.name ?? entry.system?.name ?? "anonymousSystem"
          }
    )),
    shaders: config.shaders ?? [],
    materials: config.materials ?? [],
    sequences: config.sequences ?? [],
    subscriptions: config.subscriptions ?? [],
    requires: Array.isArray(config.requires) ? config.requires.slice() : config.requires ? [config.requires] : [],
    provides: Array.isArray(config.provides) ? config.provides.slice() : config.provides ? [config.provides] : [],
    bindings: Object.freeze({ ...(config.bindings ?? {}) }),
    initWorld: config.initWorld,
    install: config.install,
    metadata: Object.freeze({ ...(config.metadata ?? {}) })
  });
}

export function createMemoryStore(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    get: (key, fallback = undefined) => values.has(key) ? values.get(key) : fallback,
    set(key, value) {
      values.set(key, value);
      return value;
    },
    has: (key) => values.has(key),
    delete: (key) => values.delete(key),
    clear: () => values.clear(),
    entries: () => Array.from(values.entries()),
    snapshot: () => Object.fromEntries(values.entries())
  };
}

export function createSpatialHash(cellSize = 1) {
  const cells = new Map();
  const key = (x, y) => `${Math.floor(number(x) / cellSize)},${Math.floor(number(y) / cellSize)}`;
  return {
    insert(item, x = item?.x, y = item?.y) {
      const cellKey = key(x, y);
      if (!cells.has(cellKey)) cells.set(cellKey, new Set());
      cells.get(cellKey).add(item);
      return cellKey;
    },
    query(x, y, radius = cellSize) {
      const out = new Set();
      const minX = Math.floor((number(x) - radius) / cellSize);
      const maxX = Math.floor((number(x) + radius) / cellSize);
      const minY = Math.floor((number(y) - radius) / cellSize);
      const maxY = Math.floor((number(y) + radius) / cellSize);
      for (let cy = minY; cy <= maxY; cy += 1) {
        for (let cx = minX; cx <= maxX; cx += 1) {
          for (const item of cells.get(`${cx},${cy}`) ?? []) out.add(item);
        }
      }
      return Array.from(out);
    },
    clear: () => cells.clear(),
    cells
  };
}

export function createFoundationKit(nexusEngine = {}, options = {}) {
  const seed = options.seed ?? "foundation-kit";
  const random = createSeededRandom(seed);
  const makeId = createIdFactory(options.idPrefix ?? "entity");
  const api = {
    id: options.id ?? "foundation-kit",
    version: FOUNDATION_KIT_VERSION,
    seed,
    random,
    makeId,
    number,
    clamp,
    lerp,
    approach,
    wrapRadians,
    normalize2,
    distance2,
    hashString,
    createSeededRandom,
    createIdFactory,
    createMemoryStore,
    createSpatialHash
  };

  return Object.freeze({
    ...api,
    createRuntimeKit(runtimeOptions = {}) {
      return defineInjectedRuntimeKit(nexusEngine, {
        id: runtimeOptions.id ?? api.id,
        provides: runtimeOptions.provides ?? ["foundation:math", "foundation:random", "foundation:ids"],
        bindings: { foundationKit: api },
        metadata: { version: FOUNDATION_KIT_VERSION, seed, ...(runtimeOptions.metadata ?? {}) }
      });
    }
  });
}
