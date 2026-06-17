import assert from "node:assert/strict";
import { createGenericPressureLoopKit, normalizePressureChannel } from "../index.js";

function defineNamed(kind, name) { return Object.freeze({ kind, name }); }
function defineRuntimeKit(config = {}) { return Object.freeze({ id: config.id ?? "kit", resources: config.resources ?? {}, events: config.events ?? {}, systems: config.systems ?? [], requires: config.requires ?? [], provides: config.provides ?? [], bindings: config.bindings ?? {}, metadata: config.metadata ?? {}, initWorld: config.initWorld, install: config.install }); }
const Nexus = { defineResource: (name) => defineNamed("resource", name), defineEvent: (name) => defineNamed("event", name), defineRuntimeKit };
function createWorld() { const resources = new Map(); const events = new Map(); return { __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 }, setResource(def, value) { resources.set(def.name, value); return value; }, getResource(def) { return resources.get(def.name); }, emit(def, payload = {}) { const queue = events.get(def.name) ?? []; queue.push(payload); events.set(def.name, queue); return payload; }, readEvents(def) { return (events.get(def.name) ?? []).slice(); }, clearAllEvents() { events.clear(); } }; }
function createEngine(kits) { const world = createWorld(); const systems = []; const engine = { world, tick(delta = 1 / 60) { world.__nexusClock.delta = delta; world.__nexusClock.elapsed += delta; world.__nexusClock.frame += 1; for (const entry of systems) entry.system(world); const state = world; world.clearAllEvents(); return state; } }; for (const kit of kits) { kit.initWorld?.({ engine, world, kit }); for (const entry of kit.systems ?? []) systems.push(entry); kit.install?.({ engine, world, kit }); } return engine; }

const normalized = normalizePressureChannel({ id: "heat", value: 80, warningAt: 70, failAt: 100 });
assert.equal(normalized.status, "warning");

const engine = createEngine([
  createGenericPressureLoopKit(Nexus, {
    channels: [
      { id: "heat", value: 0, max: 100, warningAt: 40, failAt: 60, risePerSecond: 30 },
      { id: "oxygen", value: 50, max: 50, warningAt: 35, failAt: 48, fallPerSecond: 10 }
    ]
  })
]);

assert.equal(engine.genericPressureLoop.getState().channels.length, 2);
engine.tick(1);
assert.equal(engine.genericPressureLoop.getChannel("heat").value, 30);
engine.tick(1);
assert.equal(engine.genericPressureLoop.getChannel("heat").status, "failed");
engine.genericPressureLoop.recover("heat", 10);
assert.equal(engine.genericPressureLoop.getChannel("heat").status, "warning");
engine.genericPressureLoop.reset({ channels: [{ id: "alert", value: 0, risePerSecond: 5 }] });
assert.equal(engine.genericPressureLoop.getState().channels[0].id, "alert");
assert.deepEqual(JSON.parse(JSON.stringify(engine.genericPressureLoop.getState())), engine.genericPressureLoop.getState());
console.log("generic pressure loop kit tests passed");
