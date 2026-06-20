import { createSeededRandom, number } from "../foundation-kit/index.js";

export const AAA_COUNTRYSIDE_FIELDS_VERSION = "0.0.3";
export const TAU = Math.PI * 2;
export const clamp01 = (v) => Math.max(0, Math.min(1, Number(v) || 0));
export const lerp = (a, b, t) => Number(a) + (Number(b) - Number(a)) * clamp01(t);
export const smooth = (a, b, v) => {
  const t = clamp01((Number(v) - a) / Math.max(0.00001, b - a));
  return t * t * (3 - 2 * t);
};
export const freeze = (v) => Array.isArray(v) ? Object.freeze(v.map(freeze)) : v && typeof v === "object" ? Object.freeze(Object.fromEntries(Object.entries(v).map(([k, e]) => [k, freeze(e)]))) : v;
export const rng = (seed, label) => createSeededRandom(`${seed ?? "meadow"}:${label}`);

export function valueNoise2(x, z, seed = 1) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const h = (a, b) => {
    let n = Math.imul(a + seed * 374761393, 668265263) ^ Math.imul(b + seed * 2246822519, 3266489917);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return lerp(lerp(h(ix, iz), h(ix + 1, iz), u), lerp(h(ix, iz + 1), h(ix + 1, iz + 1), u), v);
}

export function terrainHeight(x = 0, z = 0) {
  const sx = number(x) * 0.026;
  const sz = number(z) * 0.026;
  const valley = -1.25 * Math.exp(-((x + 8) ** 2 + (z - 4) ** 2) / 1650);
  const ridge = Math.sin(sx * 2.2 + 0.6) * 2.1 + Math.cos(sz * 1.65 - 0.3) * 1.3 + Math.sin((sx + sz) * 1.35 - 1.2) * 1.1;
  return ridge + valley + (valueNoise2(x * 0.085, z * 0.085, 4177) - 0.5) * 0.42 + (valueNoise2(x * 0.24 + 11, z * 0.24 - 7, 4194) - 0.5) * 0.13;
}

export function terrainNormal(x = 0, z = 0) {
  const e = 0.55;
  const nx = terrainHeight(x - e, z) - terrainHeight(x + e, z);
  const ny = 2 * e;
  const nz = terrainHeight(x, z - e) - terrainHeight(x, z + e);
  const length = Math.hypot(nx, ny, nz) || 1;
  return freeze({ x: nx / length, y: ny / length, z: nz / length });
}

export function segmentDistance(point, a, b) {
  const vx = b.x - a.x;
  const vz = b.z - a.z;
  const wx = point.x - a.x;
  const wz = point.z - a.z;
  const t = clamp01((wx * vx + wz * vz) / Math.max(0.00001, vx * vx + vz * vz));
  return Math.hypot(point.x - (a.x + vx * t), point.z - (a.z + vz * t));
}

export const pathPoints = freeze([
  { x: -29, z: -23 },
  { x: -19, z: -16 },
  { x: -10.5, z: -9.5 },
  { x: -6.8, z: -5.8 },
  { x: -1.5, z: -3.8 },
  { x: 10, z: 3 },
  { x: 29, z: 9 }
]);

export function pathDistance(x, z) {
  let distance = Infinity;
  for (let index = 0; index < pathPoints.length - 1; index += 1) {
    distance = Math.min(distance, segmentDistance({ x, z }, pathPoints[index], pathPoints[index + 1]));
  }
  return distance;
}

export const pathMask = (x, z) => 1 - smooth(1.35, 4.2, pathDistance(x, z));
export const yardMask = (x, z) => 1 - smooth(0.72, 1.08, Math.hypot((x + 7.8) / 11, (z + 5.2) / 8));

export function biomeAt(x, z) {
  const wet = smooth(1, 0, Math.hypot(x - 22, z + 30) / 28);
  const wild = smooth(1, 0, Math.hypot(x + 54, z + 28) / 48);
  const yard = yardMask(x, z);
  if (yard > 0.35) return freeze({ id: "settled-yard", grassScale: 0.48, flowerChance: 0.05, color: [0.35, 0.40, 0.20] });
  if (wet > 0.35) return freeze({ id: "cool-hollow", grassScale: 1.08, flowerChance: 0.18, color: [0.21, 0.39, 0.23] });
  if (wild > 0.25) return freeze({ id: "tall-wildflower", grassScale: 1.28, flowerChance: 0.34, color: [0.25, 0.44, 0.17] });
  return freeze({ id: "short-grazed", grassScale: 0.82, flowerChance: 0.10, color: [0.30, 0.48, 0.18] });
}

export function grassDensityAt(x, z) {
  const biome = biomeAt(x, z);
  const wear = Math.max(pathMask(x, z), yardMask(x, z) * 0.86);
  const grazing = Math.max(0, 1 - smooth(0.2, 1, Math.hypot(x + 23, z + 8) / 11)) * 0.42;
  const noise = valueNoise2(x * 0.035 + 71, z * 0.035 - 9, 8099);
  return clamp01((0.52 + biome.grassScale * 0.34 + (noise - 0.5) * 0.3) * (1 - wear * 0.86) * (1 - grazing));
}

export function sampleCycle(seconds = 0) {
  const cycleSeconds = 600;
  const normalized = ((seconds % cycleSeconds) + cycleSeconds) % cycleSeconds / cycleSeconds;
  const sunAngle = normalized * TAU - Math.PI * 0.58;
  const sunY = Math.sin(sunAngle);
  const day = smooth(-0.08, 0.34, sunY);
  const warm = Math.max(0, 1 - Math.abs(normalized - 0.77) / 0.12, 1 - Math.abs(normalized - 0.06) / 0.08);
  const night = 1 - day;
  const phase = normalized < 0.10 ? "dawn" : normalized < 0.30 ? "morning" : normalized < 0.50 ? "noon" : normalized < 0.70 ? "afternoon" : normalized < 0.85 ? "sunset" : "night";
  const sunDirection = { x: Math.cos(sunAngle) * 0.58, y: Math.max(-0.15, sunY), z: Math.sin(sunAngle) * 0.58 };
  return freeze({
    time: { cycleSeconds, elapsedSeconds: seconds, normalized, phase },
    light: { sunDirection, moonDirection: { x: -sunDirection.x, y: Math.max(0.12, -sunDirection.y), z: -sunDirection.z }, sunIntensity: lerp(0.02, 4.4, day), moonIntensity: lerp(0.75, 0.05, day), warmRim: clamp01(warm), dayAmount: day, nightAmount: night },
    sky: { horizon: [lerp(0.28, 1, day) + warm * 0.4, lerp(0.34, 0.66, day) + warm * 0.12, lerp(0.48, 0.42, day) - warm * 0.16], zenith: [lerp(0.025, 0.38, day), lerp(0.045, 0.62, day), lerp(0.11, 0.96, day)], stars: smooth(0.68, 0.92, night), exposure: lerp(0.62, 1.16, day) + warm * 0.08 },
    fog: { color: [0.55 + warm * 0.28 - night * 0.22, 0.68 + warm * 0.08 - night * 0.22, 0.62 + night * 0.18], density: 0.007 + night * 0.012 + warm * 0.004 },
    windows: { intensity: 0.15 + Math.max(night, warm * 0.8) * 3.1, bloom: 0.15 + Math.max(night, warm * 0.8) * 0.75 },
    postprocess: { enabled: true, exposure: 0.76 + day * 0.42 + warm * 0.08, saturation: 0.82 + day * 0.18 - night * 0.08, contrast: 1.04 + warm * 0.05 + night * 0.07, bloomStrength: 0.045 + warm * 0.18 + night * 0.36, vignette: 0.14 + night * 0.14, grain: 0.018 + night * 0.025, colorLift: [night * 0.015, warm * 0.012, night * 0.035] }
  });
}
