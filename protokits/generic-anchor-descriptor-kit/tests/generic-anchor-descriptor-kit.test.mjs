import assert from "node:assert/strict";
import { createGenericAnchorDescriptorKit, normalizeAnchorDescriptor } from "../index.js";

function defineNamed(kind, name) { return Object.freeze({ kind, name }); }
function defineRuntimeKit(config = {}) { return Object.freeze({ id: config.id ?? "kit", resources: config.resources ?? {}, events: config.events ?? {}, systems: config.systems ?? [], requires: config.requires ?? [], provides: config.provides ?? [], bindings: config.bindings ?? {}, metadata: config.metadata ?? {}, initWorld: config.initWorld, install: config.install }); }
const Nexus = { defineResource: (name) => defineNamed("resource", name), defineEvent: (name) => defineNamed("event", name), defineRuntimeKit };
function createWorld() { const resources = new Map(); const events = new Map(); return { __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 }, setResource(def, value) { resources.set(def.name, value); return value; }, getResource(def) { return resources.get(def.name); }, emit(def, payload = {}) { const queue = events.get(def.name) ?? []; queue.push(payload); events.set(def.name, queue); return payload; }, readEvents(def) { return (events.get(def.name) ?? []).slice(); }, clearAllEvents() { events.clear(); } }; }
function createEngine(kits) { const world = createWorld(); const systems = []; const engine = { world, tick(delta = 1 / 60) { world.__nexusClock.delta = delta; world.__nexusClock.elapsed += delta; world.__nexusClock.frame += 1; for (const entry of systems) entry.system(world); world.clearAllEvents(); return world; } }; for (const kit of kits) { kit.initWorld?.({ engine, world, kit }); for (const entry of kit.systems ?? []) systems.push(entry); kit.install?.({ engine, world, kit }); } return engine; }

const normalized = normalizeAnchorDescriptor({ id: "a", x: 1, y: 2, tags: ["route-node"] });
assert.equal(normalized.position.x, 1);
assert.equal(normalized.tags[0], "route-node");

const engine = createEngine([
  createGenericAnchorDescriptorKit(Nexus, {
    anchors: [
      { id: "anchor-0", groupId: "route", position: { x: 0, y: 0, z: 0 }, tags: ["start"] }
    ]
  })
]);

assert.equal(engine.anchorDescriptors.getAnchors().length, 1);
engine.anchorDescriptors.addAnchor({ id: "anchor-1", groupId: "route", position: { x: 10, y: 20, z: 0 }, tags: ["route-node"] });
engine.tick(1 / 60);
assert.equal(engine.anchorDescriptors.getAnchors("route").length, 2);
assert.equal(engine.anchorDescriptors.getAnchor("anchor-1").position.y, 20);
engine.anchorDescriptors.removeAnchors(["anchor-0"]);
engine.tick(1 / 60);
assert.equal(engine.anchorDescriptors.getAnchors().length, 1);
assert.deepEqual(JSON.parse(JSON.stringify(engine.anchorDescriptors.getState())), engine.anchorDescriptors.getState());
console.log("generic anchor descriptor kit tests passed");
