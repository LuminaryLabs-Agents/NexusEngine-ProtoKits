import { asFluidArray, cloneFluidValue, clampFluid, createFluidServiceKit, sampleFluidWave, toFluidNumber } from "../fluid-field-kit/index.js";

export const WATER_SURFACE_KIT_VERSION = "0.1.0";

function normalizeDisturbance(disturbance = {}, index = 0) {
  return {
    id: String(disturbance.id ?? `disturbance-${index + 1}`),
    position: cloneFluidValue(disturbance.position ?? { x: 0, z: 0 }),
    radius: Math.max(0.1, toFluidNumber(disturbance.radius, 3)),
    force: toFluidNumber(disturbance.force, 0.4),
    age: Math.max(0, toFluidNumber(disturbance.age, 0)),
    ttl: Math.max(0.1, toFluidNumber(disturbance.ttl, 3))
  };
}

function createInitial(config = {}) {
  return {
    amplitude: toFluidNumber(config.amplitude, 0.24),
    frequency: toFluidNumber(config.frequency, 0.075),
    flow: cloneFluidValue(config.flow ?? { x: 1, z: 0.35 }),
    baseHeight: toFluidNumber(config.baseHeight, 0),
    foamBias: toFluidNumber(config.foamBias, 0.25),
    surfaceTime: 0,
    disturbances: asFluidArray(config.disturbances).map(normalizeDisturbance),
    sampleCount: 0
  };
}

function disturbanceAt(state, position = {}) {
  const x = toFluidNumber(position.x, 0);
  const z = toFluidNumber(position.z ?? position.y, 0);
  return state.disturbances.reduce((sum, disturbance) => {
    const dx = x - toFluidNumber(disturbance.position.x, 0);
    const dz = z - toFluidNumber(disturbance.position.z ?? disturbance.position.y, 0);
    const distance = Math.hypot(dx, dz);
    if (distance > disturbance.radius) return sum;
    const falloff = 1 - distance / disturbance.radius;
    const life = 1 - clampFluid(disturbance.age / disturbance.ttl, 0, 1);
    return sum + Math.sin(falloff * Math.PI) * disturbance.force * life;
  }, 0);
}

export function createWaterSurfaceKit(NexusRealtime, config = {}) {
  return createFluidServiceKit(NexusRealtime, {
    version: WATER_SURFACE_KIT_VERSION,
    factoryName: "createWaterSurfaceKit",
    kitId: "water-surface-kit",
    engineKey: "waterSurface",
    resourceName: "waterSurface.state",
    eventStem: "waterSurface",
    domain: "fluid.water",
    service: "surface",
    requires: ["fluid:field", "fluid:motion", "water:data"],
    provides: ["water:surface", "water:height-sampler", "water:normal-sampler", "water:foam-sampler"],
    purpose: "Water-specific height, normal, foam, flow, depth, and disturbance surface service.",
    createInitial,
    tick(state, { dt }) {
      return { ...state, surfaceTime: state.surfaceTime + dt, disturbances: state.disturbances.map((entry) => ({ ...entry, age: entry.age + dt })).filter((entry) => entry.age < entry.ttl) };
    },
    reduceAction(state, event) {
      if (event.type === "disturb") {
        const disturbance = normalizeDisturbance(event, state.disturbances.length);
        return { ...state, disturbances: [disturbance, ...state.disturbances].slice(0, 48) };
      }
      return state;
    },
    methods({ getState, patchState }) {
      function disturb(position = {}, radius = 3, force = 0.4) {
        const state = getState();
        const disturbance = normalizeDisturbance({ position, radius, force }, state.disturbances.length);
        return patchState({ disturbances: [disturbance, ...state.disturbances].slice(0, 48) }, "disturb");
      }
      function sample(position = {}) {
        const state = getState();
        const height = state.baseHeight + sampleFluidWave(position, { time: state.surfaceTime, amplitude: state.amplitude, frequency: state.frequency, flow: state.flow }) + disturbanceAt(state, position);
        const foam = clampFluid(Math.abs(height - state.baseHeight) * state.foamBias + state.disturbances.length * 0.015, 0, 1);
        return { position: cloneFluidValue(position), height, normal: { x: -height * 0.06, y: 1, z: height * 0.04 }, flow: cloneFluidValue(state.flow), foam, depth: Math.max(0, toFluidNumber(position.depth, 3)) };
      }
      return { disturb, sample };
    }
  }, config);
}

export default createWaterSurfaceKit;
