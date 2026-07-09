import assert from "node:assert/strict";
import fs from "node:fs";
import { createRealtimeGame } from "nexusengine";
import {
  createKitRegistryDomainKit,
  createRepositoryRegistry,
  mergeRegistries,
  validateRepositoryRegistry
} from "../index.js";
import { createCapabilityGraphDomainKit } from "../../capability-graph-domain-kit/index.js";
import { createCompositionPlanningDomainKit } from "../../composition-planning-domain-kit/index.js";

const sourceCommit = "1234567890abcdef1234567890abcdef12345678";
const registry = createRepositoryRegistry({
  id: "LuminaryLabs-Dev/example-kits",
  owner: "LuminaryLabs-Dev",
  repository: "example-kits",
  requestedRef: "main",
  resolvedCommit: sourceCommit,
  kits: [
    { id: "input-intent-domain-kit", domain: "input-intent", domainPath: "n:input:intent", apiName: "inputIntent", status: "official", provides: ["input:intent"] },
    { id: "heat-pressure-domain-kit", domain: "heat-pressure", domainPath: "n:pressure:heat", apiName: "heatPressure", status: "candidate", requires: ["input:intent"], provides: ["pressure:heat"] },
    { id: "pressure-display-domain-kit", domain: "pressure-display", domainPath: "n:presentation:pressure", apiName: "pressureDisplay", kind: "presentation-domain-kit", status: "official", requires: ["pressure:heat"], provides: ["presentation:pressure"] }
  ],
  domains: [{ id: "pressure", kits: ["heat-pressure-domain-kit", "pressure-display-domain-kit"] }],
  bundles: [{ id: "pressure-stack", kits: ["input-intent-domain-kit"], domains: ["pressure"] }]
});

assert.equal(registry.trusted, true);
assert.equal(validateRepositoryRegistry(registry, { requirePinned: true }).ok, true);
assert.equal(validateRepositoryRegistry({ ...registry, resolvedCommit: null }, { requirePinned: true }).ok, false);
assert.equal(mergeRegistries([registry], { requirePinned: true }).kitOrder.length, 3);

const engine = createRealtimeGame({
  kits: [
    createKitRegistryDomainKit(),
    createCapabilityGraphDomainKit(),
    createCompositionPlanningDomainKit()
  ]
});

engine.n.kitRegistry.registerRegistry(registry, { requirePinned: true });
assert.equal(engine.n.kitRegistry.list().length, 3);
assert.equal(engine.n.kitRegistry.search("heat")[0].id, "heat-pressure-domain-kit");
assert.equal(engine.n.kitRegistry.listByProvides("pressure:heat").length, 1);
assert.equal(engine.n.kitRegistry.listRegistries()[0].resolvedCommit, sourceCommit);
assert.deepEqual(engine.n.kitRegistry.getProgress(), {
  total: 3,
  resolved: 2,
  remaining: 1,
  statuses: { official: 2, candidate: 1 }
});
assert.equal(engine.kitManifest, engine.n.kitRegistry);
assert.equal(engine.domainManifestRegistry, engine.n.kitRegistry);

engine.n.capabilityGraph.syncRegistry();
const graph = engine.n.capabilityGraph.buildGraph();
assert.equal(Object.keys(graph.nodes).length, 3);
assert.equal(graph.missing.length, 0);
assert.deepEqual(engine.n.capabilityGraph.findCycles(), []);
assert.deepEqual(engine.n.capabilityGraph.createInstallOrder(["pressure-display-domain-kit"]).installOrder, [
  "input-intent-domain-kit",
  "heat-pressure-domain-kit",
  "pressure-display-domain-kit"
]);

engine.n.compositionPlanning.registerRecipe({
  id: "pressure-stack-recipe",
  bundles: ["pressure-stack"],
  allowStatuses: ["official", "candidate"]
});
const plan = engine.n.compositionPlanning.createInstallPlan("pressure-stack-recipe");
assert.equal(plan.ok, true);
assert.deepEqual(plan.installOrder, ["input-intent-domain-kit", "heat-pressure-domain-kit", "pressure-display-domain-kit"]);

const graphSnapshot = engine.n.capabilityGraph.getSnapshot();
engine.n.capabilityGraph.reset();
engine.n.capabilityGraph.loadSnapshot(graphSnapshot);
assert.deepEqual(engine.n.capabilityGraph.getSnapshot(), graphSnapshot);

const planningSnapshot = engine.n.compositionPlanning.getSnapshot();
engine.n.compositionPlanning.reset();
engine.n.compositionPlanning.loadSnapshot(planningSnapshot);
assert.deepEqual(engine.n.compositionPlanning.getSnapshot(), planningSnapshot);

const missingPlan = engine.n.compositionPlanning.planComposition({
  id: "missing-recipe",
  kits: ["missing-kit"],
  allowStatuses: ["official", "candidate"]
});
assert.equal(missingPlan.ok, false);
assert.ok(missingPlan.missing.some((entry) => entry.type === "missing-kit"));

const snapshot = engine.n.kitRegistry.getSnapshot();
engine.n.kitRegistry.reset();
assert.equal(engine.n.kitRegistry.list().length, 0);
engine.n.kitRegistry.loadSnapshot(snapshot);
assert.equal(engine.n.kitRegistry.list().length, 3);
assert.deepEqual(engine.n.kitRegistry.getSnapshot(), snapshot);

assert.throws(() => engine.n.kitRegistry.registerRegistry(createRepositoryRegistry({
  id: "custom/conflict",
  owner: "custom",
  repository: "conflict",
  kits: [{ id: "other-kit", domain: "other", domainPath: "n:pressure:heat", apiName: "otherApi" }]
})), /domain path collision/);

const cycleRegistry = createRepositoryRegistry({
  id: "LuminaryLabs-Agents/cycle-kits",
  owner: "LuminaryLabs-Agents",
  repository: "cycle-kits",
  resolvedCommit: sourceCommit,
  kits: [
    { id: "cycle-a-kit", domain: "cycle-a", domainPath: "n:cycle:a", apiName: "cycleA", status: "candidate", requires: ["cycle:b"], provides: ["cycle:a"] },
    { id: "cycle-b-kit", domain: "cycle-b", domainPath: "n:cycle:b", apiName: "cycleB", status: "candidate", requires: ["cycle:a"], provides: ["cycle:b"] },
    { id: "cycle-self-kit", domain: "cycle-self", domainPath: "n:cycle:self", apiName: "cycleSelf", status: "candidate", requires: ["cycle:self"], provides: ["cycle:self"] }
  ]
});
engine.n.kitRegistry.registerRegistry(cycleRegistry);
engine.n.capabilityGraph.syncRegistry();
const cycles = engine.n.capabilityGraph.findCycles();
assert.equal(cycles.length, 2);
assert.ok(cycles.some((cycle) => cycle.join("->") === "cycle-self-kit->cycle-self-kit"));
assert.equal(engine.n.capabilityGraph.createInstallOrder(["cycle-a-kit"]).ok, false);

const scaleRegistry = createRepositoryRegistry({
  id: "LuminaryLabs-Agents/scale-kits",
  owner: "LuminaryLabs-Agents",
  repository: "scale-kits",
  resolvedCommit: sourceCommit,
  kits: Array.from({ length: 1000 }, (_, index) => ({
    id: `scale-${index}-kit`,
    domain: `scale-${index}`,
    domainPath: `n:scale:${index}`,
    apiName: `scale${index}`,
    status: "experimental",
    provides: [`scale:${index}`]
  }))
});
const scaleStartedAt = performance.now();
const scaleEngine = createRealtimeGame({ kits: [createKitRegistryDomainKit({ registries: [scaleRegistry] }), createCapabilityGraphDomainKit()] });
scaleEngine.n.capabilityGraph.syncRegistry();
assert.equal(scaleEngine.n.kitRegistry.list().length, 1000);
assert.equal(Object.keys(scaleEngine.n.capabilityGraph.buildGraph().nodes).length, 1000);
assert.ok(performance.now() - scaleStartedAt < 5000, "1,000-manifest registry/graph proof must stay under five seconds");

for (const file of [
  new URL("../index.js", import.meta.url),
  new URL("../../capability-graph-domain-kit/index.js", import.meta.url),
  new URL("../../composition-planning-domain-kit/index.js", import.meta.url)
]) {
  const source = fs.readFileSync(file, "utf8");
  for (const forbidden of ["document.", "window.", "localStorage", "fetch(", "Date.now(", "Math.random(", "new THREE.", "getContext("]) {
    assert.equal(source.includes(forbidden), false, `${file.pathname} must not contain ${forbidden}`);
  }
}

console.log("registry control plane tests passed");
