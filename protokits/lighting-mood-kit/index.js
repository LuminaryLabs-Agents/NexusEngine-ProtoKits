import { clamp, defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const LIGHTING_MOOD_KIT_VERSION = "0.0.1";

export const moodPresets = Object.freeze({
  garageWarm: { ambient: 0.42, tint: "#ffd28a", falloff: 5.5 },
  moonlit: { ambient: 0.24, tint: "#9db4ff", falloff: 8.0 },
  hazardRed: { ambient: 0.28, tint: "#ff6650", falloff: 4.0 },
  dustyNoon: { ambient: 0.55, tint: "#ffe1a8", falloff: 9.0 }
});

function parseColor(color) {
  const clean = String(color ?? "#ffffff").replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function rgb({ r, g, b }) {
  return `rgb(${Math.round(clamp(r, 0, 255))},${Math.round(clamp(g, 0, 255))},${Math.round(clamp(b, 0, 255))})`;
}

export function createLightField(options = {}) {
  const preset = { ...(moodPresets[options.preset ?? "garageWarm"] ?? moodPresets.garageWarm), ...options };
  const lights = [...(options.lights ?? [])];
  return {
    preset,
    lights,
    add(light) { lights.push({ ...light }); return lights[lights.length - 1]; },
    sample(x = 0, y = 0) {
      let intensity = preset.ambient ?? 0.35;
      let tint = parseColor(preset.tint ?? "#ffffff");
      for (const light of lights) {
        const distance = Math.hypot(x - light.x, y - light.y);
        const amount = clamp(1 - distance / (light.radius ?? preset.falloff ?? 6), 0, 1) * (light.intensity ?? 1);
        const color = parseColor(light.color ?? preset.tint);
        intensity += amount;
        tint = { r: tint.r + (color.r - tint.r) * amount, g: tint.g + (color.g - tint.g) * amount, b: tint.b + (color.b - tint.b) * amount };
      }
      return { intensity: clamp(intensity, 0, 2), tint: rgb(tint) };
    }
  };
}

export function shadeColor(color, light = { intensity: 1 }) {
  const source = parseColor(color);
  const intensity = light.intensity ?? 1;
  return rgb({ r: source.r * intensity, g: source.g * intensity, b: source.b * intensity });
}

export function createLightingMoodKit(nexusEngine = {}, options = {}) {
  const kit = { id: options.id ?? "lighting-mood-kit", version: LIGHTING_MOOD_KIT_VERSION, moodPresets, createLightField, shadeColor };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusEngine, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["lighting:mood", "lighting:local-lights"], bindings: { lightingMoodKit: kit }, metadata: { version: LIGHTING_MOOD_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
