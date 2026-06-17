import assert from "node:assert/strict";
import { createGenericResourceLoopKit, normalizeResourceMeter } from "../index.js";

function defineNamed(kind, name) { return Object.freeze({ kind, name }); }
function defineRuntimeKit(config = {}) { return Object.freeze({ id: config.id ?? "kit", resources: config.resources ?? {}, events: config.events ?? {}, systems: config.systems ?? [], requires: config.requires ?? [], provides: config.provides ?? [], bindings: config.bindings ?? {}, metadata: config.metadata ?? {}, initWorld: config.initWorld, install: config.install }); }
const Nexus = { defineResource: (name) => defineNamed("resource", name), defineEvent: (name) => defineNamed("event", name), defineRuntimeKit };
function createWorld() { const resources = new Map(); const events = new Map(); return { __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 }, setResource(def, value) { resources.set(def.name, value); return value; }, getResource(def) { return resources.get(def.name); }, emit(def, payload = {}) { const queue = events.get(def.name) ?? []; queue.push(payload); events.set(def.name, queue); return payload; }, readEvents(def) { return (events.get(def.name) ?? []).slice(); }, clearAllEvents() { events.clear(); } }; }
function createEngine(kits) { const world = createWorld(); const systems = []; const engine = { world, tick(delta = 1 / 60) { world.__nexusClock.delta = delta; world.__nexusClock.elapsed += delta; world.__nexusClock.frame += 1; for (const entry of systems) entry.system(world); return world; } }; for (const kit of kits) { kit.initWorld?.({ engine, world, kit }); for (const entry of kit.systems ?? []) systems.push(entry); kit.install?.({ engine, world, kit }); } return engine; }

const normalized = normalizeResourceMeter({ id: "oxygen", initial: 40, max: 50, thresholds: [{ id: "low", value: 20, direction: "below" }] });
assert.equal(normalized.value, 40);
assert.equal(normalized.full, false);

const engine = createEngine([
  createGenericResourceLoopKit(Nexus, {
    resources: [
      { id: "oxygen", initial: 50, max: 50, ratePerSecond: -10, thresholds: [{ id: "low", value: 25, direction: "below" }] },
      { id: "charge", initial: 0, max: 100, thresholds: [{ id: "ready", value: 80, direction: "above" }] }
    ]
  })
]);

assert.equal(engine.genericResourceLoop.getState().resources.length, 2);
engine.genericResourceLoop.spend("oxygen", 60, "test-spend");
assert.equal(engine.genericResourceLoop.getResource("oxygen").value, 0);
assert.equal(engine.genericResourceLoop.getResource("oxygen").empty, true);

engine.genericResourceLoop.restore("charge", 120, "test-restore");
assert.equal(engine.genericResourceLoop.getResource("charge").value, 100);
assert.equal(engine.genericResourceLoop.getResource("charge").full, true);

engine.genericResourceLoop.reset({
  resources: [
    { id: "oxygen", initial: 50, max: 50, ratePerSecond: -10, thresholds: [{ id: "low", value: 25, direction: "below" }] },
    { id: "charge", initial: 0, max: 100, thresholds: [{ id: "ready", value: 80, direction: "above" }] }
  ]
});
engine.tick(1);
engine.tick(1);
engine.tick(1);
assert.equal(engine.genericResourceLoop.getResource("oxygen").value, 20);
assert.equal(engine.genericResourceLoop.getResource("oxygen").lastThresholdEvent.thresholdId, "low");

engine.genericResourceLoop.setRate("charge", 50, "charge-up");
engine.tick(1);
engine.tick(1);
assert.equal(engine.genericResourceLoop.getResource("charge").value, 100);
assert.equal(engine.genericResourceLoop.getResource("charge").lastThresholdEvent.thresholdId, "ready");

engine.genericResourceLoop.setLocked("charge", true, "test-lock");
engine.genericResourceLoop.spend("charge", 10, "locked-spend");
assert.equal(engine.genericResourceLoop.getResource("charge").value, 100);

const first = createEngine([createGenericResourceLoopKit(Nexus, { resources: [{ id: "ink", initial: 30, max: 30, ratePerSecond: -3 }] })]);
const second = createEngine([createGenericResourceLoopKit(Nexus, { resources: [{ id: "ink", initial: 30, max: 30, ratePerSecond: -3 }] })]);
for (let i = 0; i < 5; i++) {
  first.tick(0.5);
  second.tick(0.5);
}
assert.deepEqual(first.genericResourceLoop.getState(), second.genericResourceLoop.getState());
assert.deepEqual(JSON.parse(JSON.stringify(first.genericResourceLoop.getState())), first.genericResourceLoop.getState());

console.log("generic resource loop kit tests passed");
