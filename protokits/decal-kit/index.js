import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const DECAL_KIT_VERSION = "0.0.1";

export const defaultDecalTypes = Object.freeze({
  oil: { material: "oil", radius: [0.18, 0.72], alpha: 0.45 },
  crack: { material: "scratchedMetal", radius: [0.25, 0.9], alpha: 0.32 },
  tire: { material: "dirt", radius: [0.12, 0.35], alpha: 0.38 },
  bolt: { material: "scratchedMetal", radius: [0.03, 0.08], alpha: 0.65 },
  paint: { material: "hazardPaint", radius: [0.08, 0.32], alpha: 0.5 }
});

export function createDecal(type = "oil", x = 0, y = 0, options = {}) {
  const descriptor = { ...(defaultDecalTypes[type] ?? defaultDecalTypes.oil), ...(options.descriptor ?? {}) };
  const radiusRange = descriptor.radius ?? [0.2, 0.6];
  const random = options.random ?? Math.random;
  return {
    id: options.id ?? `decal-${type}-${Math.round(x * 100)}-${Math.round(y * 100)}`,
    type,
    x,
    y,
    radius: options.radius ?? (radiusRange[0] + (radiusRange[1] - radiusRange[0]) * random()),
    rotation: options.rotation ?? random() * Math.PI * 2,
    alpha: options.alpha ?? descriptor.alpha ?? 0.4,
    material: options.material ?? descriptor.material ?? "dirt"
  };
}

export function generateDecals(options = {}) {
  const random = options.random ?? Math.random;
  const count = options.count ?? 32;
  const types = options.types ?? Object.keys(defaultDecalTypes);
  const validator = options.validator ?? { valid: () => true, grid: { width: 16, height: 16 } };
  const decals = [];
  for (let index = 0; index < count; index += 1) {
    for (let attempt = 0; attempt < (options.attempts ?? 40); attempt += 1) {
      const point = { x: 1 + random() * Math.max(1, validator.grid.width - 2), y: 1 + random() * Math.max(1, validator.grid.height - 2) };
      if (!validator.valid(point)) continue;
      decals.push(createDecal(types[Math.floor(random() * types.length)], point.x, point.y, { random }));
      break;
    }
  }
  return decals;
}

export function sampleDecalAt(decals = [], x = 0, y = 0) {
  let best = null;
  let strength = 0;
  for (const decal of decals) {
    const distance = Math.hypot(x - decal.x, y - decal.y);
    if (distance > decal.radius) continue;
    const nextStrength = (1 - distance / decal.radius) * decal.alpha;
    if (nextStrength > strength) { strength = nextStrength; best = decal; }
  }
  return best ? { decal: best, strength } : null;
}

export function drawTopDownDecals(ctx, decals = [], options = {}) {
  const scale = options.scale ?? 1;
  for (const decal of decals) {
    ctx.save();
    ctx.globalAlpha = decal.alpha;
    ctx.translate((options.x ?? 0) + decal.x * scale, (options.y ?? 0) + decal.y * scale);
    ctx.rotate(decal.rotation);
    ctx.beginPath();
    ctx.ellipse(0, 0, decal.radius * scale, decal.radius * scale * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = options.colorFor?.(decal) ?? "#1b1712";
    ctx.fill();
    ctx.restore();
  }
}

export function createDecalKit(nexusEngine = {}, options = {}) {
  const kit = { id: options.id ?? "decal-kit", version: DECAL_KIT_VERSION, defaultDecalTypes, createDecal, generateDecals, sampleDecalAt, drawTopDownDecals };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusEngine, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["detail:decals", "surface:decal-sampling"], bindings: { decalKit: kit }, metadata: { version: DECAL_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
