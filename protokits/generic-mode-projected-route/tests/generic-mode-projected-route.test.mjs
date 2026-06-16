import assert from "node:assert/strict";
import { createGenericModeProjectedRoute, createProjectedRoute } from "../index.js";

function defineNamed(kind, name) { return Object.freeze({ kind, name }); }
function defineRuntimeKit(config = {}) { return Object.freeze({ id: config.id ?? "kit", resources: config.resources ?? {}, events: config.events ?? {}, systems: config.systems ?? [], requires: config.requires ?? [], provides: config.provides ?? [], bindings: config.bindings ?? {}, metadata: config.metadata ?? {}, initWorld: config.initWorld, install: config.install }); }
const Nexus = { defineResource: (name) => defineNamed("resource", name), defineEvent: (name) => defineNamed("event", name), defineRuntimeKit };
function createWorld() { const resources = new Map(); const events = new Map(); return { __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 }, setResource(def, value) { resources.set(def.name, value); return value; }, getResource(def) { return resources.get(def.name); }, emit(def, payload = {}) { const queue = events.get(def.name) ?? []; queue.push(payload); events.set(def.name, queue); return payload; }, readEvents(def) { return (events.get(def.name) ?? []).slice(); }, clearAllEvents() { events.clear(); } }; }
function createEngine(kits) { const world = createWorld(); const systems = []; const engine = { world, tick(delta = 1 / 60) { world.__nexusClock.delta = delta; world.__nexusClock.elapsed += delta; world.__nexusClock.frame += 1; for (const entry of systems) entry.system(world); world.clearAllEvents(); return world; } }; for (const kit of kits) { kit.initWorld?.({ engine, world, kit }); for (const entry of kit.systems ?? []) systems.push(entry); kit.install?.({ engine, world, kit }); } return engine; }

const config = {
  routeId: "test-route",
  path: {
    type: "bezier",
    start: { x: 0, y: 0, z: 0 },
    controls: [{ x: -20, y: 100, z: 0 }, { x: 40, y: 200, z: 0 }],
    end: { x: 0, y: 300, z: 0 }
  },
  sampling: { count: 6, jitterX: 10, jitterY: 4, seed: "test" },
  projection: { method: "plane", z: 0 },
  validation: { minSpacing: 20, maxEdgeDistance: 90 },
  restEvery: 3
};

const a = createProjectedRoute(config);
const b = createProjectedRoute(config);
assert.deepEqual(a, b, "same seed/config should be deterministic");
assert.equal(a.anchors.length, 6);
assert.ok(a.edges.length > 0);
assert.ok(a.anchors.some((anchor) => anchor.tags.includes("rest")));

const engine = createEngine([createGenericModeProjectedRoute(Nexus, config)]);
assert.equal(engine.projectedRoute.getAnchors().length, 6);
engine.projectedRoute.rebuild({ sampling: { count: 4, seed: "second" } });
engine.tick(1 / 60);
assert.equal(engine.projectedRoute.getAnchors().length, 4);
assert.deepEqual(JSON.parse(JSON.stringify(engine.projectedRoute.getState())), engine.projectedRoute.getState());
console.log("generic mode projected route tests passed");
