import { createSeededRandom, defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const SCATTER_OBJECT_KIT_VERSION = "0.0.1";

export const defaultScatterTypes = Object.freeze({
  can: { radius: 0.08, height: 0.16, color: "#a66c32", weight: 4 },
  tire: { radius: 0.28, height: 0.38, color: "#161616", weight: 2 },
  pipe: { radius: 0.14, height: 0.28, color: "#77736a", weight: 3 },
  crate: { radius: 0.32, height: 0.48, color: "#7c5931", weight: 1 },
  panel: { radius: 0.24, height: 0.26, color: "#6c7171", weight: 2 }
});

export function weightedPick(random, entries) {
  const total = entries.reduce((sum, [, item]) => sum + (item.weight ?? 1), 0);
  let cursor = random() * total;
  for (const entry of entries) {
    cursor -= entry[1].weight ?? 1;
    if (cursor <= 0) return entry;
  }
  return entries[entries.length - 1];
}

export function createScatterObject(type, x, y, options = {}) {
  const descriptor = { ...(defaultScatterTypes[type] ?? defaultScatterTypes.can), ...(options.descriptor ?? {}) };
  return { id: options.id ?? `${type}-${Math.round(x * 100)}-${Math.round(y * 100)}`, type, x, y, radius: options.radius ?? descriptor.radius ?? 0.15, height: options.height ?? descriptor.height ?? 0.25, color: options.color ?? descriptor.color ?? "#d9a33d", rotation: options.rotation ?? (options.random ?? Math.random)() * Math.PI * 2, interactive: options.interactive ?? false };
}

export function generateScatterObjects(options = {}) {
  const random = options.random ?? createSeededRandom(options.seed ?? "scatter-object-kit");
  const entries = Object.entries({ ...defaultScatterTypes, ...(options.types ?? {}) });
  const validator = options.validator ?? { valid: () => true, grid: { width: 16, height: 16 } };
  const objects = [];
  for (let index = 0; index < (options.count ?? 48); index += 1) {
    for (let attempt = 0; attempt < (options.attempts ?? 64); attempt += 1) {
      const point = { x: 1 + random() * Math.max(1, validator.grid.width - 2), y: 1 + random() * Math.max(1, validator.grid.height - 2) };
      if (!validator.valid(point)) continue;
      const [type, descriptor] = weightedPick(random, entries);
      const item = createScatterObject(type, point.x, point.y, { random, descriptor });
      const tooClose = objects.some((other) => Math.hypot(other.x - item.x, other.y - item.y) < other.radius + item.radius + (options.padding ?? 0.12));
      if (!tooClose || options.allowOverlap) { objects.push(item); break; }
    }
  }
  return objects;
}

export function createScatterObjectKit(nexusRealtime = {}, options = {}) {
  const kit = { id: options.id ?? "scatter-object-kit", version: SCATTER_OBJECT_KIT_VERSION, defaultScatterTypes, weightedPick, createScatterObject, generateScatterObjects };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusRealtime, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["detail:scatter-objects", "placement:scatter"], bindings: { scatterObjectKit: kit }, metadata: { version: SCATTER_OBJECT_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
