import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";
import { sampleTerrainMaterialPaint } from "../terrain-material-paint-domain-kit/index.js";
import { applyCelShade } from "../cel-shading-domain-kit/index.js";

export const TERRAIN_SHAPING_DOMAIN_KIT_VERSION = "0.1.0";

export const DEFAULT_TERRAIN_SHAPING_CONFIG = Object.freeze({
  peakGain: 1.85,
  peakSharpness: 1.5,
  ridgeHeight: 34,
  ridgeScale: 0.009,
  ridgeCrossScale: 0.006,
  valleyDepth: 42,
  valleyScale: 0.0036,
  valleySharpness: 6,
  terraceStepNear: 6,
  terraceStepMid: 10,
  terraceStepFar: 18,
  terraceStrengthNear: 0.08,
  terraceStrengthMid: 0.16,
  terraceStrengthFar: 0.26,
  slopeRockMix: 3.2,
  normalStep: 4,
  snowLine: 180,
  baseLevel: 0,
  midDistance: 2400,
  farDistance: 7000,
  materialPaint: {},
  celShading: {}
});

const PALETTES = Object.freeze({
  meadow: { low: [0.34, 0.50, 0.24], mid: [0.50, 0.64, 0.36], high: [0.66, 0.72, 0.49] },
  forest: { low: [0.15, 0.31, 0.18], mid: [0.27, 0.43, 0.25], high: [0.43, 0.54, 0.35] },
  rocky: { low: [0.32, 0.34, 0.31], mid: [0.47, 0.49, 0.44], high: [0.65, 0.65, 0.58] },
  highland: { low: [0.37, 0.44, 0.34], mid: [0.54, 0.59, 0.45], high: [0.70, 0.70, 0.59] },
  snow: { low: [0.75, 0.78, 0.73], mid: [0.86, 0.87, 0.82], high: [0.95, 0.96, 0.92] }
});

const lerp = (a, b, t) => number(a) + (number(b) - number(a)) * clamp(t, 0, 1);
const rgbMix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgbScale = (rgb, s) => rgb.map((value) => clamp(value * s, 0, 1));

function distanceBand(distance = 0, config = {}) {
  const d = Math.max(0, number(distance, 0));
  if (d >= number(config.farDistance, 7000)) return "far";
  if (d >= number(config.midDistance, 2400)) return "mid";
  return "near";
}

function terraceForBand(band, config = {}) {
  if (band === "far") return { step: number(config.terraceStepFar, 18), strength: number(config.terraceStrengthFar, 0.26) };
  if (band === "mid") return { step: number(config.terraceStepMid, 10), strength: number(config.terraceStrengthMid, 0.16) };
  return { step: number(config.terraceStepNear, 6), strength: number(config.terraceStrengthNear, 0.08) };
}

function fallbackTerrainColor(biome = "forest", height = 0, slope = 0, x = 0, z = 0, config = {}) {
  const palette = height > number(config.snowLine, 180) ? PALETTES.snow : (PALETTES[biome] ?? PALETTES.forest);
  const elevation = clamp((height + 140) / 360, 0, 1);
  const base = elevation < 0.52 ? rgbMix(palette.low, palette.mid, elevation / 0.52) : rgbMix(palette.mid, palette.high, (elevation - 0.52) / 0.48);
  const rock = clamp(number(slope) * number(config.slopeRockMix, 3.2), 0, 0.76);
  const rocky = rgbMix(base, PALETTES.rocky.mid, rock);
  const strata = Math.sin(height / Math.max(1, number(config.terraceStepMid, 10)) * Math.PI) * 0.035;
  const wash = Math.sin(number(x) * 0.006 + number(z) * 0.004 + height * 0.03) * 0.03;
  return rgbScale(rocky, 1 + strata + wash);
}

export function shapeTerrainHeight(x = 0, z = 0, baseHeight = 0, options = {}) {
  const config = { ...DEFAULT_TERRAIN_SHAPING_CONFIG, ...(options.config ?? options) };
  const distance = number(options.distance, 0);
  const band = options.band ?? distanceBand(distance, config);
  const relative = number(baseHeight) - number(config.baseLevel, 0);
  const peak = relative > 0 ? Math.pow(relative / 100, number(config.peakSharpness, 1.5)) * 100 * (number(config.peakGain, 1.85) - 1) : relative * 0.18;
  const ridgeA = Math.sin(number(x) * number(config.ridgeScale, 0.009) + number(z) * number(config.ridgeCrossScale, 0.006));
  const ridgeB = Math.cos(number(x) * number(config.ridgeCrossScale, 0.006) * 0.72 - number(z) * number(config.ridgeScale, 0.009) * 0.82);
  const ridge = (Math.abs(ridgeA * ridgeB) - 0.42) * number(config.ridgeHeight, 34);
  const valleyLine = Math.abs(Math.sin(number(x) * number(config.valleyScale, 0.0036) + number(z) * number(config.valleyScale, 0.0036) * 0.61));
  const valley = Math.pow(1 - valleyLine, number(config.valleySharpness, 6)) * number(config.valleyDepth, 42);
  const hydrologyCarve = number(options.hydrology?.riverCarve, 0);
  const shaped = number(baseHeight) + peak + ridge - valley - hydrologyCarve;
  const terrace = terraceForBand(band, config);
  const terraced = Math.round(shaped / Math.max(1, terrace.step)) * Math.max(1, terrace.step);
  return lerp(shaped, terraced, terrace.strength);
}

export function createTerrainShapingDomainKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const TerrainShapingState = resource(options.resourceName ?? "terrainShaping.state");
  const TerrainShapingSampled = event("terrainShaping.sampled");
  const initial = () => ({
    version: TERRAIN_SHAPING_DOMAIN_KIT_VERSION,
    seed: options.seed ?? "terrain-shaping",
    config: { ...DEFAULT_TERRAIN_SHAPING_CONFIG, ...(options.shaping ?? options.config ?? options) }
  });

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "terrain-shaping-domain-kit",
    resources: { TerrainShapingState },
    events: { TerrainShapingSampled },
    provides: ["terrain:shaping", "terrain:mountain-form", "terrain:visual-sample", "terrain:material-painted", "terrain:cel-shaded"],
    initWorld({ world }) { ensureResource(world, TerrainShapingState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, TerrainShapingState, initial);
      const baseSampler = () => engine.baseTerrainSampler ?? engine.terrainSampler;
      const baseHeight = (x, z) => baseSampler()?.getHeight?.(x, z) ?? 0;
      const baseBiome = (x, z) => baseSampler()?.getBiome?.(x, z) ?? "forest";

      function sampleAt(x = 0, z = 0, context = {}) {
        const config = state().config;
        const hydrology = context.hydrology ?? engine.terrainHydrology?.sampleAt?.(x, z) ?? null;
        const height = shapeTerrainHeight(x, z, baseHeight(x, z), { ...context, config, hydrology });
        const normal = sampleNormal(x, z, context);
        const slope = clamp(1 - number(normal.y, 1), 0, 1);
        const biome = baseBiome(x, z);
        const unpainted = fallbackTerrainColor(biome, height, slope, x, z, config);
        const paint = sampleTerrainMaterialPaint({ x: number(x), z: number(z), height, normal, slope, biome, hydrology }, { ...(config.materialPaint ?? {}), snowLine: config.materialPaint?.snowLine ?? config.snowLine });
        const paintedColor = paint?.color ?? unpainted;
        const color = applyCelShade(paintedColor, { x: number(x), z: number(z), height, normal, slope, biome, hydrology }, config.celShading ?? {});
        return { x: number(x), z: number(z), height, normal, slope, biome, color, paint, hydrology, band: context.band ?? distanceBand(context.distance, config) };
      }

      function sampleNormal(x = 0, z = 0, context = {}) {
        const config = state().config;
        const step = Math.max(1, number(config.normalStep, 4));
        const hL = shapeTerrainHeight(x - step, z, baseHeight(x - step, z), { ...context, config, hydrology: engine.terrainHydrology?.sampleAt?.(x - step, z) });
        const hR = shapeTerrainHeight(x + step, z, baseHeight(x + step, z), { ...context, config, hydrology: engine.terrainHydrology?.sampleAt?.(x + step, z) });
        const hD = shapeTerrainHeight(x, z - step, baseHeight(x, z - step), { ...context, config, hydrology: engine.terrainHydrology?.sampleAt?.(x, z - step) });
        const hU = shapeTerrainHeight(x, z + step, baseHeight(x, z + step), { ...context, config, hydrology: engine.terrainHydrology?.sampleAt?.(x, z + step) });
        const nx = hL - hR;
        const ny = step * 2;
        const nz = hD - hU;
        const len = Math.hypot(nx, ny, nz) || 1;
        return { x: nx / len, y: ny / len, z: nz / len };
      }

      engine.terrainShaping = {
        getState: state,
        sampleBaseHeight: baseHeight,
        sampleShapedHeight(x = 0, z = 0, context = {}) { return sampleAt(number(x), number(z), context).height; },
        sampleNormal,
        sampleSlope(x = 0, z = 0, context = {}) { return sampleAt(number(x), number(z), context).slope; },
        sampleBiome: baseBiome,
        sampleVisual: sampleAt,
        sampleAt,
        traceSample(x = 0, z = 0, context = {}) {
          const sample = sampleAt(number(x), number(z), context);
          world.emit(TerrainShapingSampled, { x: sample.x, z: sample.z, sample: clone(sample) });
          return sample;
        },
        getPatchDescriptor(px, pz, patchSize = 500) {
          const cx = number(px) * patchSize;
          const cz = number(pz) * patchSize;
          const sample = sampleAt(cx, cz);
          return { id: `terrain-patch:${px},${pz}`, px, pz, patchSize, center: { x: cx, z: cz, y: sample.height }, biome: sample.biome, seed: `${state().seed}:patch:${px}:${pz}` };
        },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: TERRAIN_SHAPING_DOMAIN_KIT_VERSION, purpose: "Distance-aware mountain shaping, hydrology carve, material painting, cel shading, and terrain visual samples." }
  });
}

export default createTerrainShapingDomainKit;
