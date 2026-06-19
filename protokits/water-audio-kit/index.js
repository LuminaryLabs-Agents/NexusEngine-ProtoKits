import { asFluidArray, cloneFluidValue, createFluidServiceKit, toFluidNumber } from "../fluid-field-kit/index.js";

export const WATER_AUDIO_KIT_VERSION = "0.1.0";

function normalizeLayer(layer = {}, index = 0) {
  return {
    id: String(layer.id ?? `water-audio-${index + 1}`),
    type: String(layer.type ?? "shore-lap"),
    gain: toFluidNumber(layer.gain, 0.35),
    rate: toFluidNumber(layer.rate, 1),
    distance: toFluidNumber(layer.distance, 0),
    tags: asFluidArray(layer.tags ?? [layer.type ?? "water"]).map(String),
    metadata: cloneFluidValue(layer.metadata ?? {})
  };
}

function createInitial(config = {}) {
  const layers = asFluidArray(config.layers ?? [{ id: "shore-lap", type: "shore-lap", gain: 0.32 }, { id: "underwater", type: "underwater-muffle", gain: 0 }]).map(normalizeLayer);
  return { layers, layersById: Object.fromEntries(layers.map((layer) => [layer.id, layer])), listener: cloneFluidValue(config.listener ?? { x: 0, y: 1.6, z: 0 }), oneShots: [] };
}

export function createWaterAudioKit(NexusRealtime, config = {}) {
  return createFluidServiceKit(NexusRealtime, {
    version: WATER_AUDIO_KIT_VERSION,
    factoryName: "createWaterAudioKit",
    kitId: "water-audio-kit",
    engineKey: "waterAudio",
    resourceName: "waterAudio.state",
    eventStem: "waterAudio",
    domain: "fluid.water",
    service: "audio",
    requires: ["water:behavior", "water:effects"],
    provides: ["water:audio", "water:audio-descriptors"],
    purpose: "Water audio descriptors for shore lap, river flow, underwater muffling, splash one-shots, wakes, and rain-on-water.",
    createInitial,
    tick(state) {
      return { ...state, oneShots: state.oneShots.slice(0, 16) };
    },
    reduceAction(state, event) {
      if (event.type === "one-shot") return { ...state, oneShots: [{ id: event.id ?? `one-shot-${state.updatedAtTick}`, type: event.sound ?? "splash", gain: toFluidNumber(event.gain, 1), position: cloneFluidValue(event.position ?? {}) }, ...state.oneShots].slice(0, 16) };
      if (event.type === "set-listener") return { ...state, listener: cloneFluidValue(event.listener ?? state.listener) };
      return state;
    },
    methods({ getState, patchState }) {
      function setListener(listener = {}) {
        return patchState({ listener: cloneFluidValue(listener) }, "set-listener");
      }
      function play(sound = "splash", payload = {}) {
        const state = getState();
        const oneShot = { id: payload.id ?? `${sound}-${state.updatedAtTick}`, type: sound, gain: toFluidNumber(payload.gain, 1), position: cloneFluidValue(payload.position ?? state.listener) };
        return patchState({ oneShots: [oneShot, ...state.oneShots].slice(0, 16) }, "one-shot");
      }
      return { setListener, play, getLayers: () => getState().layers };
    }
  }, config);
}

export default createWaterAudioKit;
