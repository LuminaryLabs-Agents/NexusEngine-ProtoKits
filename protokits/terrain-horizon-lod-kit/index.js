import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const TERRAIN_HORIZON_LOD_KIT_VERSION = "0.1.0";

export const DEFAULT_TERRAIN_HORIZON_CONFIG = Object.freeze({
  nearRadius: 900,
  midRadius: 2400,
  farRadius: 7000,
  horizonRadius: 22000,
  horizonBands: 3,
  horizonSegments: 56,
  ringThickness: 3800,
  heightCompressionFar: 0.42,
  heightCompressionHorizon: 0.16,
  silhouettePreservation: 0.78,
  fogBlendStart: 4500,
  fogBlendEnd: 18000
});

const lerp = (a, b, t) => number(a) + (number(b) - number(a)) * clamp(t, 0, 1);

export function sampleDistanceBand(distance = 0, config = {}) {
  const d = Math.max(0, number(distance));
  if (d >= number(config.farRadius, 7000)) return "horizon";
  if (d >= number(config.midRadius, 2400)) return "far";
  if (d >= number(config.nearRadius, 900)) return "mid";
  return "near";
}

export function compressFarHeight(height = 0, distance = 0, config = {}) {
  const d = Math.max(0, number(distance));
  const base = number(height);
  const farStart = number(config.midRadius, 2400);
  const horizonStart = number(config.farRadius, 7000);
  const horizonEnd = number(config.horizonRadius, 22000);
  if (d < farStart) return base;
  if (d < horizonStart) {
    const t = clamp((d - farStart) / Math.max(1, horizonStart - farStart), 0, 1);
    return lerp(base, base * number(config.heightCompressionFar, 0.42), t);
  }
  const t = clamp((d - horizonStart) / Math.max(1, horizonEnd - horizonStart), 0, 1);
  const silhouette = base * number(config.heightCompressionFar, 0.42);
  const compressed = base * number(config.heightCompressionHorizon, 0.16);
  return lerp(silhouette, compressed, t * (1 - clamp(config.silhouettePreservation, 0, 1) * 0.42));
}

export function fogBlend(distance = 0, config = {}) {
  return clamp((number(distance) - number(config.fogBlendStart, 4500)) / Math.max(1, number(config.fogBlendEnd, 18000) - number(config.fogBlendStart, 4500)), 0, 1);
}

export function buildHorizonRings(center = {}, options = {}) {
  const config = { ...DEFAULT_TERRAIN_HORIZON_CONFIG, ...(options.config ?? options) };
  const bands = Math.max(1, Math.floor(number(config.horizonBands, 3)));
  const rings = [];
  for (let band = 0; band < bands; band += 1) {
    const innerRadius = number(config.farRadius, 7000) + band * number(config.ringThickness, 3800);
    const outerRadius = band === bands - 1 ? number(config.horizonRadius, 22000) : innerRadius + number(config.ringThickness, 3800);
    rings.push({
      id: `horizon-ring-${band}`,
      band,
      center: { x: number(center.x), z: number(center.z) },
      innerRadius,
      outerRadius,
      radius: (innerRadius + outerRadius) / 2,
      segments: Math.max(12, Math.floor(number(config.horizonSegments, 56) * (1 - band * 0.16))),
      heightCompression: lerp(number(config.heightCompressionFar, 0.42), number(config.heightCompressionHorizon, 0.16), band / Math.max(1, bands - 1)),
      fog: fogBlend((innerRadius + outerRadius) / 2, config)
    });
  }
  return rings;
}

export function createTerrainHorizonLodKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const TerrainHorizonState = resource(options.resourceName ?? "terrainHorizon.state");
  const TerrainHorizonRingsBuilt = event("terrainHorizon.ringsBuilt");
  const initial = () => ({
    version: TERRAIN_HORIZON_LOD_KIT_VERSION,
    seed: options.seed ?? "terrain-horizon",
    config: { ...DEFAULT_TERRAIN_HORIZON_CONFIG, ...(options.horizon ?? options.config ?? options) },
    lastRings: []
  });

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "terrain-horizon-lod-kit",
    resources: { TerrainHorizonState },
    events: { TerrainHorizonRingsBuilt },
    provides: ["terrain:horizon-lod", "terrain:infinite-horizon", "terrain:distance-band"],
    initWorld({ world }) { ensureResource(world, TerrainHorizonState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, TerrainHorizonState, initial);
      engine.terrainHorizon = {
        getState: state,
        sampleDistanceBand(distance = 0) { return sampleDistanceBand(distance, state().config); },
        compressFarHeight(height = 0, distance = 0) { return compressFarHeight(height, distance, state().config); },
        fogBlend(distance = 0) { return fogBlend(distance, state().config); },
        buildHorizonRing(center = {}, band = 0) { return buildHorizonRings(center, state().config)[Math.max(0, Math.floor(number(band)))] ?? null; },
        buildHorizonRings(center = {}) {
          const current = state();
          const rings = buildHorizonRings(center, current.config);
          const next = { ...current, lastRings: rings };
          world.setResource(TerrainHorizonState, next);
          world.emit(TerrainHorizonRingsBuilt, { center: clone(center), rings: clone(rings) });
          return rings.map(clone);
        },
        getRingDescriptors(center = {}) { return this.buildHorizonRings(center); },
        listBands(center = {}) { return this.buildHorizonRings(center); },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: TERRAIN_HORIZON_LOD_KIT_VERSION, purpose: "Distance-band terrain LOD, compressed far heights, fog blend, and horizon ring descriptors." }
  });
}

export default createTerrainHorizonLodKit;
