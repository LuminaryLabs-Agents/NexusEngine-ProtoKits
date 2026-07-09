import { asFluidArray, cloneFluidValue, createFluidServiceKit, toFluidNumber } from "../fluid-field-kit/index.js";

export const WATER_SHADING_KIT_VERSION = "0.1.0";

function normalizeMaterial(material = {}, index = 0) {
  return {
    id: String(material.id ?? `water-material-${index + 1}`),
    profileId: String(material.profileId ?? material.id ?? "clear-water"),
    shallowColor: String(material.shallowColor ?? "#8ef7ff"),
    deepColor: String(material.deepColor ?? "#05294d"),
    foamColor: String(material.foamColor ?? "#f2ffff"),
    fresnel: toFluidNumber(material.fresnel, 0.68),
    reflection: toFluidNumber(material.reflection, 0.42),
    refraction: toFluidNumber(material.refraction, 0.36),
    caustics: toFluidNumber(material.caustics, 0.28),
    roughness: toFluidNumber(material.roughness, 0.22),
    uniforms: cloneFluidValue(material.uniforms ?? {})
  };
}

function createInitial(config = {}) {
  const materials = asFluidArray(config.materials ?? [{ id: "clear-water" }]).map(normalizeMaterial);
  return { materials, materialsById: Object.fromEntries(materials.map((material) => [material.id, material])), quality: config.quality ?? "medium", post: cloneFluidValue(config.post ?? { underwaterTint: true, shorelineFade: true }) };
}

export function createWaterShadingKit(NexusEngine, config = {}) {
  return createFluidServiceKit(NexusEngine, {
    version: WATER_SHADING_KIT_VERSION,
    factoryName: "createWaterShadingKit",
    kitId: "water-shading-kit",
    engineKey: "waterShading",
    resourceName: "waterShading.state",
    eventStem: "waterShading",
    domain: "fluid.water",
    service: "shading",
    requires: ["fluid:shading", "water:surface", "water:data"],
    provides: ["water:shading", "water:material-descriptors", "water:caustic-uniforms"],
    purpose: "Water-specific material policy: reflection, refraction, fresnel, foam, depth color, caustics, and shoreline fade.",
    createInitial,
    reduceAction(state, event) {
      if (event.type === "set-materials") {
        const materials = asFluidArray(event.materials).map(normalizeMaterial);
        return { ...state, materials, materialsById: Object.fromEntries(materials.map((material) => [material.id, material])) };
      }
      return state;
    },
    methods({ getState, patchState }) {
      function setMaterials(materials) {
        const normalized = asFluidArray(materials).map(normalizeMaterial);
        return patchState({ materials: normalized, materialsById: Object.fromEntries(normalized.map((material) => [material.id, material])) }, "set-materials");
      }
      function getMaterial(id = "clear-water") {
        const state = getState();
        return cloneFluidValue(state.materialsById[id] ?? state.materials[0] ?? null);
      }
      return { setMaterials, getMaterial };
    }
  }, config);
}

export default createWaterShadingKit;
