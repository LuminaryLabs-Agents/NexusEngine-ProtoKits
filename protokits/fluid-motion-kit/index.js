import { asFluidArray, cloneFluidValue, createFluidServiceKit, sampleFluidWave, toFluidNumber } from "../fluid-field-kit/index.js";

export const FLUID_MOTION_KIT_VERSION = "0.1.0";

function normalizeFlow(flow = {}, index = 0) {
  return {
    id: String(flow.id ?? `flow-${index + 1}`),
    velocity: { x: toFluidNumber(flow.velocity?.x ?? flow.x, 0.25), y: toFluidNumber(flow.velocity?.y ?? flow.y, 0), z: toFluidNumber(flow.velocity?.z ?? flow.z, 0.1) },
    turbulence: toFluidNumber(flow.turbulence, 0.2),
    diffusion: toFluidNumber(flow.diffusion, 0.04),
    strength: toFluidNumber(flow.strength, 1),
    tags: asFluidArray(flow.tags).map(String),
    metadata: cloneFluidValue(flow.metadata ?? {})
  };
}

function createInitial(config = {}) {
  const flows = asFluidArray(config.flows ?? [{ id: "primary-current", velocity: { x: 0.42, z: 0.16 }, turbulence: 0.25 }]).map(normalizeFlow);
  return { flows, flowsById: Object.fromEntries(flows.map((flow) => [flow.id, flow])), motionTime: 0 };
}

export function createFluidMotionKit(NexusEngine, config = {}) {
  return createFluidServiceKit(NexusEngine, {
    version: FLUID_MOTION_KIT_VERSION,
    factoryName: "createFluidMotionKit",
    kitId: "fluid-motion-kit",
    engineKey: "fluidMotion",
    resourceName: "fluidMotion.state",
    eventStem: "fluidMotion",
    domain: "fluid",
    service: "motion",
    requires: ["fluid:field"],
    provides: ["fluid:motion", "fluid:flow", "fluid:turbulence"],
    purpose: "Generic fluid motion descriptors for advection, turbulence, diffusion, and flow sampling.",
    createInitial,
    tick(state, { dt }) {
      return { ...state, motionTime: toFluidNumber(state.motionTime, 0) + dt };
    },
    reduceAction(state, event) {
      if (event.type === "set-flows") {
        const flows = asFluidArray(event.flows).map(normalizeFlow);
        return { ...state, flows, flowsById: Object.fromEntries(flows.map((flow) => [flow.id, flow])) };
      }
      return state;
    },
    methods({ getState, patchState }) {
      function setFlows(flows) {
        const normalized = asFluidArray(flows).map(normalizeFlow);
        return patchState({ flows: normalized, flowsById: Object.fromEntries(normalized.map((flow) => [flow.id, flow])) }, "set-flows");
      }
      function sampleVelocity(position = {}, flowId = "primary-current") {
        const state = getState();
        const flow = state.flowsById[flowId] ?? state.flows[0] ?? normalizeFlow({ id: flowId });
        const wave = sampleFluidWave(position, { time: state.motionTime, amplitude: flow.turbulence, frequency: 0.045, flow: flow.velocity });
        return {
          flowId: flow.id,
          velocity: {
            x: flow.velocity.x * flow.strength + wave * 0.08,
            y: flow.velocity.y,
            z: flow.velocity.z * flow.strength + wave * 0.05
          },
          turbulence: flow.turbulence,
          diffusion: flow.diffusion
        };
      }
      return { setFlows, sampleVelocity };
    }
  }, config);
}

export default createFluidMotionKit;
