import { clone, createDefinitionFactory, createSeededRandom, defineInjectedRuntimeKit, ensureResource, number, scopedSeed } from "../protokit-core/index.js";

export const TERRAIN_SAMPLER_KIT_VERSION = "0.1.0";

export function sampleTerrainHeight(x = 0, z = 0, config = {}) {
  const scale = number(config.scale, 0.005);
  const detailScale = number(config.detailScale, 0.02);
  const amplitude = number(config.amplitude, 90);
  const detail = number(config.detailAmplitude, 20);
  const base = Math.sin(x * scale) * Math.cos(z * scale) * amplitude;
  const small = Math.sin(x * detailScale + 1.7) * Math.cos(z * detailScale - 0.8) * detail;
  return number(config.baseHeight, -40) + base + small;
}

export function sampleTerrainNormal(x = 0, z = 0, config = {}) {
  const step = number(config.normalStep, 2);
  const hL = sampleTerrainHeight(x - step, z, config);
  const hR = sampleTerrainHeight(x + step, z, config);
  const hD = sampleTerrainHeight(x, z - step, config);
  const hU = sampleTerrainHeight(x, z + step, config);
  const nx = hL - hR;
  const ny = step * 2;
  const nz = hD - hU;
  const len = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

export function sampleBiome(x = 0, z = 0, config = {}) {
  const seed = scopedSeed(config.seed ?? "terrain", Math.floor(x / number(config.biomeSize, 600)), Math.floor(z / number(config.biomeSize, 600)));
  const rng = createSeededRandom(seed);
  const roll = rng.next();
  if (roll < 0.28) return "meadow";
  if (roll < 0.68) return "forest";
  if (roll < 0.86) return "rocky";
  return "highland";
}

export function createTerrainSamplerKit(nexusEngine = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusEngine);
  const TerrainSamplerState = resource(options.resourceName ?? "terrainSampler.state");
  const initial = () => ({ version: TERRAIN_SAMPLER_KIT_VERSION, seed: options.seed ?? "terrain", config: { ...(options.terrain ?? options) } });

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "terrain-sampler-kit",
    resources: { TerrainSamplerState },
    provides: ["terrain-sampler", "ground-query"],
    initWorld({ world }) { ensureResource(world, TerrainSamplerState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, TerrainSamplerState, initial);
      engine.terrainSampler = {
        getState: state,
        getHeight(x, z) { return sampleTerrainHeight(number(x), number(z), state().config); },
        getNormal(x, z) { return sampleTerrainNormal(number(x), number(z), state().config); },
        getBiome(x, z) { return sampleBiome(number(x), number(z), { ...state().config, seed: state().seed }); },
        getPatchDescriptor(px, pz, patchSize = 500) {
          const cx = number(px) * patchSize;
          const cz = number(pz) * patchSize;
          return { id: `terrain-patch:${px},${pz}`, px, pz, patchSize, center: { x: cx, z: cz, y: this.getHeight(cx, cz) }, biome: this.getBiome(cx, cz), seed: scopedSeed(state().seed, "patch", px, pz) };
        },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: TERRAIN_SAMPLER_KIT_VERSION, purpose: "Canonical terrain height, normal, biome, and patch query surface." }
  });
}
