export const OBJECTIVE_FLOW_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`createObjectiveFlowDomainKit requires NexusEngine.${key}.`);
    }
  }
}

function normalizeStep(step = {}, index = 0) {
  return {
    id: String(step.id ?? `step-${index + 1}`),
    label: String(step.label ?? step.id ?? `Step ${index + 1}`),
    target: Math.max(1, toNumber(step.target, 1)),
    progress: Math.max(0, toNumber(step.progress, 0)),
    completed: Boolean(step.completed)
  };
}

function createState(config = {}) {
  const steps = asArray(config.steps).map(normalizeStep);
  return {
    version: OBJECTIVE_FLOW_DOMAIN_KIT_VERSION,
    id: config.stateId ?? "objective-flow-domain",
    domain: "objective-flow",
    steps,
    currentStepIndex: Math.max(0, toNumber(config.currentStepIndex, 0)),
    completed: steps.length > 0 && steps.every((step) => step.completed || step.progress >= step.target),
    failed: false,
    lastEvent: null
  };
}

function rebuild(state) {
  const steps = state.steps.map((step) => ({ ...step, completed: step.completed || step.progress >= step.target }));
  return {
    ...state,
    steps,
    completed: steps.length > 0 && steps.every((step) => step.completed),
    currentStepIndex: Math.min(state.currentStepIndex, Math.max(0, steps.length - 1))
  };
}

export function createObjectiveFlowDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;

  const ObjectiveFlowState = defineResource(config.resourceName ?? "objectiveFlowDomain.state");
  const ObjectiveAdvanced = defineEvent("objective.advanced");
  const ObjectiveCompleted = defineEvent("objective.completed");
  const ObjectiveFailed = defineEvent("objective.failed");

  return defineRuntimeKit({
    id: config.kitId ?? "objective-flow-domain-kit",
    provides: ["n:objective-flow", "objective:steps"],
    resources: { ObjectiveFlowState },
    events: { ObjectiveAdvanced, ObjectiveCompleted, ObjectiveFailed },
    systems: [],
    initWorld({ world }) {
      world.setResource(ObjectiveFlowState, rebuild(createState(config)));
    },
    install({ engine, world }) {
      engine.objectiveFlowDomain = {
        advance(amount = 1, payload = {}) {
          let state = rebuild(world.getResource(ObjectiveFlowState) ?? createState(config));
          const index = Math.min(state.currentStepIndex, Math.max(0, state.steps.length - 1));
          const step = state.steps[index];
          if (!step || state.completed || state.failed) return clone(state);

          const nextStep = { ...step, progress: step.progress + toNumber(amount, 1) };
          const steps = state.steps.map((item, itemIndex) => itemIndex === index ? nextStep : item);
          let next = rebuild({ ...state, steps, lastEvent: { stepId: step.id, amount, ...payload } });
          if (next.steps[index]?.completed && index < next.steps.length - 1) {
            next = { ...next, currentStepIndex: index + 1 };
          }

          world.setResource(ObjectiveFlowState, next);
          world.emit(ObjectiveAdvanced, { stepId: step.id, amount, completed: next.completed });
          if (next.completed) world.emit(ObjectiveCompleted, { id: next.id });
          return clone(next);
        },
        fail(reason = "failed") {
          const state = world.getResource(ObjectiveFlowState) ?? createState(config);
          const next = { ...state, failed: true, lastEvent: { reason } };
          world.setResource(ObjectiveFlowState, next);
          world.emit(ObjectiveFailed, { id: next.id, reason });
          return clone(next);
        },
        getState() {
          return clone(world.getResource(ObjectiveFlowState));
        }
      };
    },
    metadata: {
      domain: "objective-flow",
      scope: "large-domain",
      extendsBase: "DomainServiceKit",
      composes: ["completion-ledger-kit", "sequence runtime"],
      ownsLoop: false,
      purpose: "Owns reusable objective steps, progress, completion, and failure state for route shells."
    }
  });
}

export default createObjectiveFlowDomainKit;
