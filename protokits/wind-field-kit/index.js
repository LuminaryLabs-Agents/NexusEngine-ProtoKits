import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const WIND_FIELD_KIT_VERSION = "0.1.0";

export function createWindFieldState(options = {}) {
  return {
    version: WIND_FIELD_KIT_VERSION,
    seed: String(options.seed ?? "wind-field"),
    baseStrength: number(options.baseStrength, 0.18),
    gustStrength: number(options.gustStrength, 0.55),
    gustSpeed: number(options.gustSpeed, 1.23),
    directionDrift: number(options.directionDrift, 0.045),
    rippleScale: number(options.rippleScale, 1)
  };
}

function unit(x, y, z) {
  const l = Math.hypot(x, y, z) || 1;
  return { x: x / l, y: y / l, z: z / l };
}

export function sampleWindField(x = 0, y = 0, z = 0, time = 0, state = createWindFieldState()) {
  const slow = Math.sin(time * 0.19 + x * 0.004 + z * 0.003) * 0.5 + 0.5;
  const gust = Math.sin(time * state.gustSpeed + x * 0.018 - z * 0.014 + y * 0.003) * 0.5 + 0.5;
  const ripple = Math.sin(time * 2.7 + x * 0.061 + z * 0.047) * 0.5 + 0.5;
  const angle = time * state.directionDrift + Math.sin(x * 0.002 + z * 0.002) * 0.35;
  const direction = unit(Math.cos(angle), 0, Math.sin(angle));
  const strength = state.baseStrength + slow * 0.24 + gust * state.gustStrength;
  return { direction, base: state.baseStrength, slow, gust, ripple: ripple * state.rippleScale, strength, phase: time * 1.4 + x * 0.035 + z * 0.027 };
}

export function createWindFieldKit(nexusEngine = {}, options = {}) {
  const defs = createDefinitionFactory(nexusEngine);
  const WindFieldState = defs.resource(options.resourceName ?? "windField.state");
  const WindFieldUpdated = defs.event("windField.updated");
  const initial = () => createWindFieldState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "wind-field-kit",
    resources: { WindFieldState },
    events: { WindFieldUpdated },
    provides: ["weather:wind-field", "wind:sample"],
    initWorld({ world }) { ensureResource(world, WindFieldState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, WindFieldState, initial);
      const api = {
        getState: state,
        sample(x = 0, y = 0, z = 0, time = number(world && world.__nexusClock && world.__nexusClock.elapsed, 0)) { return sampleWindField(x, y, z, time, state()); },
        set(config = {}) { const next = { ...state(), ...config }; world.setResource(WindFieldState, next); if (world.emit) world.emit(WindFieldUpdated, { state: clone(next) }); return clone(next); },
        snapshot: () => clone(state())
      };
      engine.windField = api;
      engine.n = engine.n || {};
      engine.n.windField = api;
    },
    metadata: { version: WIND_FIELD_KIT_VERSION, purpose: "Deterministic renderer-agnostic world wind sampling." }
  });
}

export default createWindFieldKit;
