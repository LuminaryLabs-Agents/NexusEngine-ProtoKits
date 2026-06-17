import assert from "node:assert/strict";
import { createGenericActionWindowKit, normalizeActionWindow } from "../index.js";

function defineNamed(kind, name) { return Object.freeze({ kind, name }); }
function defineRuntimeKit(config = {}) { return Object.freeze({ id: config.id ?? "kit", resources: config.resources ?? {}, events: config.events ?? {}, systems: config.systems ?? [], requires: config.requires ?? [], provides: config.provides ?? [], bindings: config.bindings ?? {}, metadata: config.metadata ?? {}, initWorld: config.initWorld, install: config.install }); }
const Nexus = { defineResource: (name) => defineNamed("resource", name), defineEvent: (name) => defineNamed("event", name), defineRuntimeKit };
function createWorld() { const resources = new Map(); const events = new Map(); return { __nexusClock: { delta: 0, elapsed: 0, frame: 0 }, setResource(def, value) { resources.set(def.name, value); return value; }, getResource(def) { return resources.get(def.name); }, emit(def, payload = {}) { const queue = events.get(def.name) ?? []; queue.push(payload); events.set(def.name, queue); return payload; }, readEvents(def) { return (events.get(def.name) ?? []).slice(); } }; }
function createEngine(kits) { const world = createWorld(); const systems = []; const engine = { world, tick(delta = 1 / 60) { world.__nexusClock.delta = delta; world.__nexusClock.elapsed += delta; world.__nexusClock.frame += 1; for (const entry of systems) entry.system(world); return world; } }; for (const kit of kits) { kit.initWorld?.({ engine, world, kit }); for (const entry of kit.systems ?? []) systems.push(entry); kit.install?.({ engine, world, kit }); } return engine; }

const normalized = normalizeActionWindow({ id: "forge", durationSeconds: 2, perfect: { startSeconds: 0.5, endSeconds: 0.8 } });
assert.equal(normalized.id, "forge");
assert.equal(normalized.status, "closed");

const config = {
  windows: [
    { id: "forge", durationSeconds: 2, cooldownSeconds: 1, perfect: { startSeconds: 0.5, endSeconds: 0.8 }, good: { startSeconds: 0.25, endSeconds: 1.5 }, closeOnSuccess: true },
    { id: "disabled", enabled: false }
  ]
};
const engine = createEngine([createGenericActionWindowKit(Nexus, config)]);

assert.equal(engine.genericActionWindow.getState().windows.length, 2);
assert.equal(engine.genericActionWindow.requestAction("forge").reason, "window closed");
assert.equal(engine.genericActionWindow.openWindow("forge").status, "open");
engine.tick(0.6);
const perfect = engine.genericActionWindow.requestAction("forge", { source: "test" });
assert.equal(perfect.result, "perfect");
assert.equal(perfect.accepted, true);
assert.equal(engine.genericActionWindow.getWindow("forge").status, "cooldown");
assert.equal(engine.genericActionWindow.openWindow("forge").reason, "window cooldown");
engine.tick(1.1);
assert.equal(engine.genericActionWindow.getWindow("forge").status, "closed");

engine.genericActionWindow.openWindow("forge");
engine.tick(1.2);
const good = engine.genericActionWindow.requestAction("forge");
assert.equal(good.result, "good");
assert.equal(good.accepted, true);
engine.tick(1.1);

engine.genericActionWindow.openWindow("forge");
engine.tick(1.8);
const miss = engine.genericActionWindow.requestAction("forge");
assert.equal(miss.result, "miss");
assert.equal(miss.accepted, false);
assert.equal(engine.genericActionWindow.getWindow("forge").status, "cooldown");
engine.tick(1.1);
assert.equal(engine.genericActionWindow.getWindow("forge").status, "closed");
assert.equal(engine.genericActionWindow.openWindow("disabled").reason, "window disabled");

engine.genericActionWindow.reset();
assert.equal(engine.genericActionWindow.getWindow("forge").status, "closed");

const first = createEngine([createGenericActionWindowKit(Nexus, config)]);
const second = createEngine([createGenericActionWindowKit(Nexus, config)]);
for (const engineInstance of [first, second]) {
  engineInstance.genericActionWindow.openWindow("forge");
  engineInstance.tick(0.6);
  engineInstance.genericActionWindow.requestAction("forge");
  engineInstance.tick(1.1);
}
assert.deepEqual(first.genericActionWindow.getState(), second.genericActionWindow.getState());
assert.deepEqual(JSON.parse(JSON.stringify(first.genericActionWindow.getState())), first.genericActionWindow.getState());

console.log("generic action window kit tests passed");
