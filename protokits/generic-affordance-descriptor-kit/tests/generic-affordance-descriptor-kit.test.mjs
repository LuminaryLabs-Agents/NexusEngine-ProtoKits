import assert from "node:assert/strict";
import { createGenericAffordanceDescriptorKit, normalizeAffordance } from "../index.js";

function defineNamed(kind, name) { return Object.freeze({ kind, name }); }
function defineRuntimeKit(config = {}) { return Object.freeze({ id: config.id ?? "kit", resources: config.resources ?? {}, events: config.events ?? {}, systems: config.systems ?? [], requires: config.requires ?? [], provides: config.provides ?? [], bindings: config.bindings ?? {}, metadata: config.metadata ?? {}, initWorld: config.initWorld, install: config.install }); }
const Nexus = { defineResource: (name) => defineNamed("resource", name), defineEvent: (name) => defineNamed("event", name), defineRuntimeKit };
function createWorld() { const resources = new Map(); const events = new Map(); return { __nexusClock: { delta: 0, elapsed: 0, frame: 0 }, setResource(def, value) { resources.set(def.name, value); return value; }, getResource(def) { return resources.get(def.name); }, emit(def, payload = {}) { const queue = events.get(def.name) ?? []; queue.push(payload); events.set(def.name, queue); return payload; }, readEvents(def) { return (events.get(def.name) ?? []).slice(); } }; }
function createEngine(kits) { const world = createWorld(); const systems = []; const engine = { world, tick(delta = 1 / 60) { world.__nexusClock.delta = delta; world.__nexusClock.elapsed += delta; world.__nexusClock.frame += 1; for (const entry of systems) entry.system(world); return world; } }; for (const kit of kits) { kit.initWorld?.({ engine, world, kit }); for (const entry of kit.systems ?? []) systems.push(entry); kit.install?.({ engine, world, kit }); } return engine; }

assert.equal(normalizeAffordance({ id: "door", actionIds: ["open"] }).id, "door");
const config = {
  hideCompleted: true,
  affordances: [
    { id: "door", label: "Door", actionIds: ["open"], descriptor: { prompt: "Open" } },
    { id: "jam", label: "Jam", actionIds: ["purge"], blocked: true, rejectionReason: "jammed" },
    { id: "secret", hidden: true },
    { id: "done", completed: true }
  ]
};
const engine = createEngine([createGenericAffordanceDescriptorKit(Nexus, config)]);

assert.equal(engine.genericAffordances.getState().affordances.length, 4);
assert.deepEqual(engine.genericAffordances.getAvailable().map((entry) => entry.id), ["door"]);
assert.equal(engine.genericAffordances.requestUse("door", "open").id, "door");
assert.equal(engine.genericAffordances.getAffordance("door").useCount, 1);
assert.equal(engine.genericAffordances.requestUse("jam", "purge").reason, "jammed");
engine.genericAffordances.setBlocked("jam", false, "clear");
assert.equal(engine.genericAffordances.requestUse("jam", "purge").id, "jam");
engine.genericAffordances.setEnabled("door", false, "lock");
assert.equal(engine.genericAffordances.requestUse("door", "open").reason, "affordance-unavailable");
engine.genericAffordances.setEnabled("door", true, "unlock");
engine.genericAffordances.setDescriptor("door", { tone: "gold" }, "tone");
assert.equal(engine.genericAffordances.getAffordance("door").descriptor.tone, "gold");
engine.genericAffordances.setCompleted("door", true, "done");
assert.equal(engine.genericAffordances.getAffordance("door").hidden, true);
engine.genericAffordances.reset();
assert.deepEqual(engine.genericAffordances.getAvailable().map((entry) => entry.id), ["door"]);

const first = createEngine([createGenericAffordanceDescriptorKit(Nexus, config)]);
const second = createEngine([createGenericAffordanceDescriptorKit(Nexus, config)]);
for (const instance of [first, second]) {
  instance.genericAffordances.requestUse("door", "open");
  instance.genericAffordances.setBlocked("jam", false, "clear");
  instance.genericAffordances.requestUse("jam", "purge");
}
assert.deepEqual(first.genericAffordances.getState(), second.genericAffordances.getState());
assert.deepEqual(JSON.parse(JSON.stringify(first.genericAffordances.getState())), first.genericAffordances.getState());

console.log("generic affordance descriptor kit tests passed");
