import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const CEL_SHADING_DOMAIN_KIT_VERSION = "0.1.0";

export const DEFAULT_CEL_SHADING_CONFIG = Object.freeze({
  enabled: true,
  bands: [0.42, 0.62, 0.82, 1.0],
  shadowStrength: 0.34,
  highlightStrength: 0.1,
  rimStrength: 0.12,
  sunDirection: { x: -0.35, y: 0.72, z: 0.42 }
});

const rgbMix = (a = [0, 0, 0], b = [1, 1, 1], t = 0) => [
  number(a[0]) + (number(b[0]) - number(a[0])) * clamp(t, 0, 1),
  number(a[1]) + (number(b[1]) - number(a[1])) * clamp(t, 0, 1),
  number(a[2]) + (number(b[2]) - number(a[2])) * clamp(t, 0, 1)
];
const rgbScale = (rgb, s) => rgb.map((v) => clamp(v * s, 0, 1));
const len = (v = {}) => Math.hypot(number(v.x), number(v.y), number(v.z));
const norm = (v = {}, fallback = { x: 0, y: 1, z: 0 }) => {
  const l = len(v);
  return l > 0.000001 ? { x: number(v.x) / l, y: number(v.y) / l, z: number(v.z) / l } : clone(fallback);
};
const dot = (a = {}, b = {}) => number(a.x) * number(b.x) + number(a.y) * number(b.y) + number(a.z) * number(b.z);

export function quantizeCelTone(value = 1, bands = DEFAULT_CEL_SHADING_CONFIG.bands) {
  const tone = clamp(value, 0, 1);
  const sorted = [...(Array.isArray(bands) && bands.length ? bands : DEFAULT_CEL_SHADING_CONFIG.bands)].map((v) => clamp(v, 0, 1)).sort((a, b) => a - b);
  for (const band of sorted) if (tone <= band) return band;
  return sorted[sorted.length - 1] ?? 1;
}

export function applyCelShade(color = [1, 1, 1], sample = {}, options = {}) {
  const config = { ...DEFAULT_CEL_SHADING_CONFIG, ...(options.config ?? options) };
  if (config.enabled === false) return color.map((v) => clamp(v, 0, 1));
  const normal = norm(sample.normal, { x: 0, y: 1, z: 0 });
  const sun = norm(config.sunDirection, DEFAULT_CEL_SHADING_CONFIG.sunDirection);
  const light = clamp(dot(normal, sun) * 0.5 + 0.5, 0, 1);
  const band = quantizeCelTone(light, config.bands);
  const shadowed = rgbScale(color, 1 - number(config.shadowStrength, 0.34) * (1 - band));
  const highlighted = rgbMix(shadowed, [1, 1, 0.92], number(config.highlightStrength, 0.1) * Math.max(0, band - 0.78));
  const rim = Math.pow(1 - clamp(normal.y, 0, 1), 2) * number(config.rimStrength, 0.12);
  return rgbMix(highlighted, [0.78, 0.90, 1.0], rim);
}

export function createCelShadingDomainKit(nexusRealtime = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusRealtime);
  const CelShadingState = resource(options.resourceName ?? "celShading.state");
  const initial = () => ({
    version: CEL_SHADING_DOMAIN_KIT_VERSION,
    config: { ...DEFAULT_CEL_SHADING_CONFIG, ...(options.celShading ?? options.config ?? options) }
  });

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "cel-shading-domain-kit",
    resources: { CelShadingState },
    provides: ["render:cel-shading", "terrain:cel-tone"],
    initWorld({ world }) { ensureResource(world, CelShadingState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, CelShadingState, initial);
      engine.celShading = {
        getState: state,
        quantize(value = 1) { return quantizeCelTone(value, state().config.bands); },
        shade(color = [1, 1, 1], sample = {}) { return applyCelShade(color, sample, state().config); },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: CEL_SHADING_DOMAIN_KIT_VERSION, purpose: "Renderer-agnostic cel tone quantization and stylized color shading service." }
  });
}

export default createCelShadingDomainKit;
