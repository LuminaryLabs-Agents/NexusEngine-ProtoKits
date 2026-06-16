import { clamp, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const VEGETATION_LOD_KIT_VERSION = "0.0.1";

const DEFAULT_LEVELS = Object.freeze([
  { id: "near", minDistance: 0, maxDistance: 38, detail: "mesh" },
  { id: "mid", minDistance: 38, maxDistance: 90, detail: "simple-mesh" },
  { id: "far", minDistance: 90, maxDistance: 180, detail: "billboard" },
  { id: "culled", minDistance: 180, maxDistance: Infinity, detail: "culled" }
]);

function normalizeLevel(level = {}, index = 0) {
  return Object.freeze({
    id: String(level.id ?? `lod-${index}`),
    minDistance: number(level.minDistance, index === 0 ? 0 : DEFAULT_LEVELS[index]?.minDistance ?? 0),
    maxDistance: number(level.maxDistance, DEFAULT_LEVELS[index]?.maxDistance ?? Infinity),
    detail: String(level.detail ?? DEFAULT_LEVELS[index]?.detail ?? "mesh"),
    budgetScale: number(level.budgetScale, 1),
    metadata: Object.freeze({ ...(level.metadata ?? {}) })
  });
}

function distance3(a = {}, b = {}) {
  return Math.hypot(number(a.x) - number(b.x), number(a.y) - number(b.y), number(a.z ?? a.y) - number(b.z ?? b.y));
}

export function createVegetationLodSelector(data = {}, options = {}) {
  const levels = (data.levels ?? options.levels ?? DEFAULT_LEVELS).map(normalizeLevel).sort((a, b) => a.minDistance - b.minDistance);
  const cullDistance = number(data.cullDistance ?? options.cullDistance, levels[levels.length - 1]?.minDistance ?? 180);

  function selectLod(distance = 0, quality = {}) {
    const scale = number(quality.lodDistanceScale, 1);
    const d = Math.max(0, number(distance, 0)) / Math.max(0.0001, scale);
    return levels.find((level) => d >= level.minDistance && d < level.maxDistance) ?? levels[levels.length - 1];
  }

  function selectLodForInstance(instance = {}, viewer = {}, quality = {}) {
    return selectLod(distance3(instance.position ?? instance, viewer), quality);
  }

  function getCullDistance(species = {}) {
    return number(species.cullDistance, cullDistance);
  }

  function getBillboardDescriptor(species = {}, lod = null) {
    return Object.freeze({
      speciesId: species.id ?? "species",
      lod: lod?.id ?? "far",
      type: "billboard",
      materialId: species.materialSlots?.billboard ?? species.materialSlots?.leaf ?? "vegetation-billboard",
      size: species.billboardSize ?? species.metadata?.billboardSize ?? [1, 2]
    });
  }

  function applyLod(instances = [], viewer = {}, quality = {}) {
    return instances.map((instance) => {
      const lod = selectLodForInstance(instance, viewer, quality);
      return Object.freeze({ ...instance, lod: lod.id, detail: lod.detail, culled: lod.detail === "culled" });
    });
  }

  return Object.freeze({ levels: Object.freeze([...levels]), cullDistance, selectLod, selectLodForInstance, getCullDistance, getBillboardDescriptor, applyLod });
}

export function createVegetationLodKit(nexusRealtime = {}, options = {}) {
  const selector = createVegetationLodSelector(options.data ?? options, options);
  const api = Object.freeze({ id: options.id ?? "vegetation-lod-kit", version: VEGETATION_LOD_KIT_VERSION, ...selector });
  return Object.freeze({
    ...api,
    createRuntimeKit(runtimeOptions = {}) {
      return defineInjectedRuntimeKit(nexusRealtime, {
        id: runtimeOptions.id ?? api.id,
        provides: runtimeOptions.provides ?? ["domain:vegetation-lod", "service:lod-selection", "descriptor:billboard"],
        bindings: { vegetationLodKit: api },
        metadata: { version: VEGETATION_LOD_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) }
      });
    }
  });
}
