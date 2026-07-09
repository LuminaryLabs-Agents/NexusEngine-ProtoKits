import { clamp, hashString, defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const PROCEDURAL_TEXTURE_KIT_VERSION = "0.0.1";

export const materialPalettes = Object.freeze({
  rust: ["#2b1711", "#6b2d16", "#a34f1c", "#d8842b"],
  dirt: ["#1b1712", "#3f3122", "#735736", "#9f7a4b"],
  oil: ["#08090b", "#171a21", "#2a2638", "#3c4b54"],
  concrete: ["#2f3030", "#545554", "#74716b", "#999287"],
  scratchedMetal: ["#25282a", "#555a5c", "#8d9290", "#c0c0b8"],
  hazardPaint: ["#16120c", "#5f4316", "#d19a27", "#f3d15a"]
});

export function hash2(x, y, seed = "texture") {
  const h = hashString(`${seed}:${Math.floor(x)}:${Math.floor(y)}`);
  return (h % 100000) / 100000;
}

export function noise2(x, y, seed = "texture") {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed), c = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed);
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}

export function fbm2(x, y, options = {}) {
  const octaves = options.octaves ?? 4;
  let amplitude = 0.5, frequency = options.frequency ?? 1, value = 0, total = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    value += noise2(x * frequency, y * frequency, `${options.seed ?? "texture"}:${octave}`) * amplitude;
    total += amplitude;
    amplitude *= options.gain ?? 0.5;
    frequency *= options.lacunarity ?? 2;
  }
  return total ? value / total : 0;
}

function hexToRgb(hex) {
  const clean = String(hex).replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function rgbToHex({ r, g, b }) {
  const toHex = (value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function paletteSample(palette, t) {
  const colors = palette?.length ? palette : materialPalettes.concrete;
  const scaled = clamp(t, 0, 0.99999) * (colors.length - 1);
  const index = Math.floor(scaled), local = scaled - index;
  const a = hexToRgb(colors[index]), b = hexToRgb(colors[Math.min(colors.length - 1, index + 1)]);
  return rgbToHex({ r: a.r + (b.r - a.r) * local, g: a.g + (b.g - a.g) * local, b: a.b + (b.b - a.b) * local });
}

export function sampleProceduralMaterial(material = "concrete", x = 0, y = 0, options = {}) {
  const palette = Array.isArray(material) ? material : materialPalettes[material] ?? materialPalettes.concrete;
  const scale = options.scale ?? 1.6;
  const base = fbm2(x * scale, y * scale, { seed: `${options.seed ?? "texture"}:${material}`, octaves: options.octaves ?? 4 });
  const scratches = Math.abs(noise2(x * 14.0, y * 1.4, `${options.seed ?? "texture"}:scratch`) - 0.5) * 0.32;
  const stains = fbm2(x * 0.33, y * 0.33, { seed: `${options.seed ?? "texture"}:stain`, octaves: 3 }) * 0.22;
  return paletteSample(palette, clamp(base * 0.78 + scratches + stains, 0, 1));
}

export function createTextureSampler(options = {}) {
  return function textureSampler(material, x, y, localOptions = {}) {
    return sampleProceduralMaterial(material, x, y, { ...options, ...localOptions });
  };
}

export function createTextureCanvas(material = "concrete", options = {}) {
  const doc = options.document ?? globalThis.document;
  if (!doc?.createElement) return null;
  const size = options.size ?? 128;
  const canvas = doc.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const color = hexToRgb(sampleProceduralMaterial(material, x / size * 8, y / size * 8, options));
    const index = (y * size + x) * 4;
    image.data[index] = color.r; image.data[index + 1] = color.g; image.data[index + 2] = color.b; image.data[index + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function createProceduralTextureKit(nexusEngine = {}, options = {}) {
  const kit = { id: options.id ?? "procedural-texture-kit", version: PROCEDURAL_TEXTURE_KIT_VERSION, palettes: materialPalettes, hash2, noise2, fbm2, paletteSample, sampleProceduralMaterial, createTextureSampler, createTextureCanvas };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusEngine, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["texture:procedural", "texture:noise", "material:palettes"], bindings: { proceduralTextureKit: kit }, metadata: { version: PROCEDURAL_TEXTURE_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
