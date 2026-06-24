import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const TERRAIN_MATERIAL_PAINT_DOMAIN_KIT_VERSION = "0.1.0";

export const DEFAULT_TERRAIN_MATERIAL_PAINT_CONFIG = Object.freeze({
  textureScale: 0.018,
  detailScale: 0.071,
  noiseStrength: 0.08,
  layerContrast: 1.18,
  riverPaintStrength: 0.72,
  snowLine: 190,
  snowSoftness: 44,
  slopeRockStart: 0.18,
  slopeRockEnd: 0.56,
  palette: {
    grass: [0.46, 0.58, 0.34],
    meadow: [0.58, 0.67, 0.42],
    forest: [0.24, 0.40, 0.24],
    highland: [0.58, 0.61, 0.47],
    rock: [0.49, 0.52, 0.47],
    cliff: [0.36, 0.42, 0.39],
    snow: [0.88, 0.90, 0.84],
    river: [0.55, 0.76, 0.78],
    silt: [0.55, 0.54, 0.39]
  }
});

const lerp = (a, b, t) => number(a) + (number(b) - number(a)) * clamp(t, 0, 1);
const smoothstep = (a, b, v) => {
  const t = clamp((number(v) - number(a)) / Math.max(0.000001, number(b) - number(a)), 0, 1);
  return t * t * (3 - 2 * t);
};
const rgbMix = (a = [0, 0, 0], b = [1, 1, 1], t = 0) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgbScale = (rgb, s) => rgb.map((v) => clamp(v * s, 0, 1));

function textureNoise(x = 0, z = 0, config = {}) {
  const a = Math.sin(number(x) * number(config.textureScale, 0.018) + Math.cos(number(z) * number(config.textureScale, 0.018) * 0.73) * 2.4);
  const b = Math.sin((number(x) + number(z) * 0.37) * number(config.detailScale, 0.071));
  return (a * 0.65 + b * 0.35) * number(config.noiseStrength, 0.08);
}

function biomeBaseColor(biome = "forest", palette = DEFAULT_TERRAIN_MATERIAL_PAINT_CONFIG.palette) {
  if (biome === "meadow") return palette.meadow;
  if (biome === "highland") return palette.highland;
  if (biome === "rocky") return palette.rock;
  return palette.forest ?? palette.grass;
}

export function sampleTerrainMaterialPaint(sample = {}, options = {}) {
  const config = { ...DEFAULT_TERRAIN_MATERIAL_PAINT_CONFIG, ...(options.config ?? options) };
  const palette = { ...DEFAULT_TERRAIN_MATERIAL_PAINT_CONFIG.palette, ...(config.palette ?? {}) };
  const height = number(sample.height);
  const slope = clamp(number(sample.slope), 0, 1);
  const moisture = clamp(number(sample.hydrology?.moisture), 0, 1);
  const river = clamp(number(sample.hydrology?.riverMask), 0, 1);
  const valley = clamp(number(sample.hydrology?.valleyMask), 0, 1);
  const snow = smoothstep(number(config.snowLine, 190) - number(config.snowSoftness, 44), number(config.snowLine, 190) + number(config.snowSoftness, 44), height);
  const rock = smoothstep(number(config.slopeRockStart, 0.18), number(config.slopeRockEnd, 0.56), slope);
  const silt = clamp(valley * 0.42 + moisture * 0.32, 0, 1);
  const noise = textureNoise(sample.x, sample.z, config);

  let color = biomeBaseColor(sample.biome, palette);
  color = rgbMix(color, palette.silt, silt * 0.42);
  color = rgbMix(color, palette.rock, rock * 0.72);
  color = rgbMix(color, palette.cliff, Math.max(0, rock - 0.55) * 0.55);
  color = rgbMix(color, palette.river, river * number(config.riverPaintStrength, 0.72));
  color = rgbMix(color, palette.snow, snow * (1 - river * 0.75));
  color = rgbScale(color, 1 + noise * number(config.layerContrast, 1.18));

  return {
    color,
    layers: {
      biome: 1,
      silt,
      rock,
      snow,
      river,
      moisture,
      noise
    },
    materialIds: ["terrain.biome", "terrain.silt", "terrain.rock", "terrain.snow", "terrain.river"],
    style: "procedural-material-paint"
  };
}

export function createTerrainMaterialPaintDomainKit(nexusRealtime = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusRealtime);
  const TerrainMaterialPaintState = resource(options.resourceName ?? "terrainMaterialPaint.state");
  const initial = () => ({
    version: TERRAIN_MATERIAL_PAINT_DOMAIN_KIT_VERSION,
    seed: options.seed ?? "terrain-material-paint",
    config: { ...DEFAULT_TERRAIN_MATERIAL_PAINT_CONFIG, ...(options.materialPaint ?? options.config ?? options) }
  });

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "terrain-material-paint-domain-kit",
    resources: { TerrainMaterialPaintState },
    provides: ["terrain:material-paint", "terrain:texture-layers"],
    initWorld({ world }) { ensureResource(world, TerrainMaterialPaintState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, TerrainMaterialPaintState, initial);
      engine.terrainMaterialPaint = {
        getState: state,
        sampleAt(sample = {}) { return sampleTerrainMaterialPaint(sample, state().config); },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: TERRAIN_MATERIAL_PAINT_DOMAIN_KIT_VERSION, purpose: "Procedural multi-layer terrain material painting for biome, slope, snow, silt, river, and moisture layers." }
  });
}

export default createTerrainMaterialPaintDomainKit;
