import { assert, createMockNexusRealtime, createSmokeWorld } from "./aaa-domain-spine-smoke-harness.mjs";
import { createCapabilityGraphDomainKit } from "../protokits/capability-graph-domain-kit/index.js";
import { createCompositionPlanningDomainKit } from "../protokits/composition-planning-domain-kit/index.js";

const NexusRealtime = createMockNexusRealtime();
const world = createSmokeWorld();
const engine = {};
const kits = [
  createCapabilityGraphDomainKit(NexusRealtime),
  createCompositionPlanningDomainKit(NexusRealtime)
];

for (const kit of kits) kit.initWorld?.({ world, engine });
for (const kit of kits) kit.install?.({ world, engine });

engine.capabilityGraph.registerMany([
  {
    id: "input-intent-domain-kit",
    domain: "input-intent",
    scope: "feature-domain",
    provides: ["input:intent"],
    requires: []
  },
  {
    id: "heat-pressure-domain-kit",
    domain: "heat-pressure",
    scope: "atomic-domain",
    provides: ["pressure:heat"],
    requires: ["input:intent"]
  }
]);

const graph = engine.capabilityGraph.buildGraph();
assert.equal(Object.keys(graph.nodes).length, 2, "graph has two domain nodes");
assert.equal(engine.capabilityGraph.findMissingRequires("heat-pressure-domain-kit").ok, true, "provided input dependency resolves");
assert.equal(engine.capabilityGraph.listByProvides("pressure:heat")[0].id, "heat-pressure-domain-kit", "provides index works");

const recipe = engine.compositionPlanning.registerRecipe({
  id: "basic-pressure-stack-domain-kit",
  type: "stack-domain",
  goal: "Compose basic pressure proof stack.",
  includes: ["heat-pressure-domain-kit"],
  requires: ["input:intent"],
  provides: ["stack:pressure.basic"],
  smoke: { ticks: 3 }
});

const plan = engine.compositionPlanning.createInstallPlan(recipe.id);
assert.equal(plan.ok, true, "install plan resolves dependency tokens");
assert.equal(plan.installOrder.includes("input-intent-domain-kit"), true, "install plan adds provider domain");
assert.equal(plan.installOrder.includes("heat-pressure-domain-kit"), true, "install plan includes requested domain");
assert.equal(engine.compositionPlanning.validateComposition(recipe.id).ok, true, "composition validates");

const missing = engine.compositionPlanning.planComposition({
  id: "missing-stack-domain-kit",
  includes: [],
  requires: ["missing:domain"],
  provides: ["stack:missing"]
});
assert.equal(missing.ok, false, "missing dependency composition is marked not ready");
assert.equal(engine.compositionPlanning.suggestMissingDomains("missing-stack-domain-kit")[0].suggestedId, "missing-domain-domain-kit", "missing provider suggestion is deterministic");
