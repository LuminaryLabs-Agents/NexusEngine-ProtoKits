import assert from "node:assert/strict";
import { createActionInputKit } from "../index.js";

function createMiniNexusRealtime() {
  const phases = ["input", "simulate", "resolve", "cleanup"];
  return {
    defineResource(name) { return { kind: "resource", name }; },
    defineEvent(name) { return { kind: "event", name }; },
    defineRuntimeKit(kit) { return kit; },
    createRealtimeGame({ kits = [] } = {}) {
      const resources = new Map();
      const events = new Map();
      const systems = [];
      const world = {
        __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 },
        setResource(resource, value) { resources.set(resource.name, value); return value; },
        getResource(resource) { return resources.get(resource.name); },
        emit(event, payload) { if (!events.has(event.name)) events.set(event.name, []); events.get(event.name).push(payload); return payload; },
        readEvents(event) { return (events.get(event.name) ?? []).slice(); },
        clearAllEvents() { for (const queue of events.values()) queue.length = 0; }
      };
      const engine = {
        world,
        tick(dt = 1 / 60) {
          world.__nexusClock.delta = dt;
          world.__nexusClock.elapsed += dt;
          world.__nexusClock.frame += 1;
          for (const phase of phases) {
            for (const item of systems.filter((system) => system.phase === phase)) item.system(world);
          }
          world.clearAllEvents();
          return world;
        }
      };
      for (const kit of kits) {
        kit.initWorld?.({ world, engine });
        for (const system of kit.systems ?? []) systems.push(system);
        kit.install?.({ world, engine });
      }
      return engine;
    }
  };
}

const NexusRealtime = createMiniNexusRealtime();
const engine = NexusRealtime.createRealtimeGame({
  kits: [createActionInputKit(NexusRealtime, { context: "test" })]
});

engine.actionInput.key("a", true);
engine.tick(1 / 60);
let state = engine.actionInput.getState();
assert.equal(state.held.left, true);
assert.equal(state.axis.x, -1);
assert.equal(state.edges[0].action, "left");

engine.actionInput.key("d", true);
engine.tick(1 / 60);
state = engine.actionInput.getState();
assert.equal(state.held.right, true);
assert.equal(state.axis.x, 0);

engine.actionInput.key("a", false);
engine.tick(1 / 60);
state = engine.actionInput.getState();
assert.equal(state.held.left, false);
assert.equal(state.axis.x, 1);

engine.actionInput.aim(10, 0);
engine.tick(1 / 60);
state = engine.actionInput.getState();
assert.equal(Math.round(state.aim.x), 1);
assert.equal(Math.round(state.aim.y), 0);

engine.actionInput.clear({ source: "test" });
engine.tick(1 / 60);
state = engine.actionInput.getState();
assert.equal(state.axis.x, 0);
assert.equal(state.held.right, false);

console.log("action-input-kit tests passed");
