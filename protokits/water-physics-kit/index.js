import { asFluidArray, cloneFluidValue, createFluidServiceKit, sampleFluidWave, toFluidNumber } from "../fluid-field-kit/index.js";

export const WATER_PHYSICS_KIT_VERSION = "0.1.0";

function normalizeBody(body = {}, index = 0) {
  return {
    id: String(body.id ?? `floating-body-${index + 1}`),
    mass: Math.max(0.1, toFluidNumber(body.mass, 1)),
    drag: toFluidNumber(body.drag, 0.18),
    buoyancy: toFluidNumber(body.buoyancy, 1),
    probeOffsets: asFluidArray(body.probeOffsets ?? [{ x: 0, z: 0 }]).map((probe) => ({ x: toFluidNumber(probe.x, 0), z: toFluidNumber(probe.z, 0) })),
    position: cloneFluidValue(body.position ?? { x: 0, y: 0, z: 0 }),
    velocity: cloneFluidValue(body.velocity ?? { x: 0, y: 0, z: 0 })
  };
}

function createInitial(config = {}) {
  const bodies = asFluidArray(config.bodies ?? [{ id: "demo-buoy", mass: 1.2, buoyancy: 1.15 }]).map(normalizeBody);
  return { bodies, bodiesById: Object.fromEntries(bodies.map((body) => [body.id, body])), gravity: toFluidNumber(config.gravity, 9.8), surfaceTime: 0 };
}

function sampleSurface(position = {}, time = 0) {
  return sampleFluidWave(position, { time, amplitude: 0.24, frequency: 0.075, flow: { x: 1, z: 0.35 } });
}

export function createWaterPhysicsKit(NexusEngine, config = {}) {
  return createFluidServiceKit(NexusEngine, {
    version: WATER_PHYSICS_KIT_VERSION,
    factoryName: "createWaterPhysicsKit",
    kitId: "water-physics-kit",
    engineKey: "waterPhysics",
    resourceName: "waterPhysics.state",
    eventStem: "waterPhysics",
    domain: "fluid.water",
    service: "physics",
    requires: ["water:surface"],
    provides: ["water:physics", "water:buoyancy", "water:drag", "water:current-force"],
    purpose: "Water physical interactions: buoyancy, drag, floating probes, currents, swim resistance, and surface collision sampling.",
    createInitial,
    tick(state, { dt }) {
      const surfaceTime = state.surfaceTime + dt;
      const bodies = state.bodies.map((body) => {
        const waterHeight = sampleSurface(body.position, surfaceTime);
        const depth = waterHeight - toFluidNumber(body.position.y, 0);
        const lift = Math.max(0, depth) * body.buoyancy * state.gravity;
        const vy = toFluidNumber(body.velocity.y, 0) + (lift / body.mass - state.gravity * 0.08) * dt;
        return { ...body, velocity: { ...body.velocity, y: vy * (1 - body.drag * dt) }, waterHeight, wetness: Math.max(0, Math.min(1, depth)) };
      });
      return { ...state, surfaceTime, bodies, bodiesById: Object.fromEntries(bodies.map((body) => [body.id, body])) };
    },
    methods({ getState, patchState }) {
      function setBodies(bodies) {
        const normalized = asFluidArray(bodies).map(normalizeBody);
        return patchState({ bodies: normalized, bodiesById: Object.fromEntries(normalized.map((body) => [body.id, body])) }, "set-bodies");
      }
      function sampleProbe(position = {}) {
        const state = getState();
        const height = sampleSurface(position, state.surfaceTime);
        return { position: cloneFluidValue(position), height, depth: height - toFluidNumber(position.y, 0), current: { x: 0.12, y: 0, z: 0.04 } };
      }
      return { setBodies, sampleProbe };
    }
  }, config);
}

export default createWaterPhysicsKit;
