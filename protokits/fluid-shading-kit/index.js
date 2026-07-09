import { asFluidArray, cloneFluidValue, createFluidServiceKit, toFluidNumber } from "../fluid-field-kit/index.js";

export const FLUID_SHADING_KIT_VERSION = "0.1.0";

function normalizeLayer(layer = {}, index = 0) {
  return {
    id: String(layer.id ?? `fluid-layer-${index + 1}`),
    mode: String(layer.mode ?? "transparent"),
    color: String(layer.color ?? "#69c8ff"),
    opacity: toFluidNumber(layer.opacity, 0.72),
    density: toFluidNumber(layer.density, 0.35),
    absorption: toFluidNumber(layer.absorption, 0.2),
    scattering: toFluidNumber(layer.scattering, 0.15),
    distortion: toFluidNumber(layer.distortion, 0.08),
    uniforms: cloneFluidValue(layer.uniforms ?? {})
  };
}

function createInitial(config = {}) {
  const layers = asFluidArray(config.layers ?? [{ id: "base-fluid", color: "#72d8ff", opacity: 0.66 }]).map(normalizeLayer);
  return { layers, layersById: Object.fromEntries(layers.map((layer) => [layer.id, layer])), quality: config.quality ?? "medium" };
}

export function createFluidShadingKit(NexusEngine, config = {}) {
  return createFluidServiceKit(NexusEngine, {
    version: FLUID_SHADING_KIT_VERSION,
    factoryName: "createFluidShadingKit",
    kitId: "fluid-shading-kit",
    engineKey: "fluidShading",
    resourceName: "fluidShading.state",
    eventStem: "fluidShading",
    domain: "fluid",
    service: "shading",
    provides: ["fluid:shading", "fluid:material-descriptors"],
    purpose: "Generic fluid visual descriptors for density, absorption, scattering, opacity, and distortion.",
    createInitial,
    reduceAction(state, event) {
      if (event.type === "set-layers") {
        const layers = asFluidArray(event.layers).map(normalizeLayer);
        return { ...state, layers, layersById: Object.fromEntries(layers.map((layer) => [layer.id, layer])) };
      }
      return state;
    },
    methods({ getState, patchState }) {
      function setLayers(layers) {
        const normalized = asFluidArray(layers).map(normalizeLayer);
        return patchState({ layers: normalized, layersById: Object.fromEntries(normalized.map((layer) => [layer.id, layer])) }, "set-layers");
      }
      function getLayer(id = "base-fluid") {
        const state = getState();
        return cloneFluidValue(state.layersById[id] ?? state.layers[0] ?? null);
      }
      return { setLayers, getLayer };
    }
  }, config);
}

export default createFluidShadingKit;
