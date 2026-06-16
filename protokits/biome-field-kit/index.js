import { clamp, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const BIOME_FIELD_KIT_VERSION = "0.0.1";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeBiome(biome = {}, index = 0) {
  const id = String(biome.id ?? `biome-${index + 1}`);
  return Object.freeze({
    id,
    label: String(biome.label ?? id),
    weight: number(biome.weight, 1),
    color: biome.color ?? "#2d4a36",
    placementRules: Object.freeze({ ...(biome.placementRules ?? {}) }),
    materialOverrides: Object.freeze({ ...(biome.materialOverrides ?? {}) }),
    metadata: Object.freeze({ ...(biome.metadata ?? {}) })
  });
}

function distanceInfluence(zone, x, z) {
  const center = zone.center ?? zone;
  const radius = Math.max(0.0001, number(zone.radius, 1));
  const dx = number(x) - number(center.x);
  const dz = number(z) - number(center.z ?? center.y);
  return clamp(1 - Math.hypot(dx, dz) / radius, 0, 1);
}

function rectInfluence(zone, x, z) {
  const bounds = zone.bounds ?? zone;
  const minX = number(bounds.minX, -Infinity);
  const maxX = number(bounds.maxX, Infinity);
  const minZ = number(bounds.minZ ?? bounds.minY, -Infinity);
  const maxZ = number(bounds.maxZ ?? bounds.maxY, Infinity);
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ ? 1 : 0;
}

function zoneInfluence(zone, x, z) {
  if (zone.bounds || ["rect", "rectangle"].includes(zone.type)) return rectInfluence(zone, x, z);
  return distanceInfluence(zone, x, z);
}

export function createBiomeField(data = {}, options = {}) {
  const biomes = asArray(data.biomes ?? options.biomes).map(normalizeBiome);
  const fallbackBiome = normalizeBiome(data.fallbackBiome ?? biomes[0] ?? { id: "default" });
  const zones = asArray(data.zones ?? options.zones).map((zone, index) => Object.freeze({ id: zone.id ?? `zone-${index + 1}`, ...zone }));

  function getBiome(id) {
    return biomes.find((biome) => biome.id === id) ?? (fallbackBiome.id === id ? fallbackBiome : null);
  }

  function getBiomeWeights(x = 0, z = 0) {
    const weights = new Map([[fallbackBiome.id, Math.max(0.0001, number(fallbackBiome.weight, 1) * 0.1)]]);
    for (const zone of zones) {
      const influence = zoneInfluence(zone, x, z);
      if (influence <= 0) continue;
      const biomeId = String(zone.biomeId ?? zone.biome ?? fallbackBiome.id);
      const current = weights.get(biomeId) ?? 0;
      weights.set(biomeId, current + influence * number(zone.weight, 1));
    }
    const total = Array.from(weights.values()).reduce((sum, value) => sum + value, 0) || 1;
    return Object.freeze(Object.fromEntries(Array.from(weights.entries()).map(([id, value]) => [id, value / total])));
  }

  function biomeAt(x = 0, z = 0) {
    const weights = getBiomeWeights(x, z);
    let bestId = fallbackBiome.id;
    let bestWeight = -Infinity;
    for (const [id, weight] of Object.entries(weights)) {
      if (weight > bestWeight) {
        bestId = id;
        bestWeight = weight;
      }
    }
    return getBiome(bestId) ?? fallbackBiome;
  }

  function getBiomePlacementRules(idOrPosition, maybeZ) {
    const biome = typeof idOrPosition === "string" ? getBiome(idOrPosition) : biomeAt(idOrPosition?.x, idOrPosition?.z ?? idOrPosition?.y ?? maybeZ);
    return Object.freeze({ ...(biome?.placementRules ?? fallbackBiome.placementRules) });
  }

  function getBiomeMaterialOverrides(idOrPosition, maybeZ) {
    const biome = typeof idOrPosition === "string" ? getBiome(idOrPosition) : biomeAt(idOrPosition?.x, idOrPosition?.z ?? idOrPosition?.y ?? maybeZ);
    return Object.freeze({ ...(biome?.materialOverrides ?? fallbackBiome.materialOverrides) });
  }

  return Object.freeze({ biomes: Object.freeze([...biomes]), fallbackBiome, zones: Object.freeze([...zones]), getBiome, biomeAt, getBiomeWeights, getBiomePlacementRules, getBiomeMaterialOverrides });
}

export function createBiomeFieldKit(nexusRealtime = {}, options = {}) {
  const field = createBiomeField(options.data ?? options, options);
  const api = Object.freeze({ id: options.id ?? "biome-field-kit", version: BIOME_FIELD_KIT_VERSION, ...field });
  return Object.freeze({
    ...api,
    createRuntimeKit(runtimeOptions = {}) {
      return defineInjectedRuntimeKit(nexusRealtime, {
        id: runtimeOptions.id ?? api.id,
        provides: runtimeOptions.provides ?? ["domain:biome-field", "service:biome-query", "service:biome-placement-rules"],
        bindings: { biomeFieldKit: api },
        metadata: { version: BIOME_FIELD_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) }
      });
    }
  });
}
