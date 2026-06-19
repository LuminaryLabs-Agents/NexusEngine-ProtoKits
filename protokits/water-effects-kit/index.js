import { asFluidArray, cloneFluidValue, createFluidServiceKit, toFluidNumber } from "../fluid-field-kit/index.js";

export const WATER_EFFECTS_KIT_VERSION = "0.1.0";

function normalizeWaterEffect(effect = {}, index = 0) {
  return {
    id: String(effect.id ?? `water-fx-${index + 1}`),
    type: String(effect.type ?? "splash"),
    position: cloneFluidValue(effect.position ?? { x: 0, y: 0, z: 0 }),
    radius: toFluidNumber(effect.radius, effect.type === "wake" ? 5 : 1.5),
    foam: toFluidNumber(effect.foam, effect.type === "wake" ? 0.35 : 0.65),
    intensity: toFluidNumber(effect.intensity, 1),
    ttl: Math.max(0.1, toFluidNumber(effect.ttl, 1.4)),
    age: Math.max(0, toFluidNumber(effect.age, 0)),
    metadata: cloneFluidValue(effect.metadata ?? {})
  };
}

function createInitial(config = {}) {
  return { effects: asFluidArray(config.effects).map(normalizeWaterEffect), emittedCount: 0, foamLevel: toFluidNumber(config.foamLevel, 0.1) };
}

export function createWaterEffectsKit(NexusRealtime, config = {}) {
  return createFluidServiceKit(NexusRealtime, {
    version: WATER_EFFECTS_KIT_VERSION,
    factoryName: "createWaterEffectsKit",
    kitId: "water-effects-kit",
    engineKey: "waterEffects",
    resourceName: "waterEffects.state",
    eventStem: "waterEffects",
    domain: "fluid.water",
    service: "effects",
    requires: ["fluid:effects", "water:behavior", "water:surface"],
    provides: ["water:effects", "water:splash-descriptors", "water:wake-descriptors", "water:foam-bursts"],
    purpose: "Water-specific splash, wake, mist, droplet, ripple-ring, foam burst, and caustic descriptors.",
    createInitial,
    tick(state, { dt }) {
      const effects = state.effects.map((effect) => ({ ...effect, age: effect.age + dt })).filter((effect) => effect.age < effect.ttl);
      const foamLevel = Math.max(0, state.foamLevel - dt * 0.04 + effects.reduce((sum, effect) => sum + effect.foam * 0.002, 0));
      return { ...state, effects, foamLevel };
    },
    reduceAction(state, event) {
      if (event.type === "splash" || event.type === "wake" || event.type === "foam") {
        const effect = normalizeWaterEffect(event, state.emittedCount);
        return { ...state, effects: [effect, ...state.effects].slice(0, 80), emittedCount: state.emittedCount + 1, foamLevel: Math.min(1, state.foamLevel + effect.foam * 0.08) };
      }
      return state;
    },
    methods({ getState, patchState }) {
      function emit(type, payload = {}) {
        const state = getState();
        const effect = normalizeWaterEffect({ ...payload, type }, state.emittedCount);
        return patchState({ effects: [effect, ...state.effects].slice(0, 80), emittedCount: state.emittedCount + 1, foamLevel: Math.min(1, state.foamLevel + effect.foam * 0.08) }, type);
      }
      return { splash: (payload = {}) => emit("splash", payload), wake: (payload = {}) => emit("wake", payload), foam: (payload = {}) => emit("foam", payload), getDescriptors: () => getState().effects };
    }
  }, config);
}

export default createWaterEffectsKit;
