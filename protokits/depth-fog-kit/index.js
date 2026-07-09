import { clamp, defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const DEPTH_FOG_KIT_VERSION = "0.0.1";

function parseColor(color) {
  if (typeof color === "object" && color) return color;
  const clean = String(color ?? "#000000").replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function toColor({ r, g, b }) {
  return `rgb(${Math.round(clamp(r, 0, 255))},${Math.round(clamp(g, 0, 255))},${Math.round(clamp(b, 0, 255))})`;
}

export function fogAmount(distance, options = {}) {
  const near = options.near ?? 3;
  const far = options.far ?? 16;
  const density = options.density ?? 1;
  return clamp((distance - near) / Math.max(0.0001, far - near), 0, 1) ** density;
}

export function mixFogColor(color, distance, options = {}) {
  const source = parseColor(color);
  const fog = parseColor(options.color ?? "#151820");
  const amount = fogAmount(distance, options);
  return toColor({ r: source.r + (fog.r - source.r) * amount, g: source.g + (fog.g - source.g) * amount, b: source.b + (fog.b - source.b) * amount });
}

export function drawFogOverlay(ctx, width, height, options = {}) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, options.inner ?? 60, width / 2, height / 2, Math.max(width, height) * (options.outerScale ?? 0.72));
  gradient.addColorStop(0, `rgba(0,0,0,${options.centerAlpha ?? 0})`);
  gradient.addColorStop(1, options.edgeColor ?? "rgba(0,0,0,.72)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function createDepthFogKit(nexusEngine = {}, options = {}) {
  const kit = { id: options.id ?? "depth-fog-kit", version: DEPTH_FOG_KIT_VERSION, fogAmount, mixFogColor, drawFogOverlay };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusEngine, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["render:depth-fog", "lighting:fog"], bindings: { depthFogKit: kit }, metadata: { version: DEPTH_FOG_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
