export const PROTOKIT_CORE_VERSION = "0.0.1";

export const number = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

export const clamp = (value, min, max) => Math.max(min, Math.min(max, number(value, min)));
export const lerp = (a, b, t) => number(a) + (number(b) - number(a)) * clamp(t, 0, 1);
export const approach = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-Math.max(0, number(rate)) * Math.max(0, number(dt))));
export const asList = (value) => value == null ? [] : Array.isArray(value) ? value.slice() : [value];
export const clone = (value) => value == null ? value : typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
export const distance2D = (a = {}, b = {}) => Math.hypot(number(a.x) - number(b.x), number(a.y ?? a.z) - number(b.y ?? b.z));
export const getClockDelta = (world, fallback = 1 / 60) => clamp(number(world?.__nexusClock?.delta, fallback), 0, 0.1);
export const getClockElapsed = (world, fallback = 0) => number(world?.__nexusClock?.elapsed, fallback);

export function createFallbackDefinition(kind, name) {
  return Object.freeze({ kind, name });
}

export function defineInjectedRuntimeKit(nexusRealtime = {}, config = {}) {
  if (typeof nexusRealtime.defineRuntimeKit === "function") return nexusRealtime.defineRuntimeKit(config);
  return Object.freeze({
    id: config.id ?? "runtime-kit",
    components: config.components ?? {},
    resources: config.resources ?? {},
    events: config.events ?? {},
    systems: (config.systems ?? []).map((entry) => typeof entry === "function"
      ? { phase: "simulate", system: entry, name: entry.name || "anonymousSystem" }
      : { phase: entry.phase ?? "simulate", system: entry.system, name: entry.name ?? entry.system?.name ?? "anonymousSystem" }),
    shaders: config.shaders ?? [],
    materials: config.materials ?? [],
    sequences: config.sequences ?? [],
    subscriptions: config.subscriptions ?? [],
    requires: asList(config.requires),
    provides: asList(config.provides),
    bindings: Object.freeze({ ...(config.bindings ?? {}) }),
    initWorld: config.initWorld,
    install: config.install,
    metadata: Object.freeze({ ...(config.metadata ?? {}) })
  });
}

export function createDefinitionFactory(nexusRealtime = {}) {
  return {
    component: nexusRealtime.defineComponent ?? ((name) => createFallbackDefinition("component", name)),
    resource: nexusRealtime.defineResource ?? ((name) => createFallbackDefinition("resource", name)),
    event: nexusRealtime.defineEvent ?? ((name) => createFallbackDefinition("event", name))
  };
}

export function ensureResource(world, resource, fallback) {
  if (!world.hasResource(resource)) {
    const value = typeof fallback === "function" ? fallback() : clone(fallback);
    world.setResource(resource, value);
    return value;
  }
  return world.getResource(resource);
}

export function hashString(input) {
  let hash = 2166136261;
  for (const char of String(input ?? "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const scopedSeed = (...parts) => parts.flatMap((part) => Array.isArray(part) ? part : [part]).filter((part) => part != null && String(part).length > 0).join(":");
export const stableId = (prefix = "id", ...parts) => `${prefix}-${hashString(scopedSeed(...parts)).toString(36)}`;
export const byId = (items = []) => Object.fromEntries(asList(items).filter((item) => item?.id).map((item) => [item.id, item]));

export function createSeededRandom(seed = "seed") {
  let state = hashString(seed) || 1;
  const next = () => {
    state |= 0;
    state = state + 0x6D2B79F5 | 0;
    let t = Math.imul(state ^ state >>> 15, 1 | state);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  return {
    seed: String(seed),
    next,
    range: (min = 0, max = 1) => number(min) + next() * (number(max, 1) - number(min)),
    int(min = 0, max = 1) { return Math.floor(this.range(min, max + 1)); },
    bool: (chance = 0.5) => next() < clamp(chance, 0, 1),
    fork: (...parts) => createSeededRandom(scopedSeed(seed, ...parts))
  };
}

export function weightedChoice(items = [], rng = createSeededRandom(), weightKey = "weight") {
  const list = asList(items).filter(Boolean);
  if (!list.length) return null;
  const total = list.reduce((sum, item) => sum + Math.max(0, number(item?.[weightKey], 1)), 0);
  let cursor = rng.next() * Math.max(0.000001, total);
  for (const item of list) {
    cursor -= Math.max(0, number(item?.[weightKey], 1));
    if (cursor <= 0) return item;
  }
  return list[list.length - 1];
}
