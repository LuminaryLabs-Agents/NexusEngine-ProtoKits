import { asFluidArray, cloneFluidValue, createFluidServiceKit, toFluidNumber } from "../fluid-field-kit/index.js";

export const FLUID_EFFECTS_KIT_VERSION = "0.1.0";

function normalizeEffect(effect = {}, index = 0) {
  return {
    id: String(effect.id ?? `fluid-effect-${index + 1}-${Math.round(toFluidNumber(effect.createdAt, 0) * 1000)}`),
    type: String(effect.type ?? "distortion"),
    position: cloneFluidValue(effect.position ?? { x: 0, y: 0, z: 0 }),
    radius: toFluidNumber(effect.radius, 1),
    intensity: toFluidNumber(effect.intensity, 1),
    ttl: Math.max(0, toFluidNumber(effect.ttl, 1.2)),
    age: Math.max(0, toFluidNumber(effect.age, 0)),
    tags: asFluidArray(effect.tags).map(String),
    metadata: cloneFluidValue(effect.metadata ?? {})
  };
}

function createInitial(config = {}) {
  const effects = asFluidArray(config.effects).map(normalizeEffect);
  return { effects, maxEffects: Math.max(8, toFluidNumber(config.maxEffects, 64)), emittedCount: effects.length };
}

export function createFluidEffectsKit(NexusRealtime, config = {}) {
  return createFluidServiceKit(NexusRealtime, {
    version: FLUID_EFFECTS_KIT_VERSION,
    factoryName: "createFluidEffectsKit",
    kitId: "fluid-effects-kit",
    engineKey: "fluidEffects",
    resourceName: "fluidEffects.state",
    eventStem: "fluidEffects",
    domain: "fluid",
    service: "effects",
    provides: ["fluid:effects", "fluid:transient-descriptors"],
    purpose: "Generic transient descriptors for fluid ripples, wisps, pulses, droplets, and distortion bursts.",
    createInitial,
    tick(state, { dt }) {
      const effects = state.effects
        .map((effect) => ({ ...effect, age: effect.age + dt }))
        .filter((effect) => effect.age < effect.ttl);
      return { ...state, effects };
    },
    reduceAction(state, event) {
      if (event.type === "emit") {
        const effect = normalizeEffect({ ...event.effect, createdAt: state.updatedAtTick, age: 0 }, state.emittedCount);
        return { ...state, effects: [effect, ...state.effects].slice(0, state.maxEffects), emittedCount: state.emittedCount + 1 };
      }
      return state;
    },
    methods({ getState, patchState }) {
      function emitEffect(effect = {}) {
        const state = getState();
        const descriptor = normalizeEffect({ ...effect, age: 0 }, state.emittedCount);
        return patchState({ effects: [descriptor, ...state.effects].slice(0, state.maxEffects), emittedCount: state.emittedCount + 1 }, "emit-effect");
      }
      function getActiveEffects() {
        return getState().effects;
      }
      return { emitEffect, getActiveEffects };
    }
  }, config);
}

export default createFluidEffectsKit;
