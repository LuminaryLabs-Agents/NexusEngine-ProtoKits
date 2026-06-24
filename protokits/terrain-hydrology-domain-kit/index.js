import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const TERRAIN_HYDROLOGY_DOMAIN_KIT_VERSION = "0.1.0";

export const DEFAULT_TERRAIN_HYDROLOGY_CONFIG = Object.freeze({
  riverCount: 3,
  riverWidth: 38,
  riverDepth: 20,
  riverSoftness: 0.7,
  tributaryStrength: 0.55,
  valleyWidening: 1.2,
  meanderScale: 0.0026,
  meanderAmplitude: 140,
  seedOffset: 0
});

const smoothstep = (edge0, edge1, value) => {
  const t = clamp((number(value) - number(edge0)) / Math.max(0.000001, number(edge1) - number(edge0)), 0, 1);
  return t * t * (3 - 2 * t);
};

function riverLineSample(x = 0, z = 0, index = 0, config = {}) {
  const angle = (index * 2.399963 + number(config.seedOffset, 0) * 0.001) % (Math.PI * 2);
  const along = number(x) * Math.cos(angle) + number(z) * Math.sin(angle);
  const across = -number(x) * Math.sin(angle) + number(z) * Math.cos(angle);
  const scale = number(config.meanderScale, 0.0026) * (1 + index * 0.17);
  const amp = number(config.meanderAmplitude, 140) * (1 - Math.min(index, 5) * 0.08);
  const phase = index * 1.918 + number(config.seedOffset, 0) * 0.017;
  const center = Math.sin(along * scale + phase) * amp + Math.sin(along * scale * 0.37 - phase * 0.7) * amp * 0.46;
  return { index, angle, along, across, center, distance: Math.abs(across - center) };
}

export function sampleHydrology(x = 0, z = 0, options = {}) {
  const config = { ...DEFAULT_TERRAIN_HYDROLOGY_CONFIG, ...(options.config ?? options) };
  const count = Math.max(0, Math.floor(number(config.riverCount, 3)));
  let nearest = null;
  for (let index = 0; index < count; index += 1) {
    const sample = riverLineSample(x, z, index, config);
    if (!nearest || sample.distance < nearest.distance) nearest = sample;
  }
  if (!nearest) return { riverDistance: Infinity, riverMask: 0, riverCarve: 0, moisture: 0, nearestRiver: null };

  const width = number(config.riverWidth, 38);
  const softness = Math.max(0.05, number(config.riverSoftness, 0.7));
  const edge = width * (1 + softness * 2.4);
  const riverMask = 1 - smoothstep(width, edge, nearest.distance);
  const valleyMask = 1 - smoothstep(width * 1.6, width * (5.2 + number(config.valleyWidening, 1.2) * 2.8), nearest.distance);
  const tributary = Math.max(0, Math.sin(nearest.along * number(config.meanderScale, 0.0026) * 2.7 + nearest.index * 2.1));
  const tributaryMask = tributary * number(config.tributaryStrength, 0.55) * valleyMask;
  const riverCarve = number(config.riverDepth, 20) * riverMask + number(config.riverDepth, 20) * 0.48 * valleyMask + number(config.riverDepth, 20) * 0.26 * tributaryMask;
  const moisture = clamp(riverMask * 0.95 + valleyMask * 0.38 + tributaryMask * 0.24, 0, 1);

  return {
    riverDistance: nearest.distance,
    riverMask,
    riverCarve,
    valleyMask,
    moisture,
    nearestRiver: {
      index: nearest.index,
      angle: nearest.angle,
      along: nearest.along,
      center: nearest.center
    }
  };
}

export function createTerrainHydrologyDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const TerrainHydrologyState = resource(options.resourceName ?? "terrainHydrology.state");
  const TerrainHydrologySampled = event("terrainHydrology.sampled");
  const initial = () => ({
    version: TERRAIN_HYDROLOGY_DOMAIN_KIT_VERSION,
    seed: options.seed ?? "terrain-hydrology",
    config: { ...DEFAULT_TERRAIN_HYDROLOGY_CONFIG, ...(options.hydrology ?? options.config ?? options) }
  });

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "terrain-hydrology-domain-kit",
    resources: { TerrainHydrologyState },
    events: { TerrainHydrologySampled },
    provides: ["terrain:hydrology", "terrain:river-carve", "terrain:moisture-corridor"],
    initWorld({ world }) { ensureResource(world, TerrainHydrologyState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, TerrainHydrologyState, initial);
      engine.terrainHydrology = {
        getState: state,
        sampleAt(x = 0, z = 0) {
          return sampleHydrology(number(x), number(z), state().config);
        },
        traceSample(x = 0, z = 0) {
          const sample = this.sampleAt(x, z);
          world.emit(TerrainHydrologySampled, { x: number(x), z: number(z), sample: clone(sample) });
          return sample;
        },
        sampleRiverDistance(x = 0, z = 0) { return this.sampleAt(x, z).riverDistance; },
        sampleRiverMask(x = 0, z = 0) { return this.sampleAt(x, z).riverMask; },
        sampleRiverCarve(x = 0, z = 0) { return this.sampleAt(x, z).riverCarve; },
        sampleMoisture(x = 0, z = 0) { return this.sampleAt(x, z).moisture; },
        listRivers(bounds = {}) {
          const config = state().config;
          const count = Math.max(0, Math.floor(number(config.riverCount, 3)));
          return Array.from({ length: count }, (_, index) => {
            const sample = riverLineSample(number(bounds.x ?? 0), number(bounds.z ?? 0), index, config);
            return { id: `river-${index}`, index, angle: sample.angle, width: number(config.riverWidth, 38), depth: number(config.riverDepth, 20), meanderAmplitude: number(config.meanderAmplitude, 140) };
          });
        },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: TERRAIN_HYDROLOGY_DOMAIN_KIT_VERSION, purpose: "Procedural river, valley, moisture, and hydrology carve service for terrain domains." }
  });
}

export default createTerrainHydrologyDomainKit;
