export const TAU = Math.PI * 2;
export const DEFAULT_SEED = "blackwake-public-demo-001";
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export function turnToward(a, b, t) {
  let delta = ((b - a + Math.PI) % TAU) - Math.PI;
  if (delta < -Math.PI) delta += TAU;
  return a + delta * t;
}

export function seedNumber(value) {
  let total = 0;
  const text = String(value || DEFAULT_SEED);
  for (let i = 0; i < text.length; i += 1) total = (total + text.charCodeAt(i) * (i + 1)) % 2147483647;
  return total || 1234567;
}

export function createRng(seed = DEFAULT_SEED) {
  let state = seedNumber(seed);
  return function rng() {
    state = state * 48271 % 2147483647;
    return state / 2147483647;
  };
}

export function createNoise(seed = DEFAULT_SEED) {
  const base = seedNumber(seed);
  return function noise(x, z) {
    const v = Math.sin((Math.floor(x) * 127.1 + Math.floor(z) * 311.7 + base) * 0.0174533) * 43758.5453;
    return (v - Math.floor(v)) * 2 - 1;
  };
}

export function smoothNoise(noise, x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const sx = xf * xf * (3 - 2 * xf);
  const sz = zf * zf * (3 - 2 * zf);
  const a = noise(xi, zi);
  const b = noise(xi + 1, zi);
  const c = noise(xi, zi + 1);
  const d = noise(xi + 1, zi + 1);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sz);
}
