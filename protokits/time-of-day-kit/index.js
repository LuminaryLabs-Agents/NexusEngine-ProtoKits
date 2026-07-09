import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const TIME_OF_DAY_KIT_VERSION = "0.1.0";

export function createTimeOfDayState(options = {}) {
  return { version: TIME_OF_DAY_KIT_VERSION, normalizedTime: clamp(number(options.normalizedTime, 0.32), 0, 1), cycleSeconds: Math.max(1, number(options.cycleSeconds, 900)), paused: options.paused ?? false };
}

export function describeTimeOfDay(state = createTimeOfDayState()) {
  const t = clamp(state.normalizedTime, 0, 1);
  const angle = t * Math.PI * 2 - Math.PI * 0.45;
  const sun = { x: Math.cos(angle) * -0.55, y: Math.sin(angle) * 0.85 + 0.16, z: Math.sin(angle) * 0.38 };
  const l = Math.hypot(sun.x, sun.y, sun.z) || 1;
  const sunDirection = { x: sun.x / l, y: sun.y / l, z: sun.z / l };
  const moonDirection = { x: -sunDirection.x, y: -sunDirection.y, z: -sunDirection.z };
  const daylight = clamp((sunDirection.y + 0.12) / 0.74, 0, 1);
  const phase = t < 0.24 ? "dawn" : t < 0.68 ? "day" : t < 0.82 ? "dusk" : "night";
  return { normalizedTime: t, phase, daylight, sunDirection, moonDirection };
}

export function createTimeOfDayKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const TimeOfDayState = resource(options.resourceName ?? "timeOfDay.state");
  const TimeOfDayUpdated = event("timeOfDay.updated");
  const initial = () => createTimeOfDayState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "time-of-day-kit",
    resources: { TimeOfDayState },
    events: { TimeOfDayUpdated },
    provides: ["time:day-night", "time:phase-descriptor"],
    initWorld({ world }) { ensureResource(world, TimeOfDayState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, TimeOfDayState, initial);
      const api = { getState: state, describe: () => describeTimeOfDay(state()), setTime(value) { const next = { ...state(), normalizedTime: clamp(number(value, 0), 0, 1) }; world.setResource(TimeOfDayState, next); world.emit?.(TimeOfDayUpdated, { state: clone(next), descriptor: describeTimeOfDay(next) }); return clone(next); }, step(dt = number(world?.__nexusClock?.delta, 1 / 60)) { const s = state(); if (s.paused) return clone(s); return this.setTime((s.normalizedTime + number(dt, 0) / s.cycleSeconds) % 1); }, snapshot: () => clone(state()) };
      engine.timeOfDay = api;
      engine.n ??= {};
      engine.n.timeOfDay = api;
    },
    metadata: { version: TIME_OF_DAY_KIT_VERSION, purpose: "Deterministic cycle phase and sun/moon direction descriptors." }
  });
}

export default createTimeOfDayKit;
