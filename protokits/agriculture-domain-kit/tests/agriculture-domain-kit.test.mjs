import assert from "node:assert/strict";
import * as NexusEngine from "nexusengine";
import { createAgricultureDomainKit } from "../index.js";

function createEngine(config) {
  return NexusEngine.createEngine({
    kits: [
      NexusEngine.createCoreTransactionLedgerKit(),
      createAgricultureDomainKit(NexusEngine, config)
    ]
  });
}

const tropicalConfig = {
  stateId: "tropical-agriculture",
  growthMode: "continuous",
  unwateredGrowthRate: 0.5,
  soilDefaults: { soilType: "tropical-loam", moisture: 0.4, fertility: 0.9 },
  plots: [
    { id: "plot-1", position: { x: 0, z: 0 } },
    { id: "plot-2", position: { x: 4, z: 0 } }
  ],
  cropDefinitions: {
    taro: {
      id: "taro",
      label: "Taro",
      seedItemId: "taro-seed",
      harvestItemId: "taro-root",
      growthSeconds: 4,
      stageCount: 4,
      yieldMin: 2,
      yieldMax: 4,
      preferredSoils: ["tropical-loam"]
    },
    coconut: {
      id: "coconut",
      label: "Coconut Palm",
      seedItemId: "coconut-sprout",
      harvestItemId: "coconut",
      growthSeconds: 4,
      regrowSeconds: 2,
      stageCount: 5,
      yieldMin: 2,
      yieldMax: 3,
      perennial: true,
      preferredSoils: ["tropical-loam"]
    }
  }
};

function runTropicalScenario() {
  const engine = createEngine(tropicalConfig);
  const agriculture = engine.n.agriculture;
  assert.ok(agriculture);
  assert.equal(engine.getDomainPaths().includes("n:production:agriculture"), true);

  const prepare = agriculture.land.prepare("plot-1", "tropical:prepare:1", "player");
  assert.equal(prepare.result.action, "prepare");
  const duplicatePrepare = agriculture.land.prepare("plot-1", "tropical:prepare:1", "player");
  assert.equal(duplicatePrepare.duplicate, true);
  assert.equal(agriculture.getPlot("plot-1").revision, 2);

  const plantPlan = agriculture.cultivation.plan("plot-1", {
    operationId: "tropical:plant:1",
    actorId: "player",
    cropId: "taro"
  });
  assert.deepEqual(plantPlan.resourceChanges, [{ itemId: "taro-seed", amount: -1, reason: "plant" }]);
  agriculture.cultivation.commit(plantPlan, "tropical:plant:1");
  agriculture.water.apply("plot-1", "tropical:water:1", "player");
  engine.tick(4.1);
  assert.equal(agriculture.getPlot("plot-1").status, "ready");

  const harvestPlan = agriculture.harvest.plan("plot-1", {
    operationId: "tropical:harvest:1",
    actorId: "player"
  });
  assert.equal(harvestPlan.resourceChanges[0].itemId, "taro-root");
  agriculture.harvest.commit(harvestPlan, "tropical:harvest:1");
  assert.equal(agriculture.getPlot("plot-1").status, "tilled");

  agriculture.land.prepare("plot-2", "tropical:prepare:2", "player");
  agriculture.cultivation.plant("plot-2", "coconut", "tropical:plant:2", "player");
  agriculture.water.apply("plot-2", "tropical:water:2", "player");
  engine.tick(4.1);
  const palmHarvestPlan = agriculture.harvest.plan("plot-2", {
    operationId: "tropical:harvest:2",
    actorId: "player"
  });
  agriculture.harvest.commit(palmHarvestPlan, "tropical:harvest:2");
  assert.equal(agriculture.getPlot("plot-2").status, "regrowing");
  assert.equal(agriculture.getPlot("plot-2").cropId, "coconut");
  engine.tick(2.1);
  assert.equal(agriculture.getPlot("plot-2").status, "ready");

  const snapshot = agriculture.getSnapshot();
  const restored = createEngine(tropicalConfig);
  restored.n.agriculture.loadSnapshot(snapshot);
  assert.deepEqual(restored.n.agriculture.getSnapshot(), snapshot);
  return {
    snapshot,
    ledger: engine.n.coreTransactionLedger.getSnapshot(),
    descriptors: agriculture.getDescriptors()
  };
}

const tropicalA = runTropicalScenario();
const tropicalB = runTropicalScenario();
assert.deepEqual(tropicalB, tropicalA, "tropical agriculture replay is deterministic");
assert.equal(tropicalA.descriptors.every((entry) => entry.kind === "agriculture-plot"), true);

const temperateConfig = {
  stateId: "temperate-agriculture",
  growthMode: "daily",
  secondsPerResolvedDay: 60,
  soilDefaults: { soilType: "temperate-loam", moisture: 0.25, fertility: 0.75 },
  plots: [{ id: "field-a" }, { id: "orchard-a" }],
  cropDefinitions: {
    wheat: {
      id: "wheat",
      label: "Wheat",
      seedItemId: "wheat-seed",
      harvestItemId: "wheat",
      growthDays: 2,
      stageCount: 3,
      yieldMin: 3,
      yieldMax: 5,
      preferredSoils: ["temperate-loam"]
    },
    apple: {
      id: "apple",
      label: "Apple Tree",
      seedItemId: "apple-sapling",
      harvestItemId: "apple",
      growthDays: 1,
      regrowDays: 1,
      stageCount: 4,
      yieldMin: 2,
      yieldMax: 4,
      perennial: true,
      preferredSoils: ["temperate-loam"]
    }
  }
};

const temperate = createEngine(temperateConfig);
const agriculture = temperate.n.agriculture;
agriculture.land.prepare("field-a", "temperate:prepare:field", "farmer");
agriculture.cultivation.plant("field-a", "wheat", "temperate:plant:wheat", "farmer");
agriculture.water.apply("field-a", "temperate:water:wheat", "farmer");
agriculture.growth.resolveDay(1, { rainfall: 0 }, "temperate:day:1");
assert.equal(agriculture.getPlot("field-a").status, "growing");
agriculture.growth.resolveDay(2, { rainfall: 0.8 }, "temperate:day:2");
assert.equal(agriculture.getPlot("field-a").status, "ready");
const duplicateDay = agriculture.growth.resolveDay(2, { rainfall: 0.8 }, "temperate:day:2");
assert.equal(duplicateDay.duplicate, true);

agriculture.land.prepare("orchard-a", "temperate:prepare:orchard", "farmer");
agriculture.cultivation.plant("orchard-a", "apple", "temperate:plant:apple", "farmer");
agriculture.growth.resolveDay(3, { rainfall: 1 }, "temperate:day:3");
assert.equal(agriculture.getPlot("orchard-a").status, "ready");
const applePlan = agriculture.harvest.plan("orchard-a", { operationId: "temperate:harvest:apple", actorId: "farmer" });
agriculture.harvest.commit(applePlan, "temperate:harvest:apple");
assert.equal(agriculture.getPlot("orchard-a").status, "regrowing");
assert.equal(agriculture.perennials.list().some((crop) => crop.id === "apple"), true);

console.log("agriculture-domain-kit: tropical, temperate, replay, duplicate, snapshot, and perennial tests passed");
