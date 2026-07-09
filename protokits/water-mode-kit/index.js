import { asFluidArray, cloneFluidValue, createFluidServiceKit } from "../fluid-field-kit/index.js";

export const WATER_MODE_KIT_VERSION = "0.1.0";

export const WATER_MODE_STACK = Object.freeze([
  "fluid-field-kit",
  "fluid-motion-kit",
  "fluid-shading-kit",
  "fluid-effects-kit",
  "water-data-kit",
  "water-stream-kit",
  "water-surface-kit",
  "water-mesh-kit",
  "water-shading-kit",
  "water-physics-kit",
  "water-behavior-kit",
  "water-effects-kit",
  "water-audio-kit",
  "water-mode-kit"
]);

function createInitial(config = {}) {
  return {
    mode: String(config.mode ?? "water-lab"),
    quality: String(config.quality ?? "medium"),
    stack: asFluidArray(config.stack ?? WATER_MODE_STACK),
    active: true,
    status: "composed",
    notes: cloneFluidValue(config.notes ?? ["water is a subdomain of fluid", "data, streaming, mesh, shading, physics, behavior, effects, and audio stay separately swappable"])
  };
}

export function createWaterModeKit(NexusEngine, config = {}) {
  return createFluidServiceKit(NexusEngine, {
    version: WATER_MODE_KIT_VERSION,
    factoryName: "createWaterModeKit",
    kitId: "water-mode-kit",
    engineKey: "waterMode",
    resourceName: "waterMode.state",
    eventStem: "waterMode",
    domain: "fluid.water",
    service: "mode",
    requires: ["fluid:field", "fluid:motion", "fluid:shading", "fluid:effects", "water:data", "water:stream", "water:surface", "water:mesh", "water:shading", "water:physics", "water:behavior", "water:effects", "water:audio"],
    provides: ["water:mode", "water:composition"],
    purpose: "Mode composition manifest that proves the flat fluid/water kit stack is intentionally installed together.",
    createInitial,
    reduceAction(state, event) {
      if (event.type === "set-quality") return { ...state, quality: String(event.quality ?? state.quality) };
      if (event.type === "set-active") return { ...state, active: Boolean(event.active) };
      return state;
    },
    methods({ getState, patchState }) {
      return {
        setQuality: (quality = "medium") => patchState({ quality: String(quality) }, "set-quality"),
        setActive: (active = true) => patchState({ active: Boolean(active) }, "set-active"),
        getStack: () => getState().stack
      };
    }
  }, config);
}

export default createWaterModeKit;
