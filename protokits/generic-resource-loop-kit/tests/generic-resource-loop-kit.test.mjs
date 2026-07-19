import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as NexusEngine from "nexusengine";
import { createResourceMeter } from "nexusengine/core-kits";
import {
  createGenericResourceLoopKit,
  createResourceMeterDomainKit,
  normalizeResourceMeter
} from "../index.js";

const normalized = normalizeResourceMeter({
  id: "heat",
  start: 50,
  max: 100,
  drainPerSecond: 2,
  thresholds: [{ id: "low", value: 20, direction: "below", once: true }]
});
assert.equal(normalized.value, 50);
assert.equal(normalized.ratePerSecond, -2);
assert.equal(normalized.thresholds[0].repeatable, false);
assert.equal(createResourceMeterDomainKit, createGenericResourceLoopKit);

function createSourceEngine() {
  return NexusEngine.createEngine({
    kits: [
      createGenericResourceLoopKit(NexusEngine, {
        resources: [
          {
            id: "gold",
            label: "Gold",
            min: 0,
            max: 120,
            initial: 0,
            thresholds: [
              { id: "empty", value: 0, direction: "below" },
              { id: "loaded", value: 1, direction: "above" }
            ],
            tags: ["gold", "cargo", "extraction"]
          },
          { id: "heat", label: "Heat", start: 50, max: 100, drainPerSecond: 2 }
        ]
      })
    ]
  });
}

function runSourceScenario() {
  const engine = createSourceEngine();
  assert.equal(engine.n.resourceMeter, engine.n.genericResourceLoop);
  assert.equal(engine.resourceMeter, engine.genericResourceLoop);

  engine.n.resourceMeter.restore("gold", 24, "goldrush-mine-seam");
  engine.n.resourceMeter.spend("gold", 9, "goldrush-cashout-proof");
  for (let frame = 0; frame < 60; frame += 1) engine.tick(1 / 60);
  engine.n.resourceMeter.adjust("heat", 25, { source: "nexusengine-core-shape" });

  assert.equal(engine.n.resourceMeter.get("gold").value, 15);
  assert.ok(Math.abs(engine.n.resourceMeter.get("heat").value - 73) < 1e-9);
  assert.equal(engine.n.resourceMeter.getDescriptors().find((entry) => entry.id === "gold").normalized, 0.125);
  return { engine, snapshot: engine.n.resourceMeter.getSnapshot() };
}

const first = runSourceScenario();
const second = runSourceScenario();
assert.deepEqual(second.snapshot, first.snapshot, "GoldRush and NexusEngine source-shaped commands replay exactly");

first.engine.n.resourceMeter.register({ id: "oxygen", start: 10, max: 10, rate: -1 });
first.engine.n.resourceMeter.register({ id: "oxygen", start: 8, max: 10, rate: -2 });
assert.equal(first.engine.n.resourceMeter.getState().resources.filter((entry) => entry.id === "oxygen").length, 1, "registration is idempotent by id");
assert.equal(first.engine.n.resourceMeter.get("oxygen").value, 8);
for (let frame = 0; frame < 60; frame += 1) first.engine.tick(1 / 60);
assert.ok(Math.abs(first.engine.n.resourceMeter.get("oxygen").value - 6) < 1e-9);

first.engine.n.resourceMeter.setLocked("oxygen", true, "freeze");
first.engine.n.resourceMeter.spend("oxygen", 2, "blocked");
assert.ok(Math.abs(first.engine.n.resourceMeter.get("oxygen").value - 6) < 1e-9);
first.engine.n.resourceMeter.setLocked("oxygen", false, "resume");
assert.equal(first.engine.n.resourceMeter.remove("oxygen"), true);
assert.equal(first.engine.n.resourceMeter.get("oxygen"), null);

first.engine.n.resourceMeter.register({
  id: "signal",
  initial: 5,
  max: 5,
  thresholds: [{ id: "lost", value: 2, direction: "below", once: true }]
});
first.engine.n.resourceMeter.spend("signal", 4, "first-loss");
first.engine.n.resourceMeter.restore("signal", 4, "recover");
first.engine.n.resourceMeter.spend("signal", 4, "second-loss");
assert.equal(first.engine.n.resourceMeter.get("signal").thresholdCrossCounts.lost, 1, "one-shot thresholds do not emit repeatedly");

const snapshot = first.engine.n.resourceMeter.getSnapshot();
first.engine.n.resourceMeter.reset({ reason: "test" });
assert.equal(first.engine.n.resourceMeter.get("gold").value, 0);
first.engine.n.resourceMeter.loadSnapshot(snapshot);
assert.deepEqual(first.engine.n.resourceMeter.getSnapshot(), snapshot);
assert.throws(() => first.engine.n.resourceMeter.loadSnapshot({ ...snapshot, version: "0.1.0" }), /Unsupported/);
assert.throws(() => NexusEngine.createEngine({
  kits: [createGenericResourceLoopKit(NexusEngine, { resources: [{ id: "same" }, { id: "same" }] })]
}), /duplicated/);

const corePrimitive = createResourceMeter({ id: "stamina", initial: 10, max: 10 });
const parityEngine = NexusEngine.createEngine({ kits: [createGenericResourceLoopKit(NexusEngine, { resources: [{ id: "stamina", initial: 10, max: 10 }] })] });
corePrimitive.spend(3, "sprint");
parityEngine.n.resourceMeter.spend("stamina", 3, "sprint");
corePrimitive.restore(1, "rest");
parityEngine.n.resourceMeter.restore("stamina", 1, "rest");
assert.deepEqual(
  parityEngine.n.resourceMeter.getDescriptors()[0].value,
  corePrimitive.snapshot().value,
  "service mutation preserves the NexusEngine core meter primitive semantics"
);

const many = Array.from({ length: 1000 }, (_, index) => ({ id: `meter-${index}`, initial: 100, ratePerSecond: -1 }));
const scaleEngine = NexusEngine.createEngine({ kits: [createGenericResourceLoopKit(NexusEngine, { resources: many, recentChangeLimit: 64 })] });
scaleEngine.tick(1 / 60);
assert.equal(scaleEngine.n.resourceMeter.getState().resources.length, 1000);
assert.equal(scaleEngine.n.resourceMeter.getState().recentChanges.length, 64, "change history remains bounded at scale");

const source = readFileSync(new URL("../index.js", import.meta.url), "utf8");
for (const forbidden of ["document.", "window.", "requestAnimationFrame", "Date.now", "Math.random", "new THREE", "getContext("]) {
  assert.equal(source.includes(forbidden), false, `source excludes ${forbidden}`);
}

console.log("generic resource loop kit tests passed");
