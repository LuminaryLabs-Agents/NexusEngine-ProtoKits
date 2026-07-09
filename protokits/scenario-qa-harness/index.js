import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const SCENARIO_QA_HARNESS_VERSION = "0.2.0";

function createInitialState(options = {}) {
  return { version: SCENARIO_QA_HARNESS_VERSION, scenarios: {}, results: [], latestResultId: null, requiredChecks: asList(options.requiredChecks ?? ["spawn", "inspect", "variants", "budgets", "descriptors", "replay"]) };
}

function normalizeScenario(scenario = {}, index = 0) {
  const id = scenario.id ?? `scenario-${index + 1}`;
  return { id, packetRef: scenario.packetRef ?? scenario.proofPacket ?? null, checks: asList(scenario.checks), steps: asList(scenario.steps), expected: scenario.expected ?? {}, metadata: clone(scenario.metadata ?? {}), ...clone(scenario), id };
}

function checkScenario(scenario = {}, context = {}) {
  const warnings = [];
  const checks = asList(scenario.checks?.length ? scenario.checks : context.requiredChecks);
  if (checks.includes("spawn") && !context.spawned && !context.object && !context.descriptor) warnings.push({ type: "missing-spawn" });
  if (checks.includes("inspect") && !context.inspection && !context.camera) warnings.push({ type: "missing-inspection" });
  if (checks.includes("variants") && scenario.expected?.variants && number(context.variantCount, 0) < number(scenario.expected.variants, 1)) warnings.push({ type: "missing-variants", expected: scenario.expected.variants, actual: context.variantCount ?? 0 });
  if (checks.includes("budgets") && context.budget?.ok === false) warnings.push({ type: "budget-failed", budget: context.budget });
  if (checks.includes("descriptors") && !context.descriptor && !context.snapshot) warnings.push({ type: "missing-descriptor" });
  if (checks.includes("replay") && context.replay?.ok === false) warnings.push({ type: "replay-failed", replay: context.replay });
  return { ok: warnings.length === 0, warningCount: warnings.length, warnings, checks };
}

export function createScenarioQaHarness(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const ScenarioQaState = resource(options.resourceName ?? "scenarioQa.state");
  const ScenarioRegistered = event("scenarioQa.registered");
  const ScenarioRun = event("scenarioQa.run");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? options.kitId ?? "scenario-qa-harness",
    resources: { ScenarioQaState },
    events: { ScenarioRegistered, ScenarioRun },
    provides: ["qa:scenario", "scenario-results", "proof-validation-report"],
    initWorld({ world }) { ensureResource(world, ScenarioQaState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, ScenarioQaState, () => createInitialState(options));
      const publish = (next) => { world.setResource(ScenarioQaState, next); return next; };
      engine[options.apiName ?? "scenarioQa"] = {
        getState: state,
        registerScenario(scenario = {}) {
          const next = state();
          const normalized = normalizeScenario(scenario, Object.keys(next.scenarios).length);
          next.scenarios[normalized.id] = normalized;
          publish(next);
          world.emit(ScenarioRegistered, { scenario: clone(normalized) });
          return clone(normalized);
        },
        runScenario(id, context = {}) {
          const next = state();
          const scenario = next.scenarios[id] ?? normalizeScenario({ id, checks: next.requiredChecks }, 0);
          const report = { resultId: `scenario-result-${next.results.length + 1}`, scenarioId: scenario.id, packetRef: scenario.packetRef, ...checkScenario(scenario, { ...context, requiredChecks: next.requiredChecks }) };
          next.results.push(report);
          next.latestResultId = report.resultId;
          publish(next);
          world.emit(ScenarioRun, { report: clone(report) });
          return clone(report);
        },
        runObjectProof(packetRef, context = {}) {
          const scenario = this.registerScenario({ id: `${packetRef}:object-proof`, packetRef, checks: ["spawn", "inspect", "variants", "budgets", "descriptors", "replay"] });
          return this.runScenario(scenario.id, context);
        },
        latestResult() { return clone(state().results.at(-1) ?? null); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: SCENARIO_QA_HARNESS_VERSION, purpose: "Bounded proof validation container for spawn, inspect, variant, budget, descriptor, and replay checks." }
  });
}

export default createScenarioQaHarness;
