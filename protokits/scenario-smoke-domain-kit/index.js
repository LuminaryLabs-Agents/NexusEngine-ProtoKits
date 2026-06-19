export const SCENARIO_SMOKE_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createScenarioSmokeDomainKit requires NexusRealtime.${key}.`);
    }
  }
}

function createState(config = {}) {
  const actions = asArray(config.smokeActions ?? config.actions).map(String).filter(Boolean);
  return {
    version: SCENARIO_SMOKE_DOMAIN_KIT_VERSION,
    id: config.stateId ?? "scenario-smoke-domain",
    domain: "scenario-smoke",
    routeId: config.routeId ?? null,
    actions,
    completedActions: [],
    rejectedActions: [],
    completed: actions.length === 0,
    lastResult: null,
    signature: "NexusRealtime-AAA-domain-spine-batch-01"
  };
}

export function createScenarioSmokeDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;

  const ScenarioSmokeState = defineResource(config.resourceName ?? "scenarioSmokeDomain.state");
  const ScenarioSmokeAction = defineEvent("scenarioSmoke.action");
  const ScenarioSmokeCompleted = defineEvent("scenarioSmoke.completed");
  const ScenarioSmokeRejected = defineEvent("scenarioSmoke.rejected");

  function system(world) {
    const state = world.getResource(ScenarioSmokeState) ?? createState(config);
    let next = {
      ...state,
      completedActions: [...state.completedActions],
      rejectedActions: [...state.rejectedActions]
    };

    for (const event of world.readEvents(ScenarioSmokeAction)) {
      const action = String(event.action ?? "");
      if (!next.actions.includes(action)) {
        const rejected = { action, reason: "action-not-in-smoke-plan", routeId: next.routeId };
        next.rejectedActions.push(rejected);
        next.lastResult = rejected;
        world.emit(ScenarioSmokeRejected, rejected);
        continue;
      }

      if (!next.completedActions.includes(action)) next.completedActions.push(action);
      next.completed = next.actions.every((item) => next.completedActions.includes(item));
      next.lastResult = { action, ok: true, routeId: next.routeId };
      if (next.completed) world.emit(ScenarioSmokeCompleted, { routeId: next.routeId, count: next.completedActions.length });
    }

    world.setResource(ScenarioSmokeState, next);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "scenario-smoke-domain-kit",
    provides: ["n:scenario-smoke", "qa:smoke-actions"],
    resources: { ScenarioSmokeState },
    events: { ScenarioSmokeAction, ScenarioSmokeCompleted, ScenarioSmokeRejected },
    systems: [{ phase: config.phase ?? "simulate", name: "scenarioSmokeDomainSystem", system }],
    initWorld({ world }) {
      world.setResource(ScenarioSmokeState, createState(config));
    },
    install({ engine, world }) {
      engine.scenarioSmokeDomain = {
        run(action, payload = {}) {
          world.emit(ScenarioSmokeAction, { action, ...payload });
          return world.getResource(ScenarioSmokeState);
        },
        getState() {
          return clone(world.getResource(ScenarioSmokeState));
        }
      };
    },
    metadata: {
      domain: "scenario-smoke",
      scope: "large-domain",
      extendsBase: "HarnessKit",
      composes: ["input-action-domain-kit", "objective-flow-domain-kit", "scenario-qa-harness"],
      ownsLoop: false,
      purpose: "Owns AAA route smoke action validation and signed smoke state for shell-to-real-experiment migration."
    }
  });
}

export default createScenarioSmokeDomainKit;
