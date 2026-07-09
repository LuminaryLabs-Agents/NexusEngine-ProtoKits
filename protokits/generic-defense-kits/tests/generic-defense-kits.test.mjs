import assert from "node:assert/strict";
import {
  createGenericDefenseGame,
  createGenericDefenseKits,
  createGenericDefenseLevel,
  GENERIC_DEFENSE_KITS_VERSION
} from "../index.js";

function createMiniNexus() {
  const phases = ["input", "simulate", "resolve", "cleanup"];
  function defineResource(name) { return Object.freeze({ kind: "resource", name }); }
  function defineEvent(name) { return Object.freeze({ kind: "event", name }); }
  function defineRuntimeKit(config) { return Object.freeze({ ...config }); }

  function createWorld() {
    const resources = new Map();
    const events = new Map();
    const ensureEvents = (event) => {
      if (!events.has(event.name)) events.set(event.name, []);
      return events.get(event.name);
    };
    return {
      __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 },
      setResource(resource, value) { resources.set(resource.name, value); return value; },
      getResource(resource) { return resources.get(resource.name); },
      emit(event, payload = {}) { ensureEvents(event).push(payload); return payload; },
      readEvents(event) { return ensureEvents(event).slice(); },
      clearAllEvents() { for (const queue of events.values()) queue.length = 0; }
    };
  }

  function createRealtimeGame({ kits = [] } = {}) {
    const world = createWorld();
    const systems = [];
    const engine = {
      world,
      clock: world.__nexusClock,
      kits,
      tick(delta = 1 / 60) {
        engine.clock.delta = delta;
        engine.clock.elapsed += delta;
        engine.clock.frame += 1;
        world.__nexusClock = engine.clock;
        for (const phase of phases) {
          for (const entry of systems) {
            if (entry.phase === phase) entry.system(world);
          }
        }
        world.clearAllEvents();
        return world;
      }
    };
    for (const kit of kits) {
      kit.initWorld?.({ engine, world });
    }
    for (const kit of kits) {
      kit.install?.({ engine, world });
      for (const system of kit.systems ?? []) systems.push(system);
    }
    return engine;
  }

  return { defineResource, defineEvent, defineRuntimeKit, createRealtimeGame };
}

const NexusEngine = createMiniNexus();
const level = createGenericDefenseLevel();
assert.equal(GENERIC_DEFENSE_KITS_VERSION, "0.1.0");
assert.ok(level.path.length >= 2);
assert.ok(createGenericDefenseKits(NexusEngine).length >= 6);

const engine = createGenericDefenseGame(NexusEngine, {
  level: { startingCurrency: 180 }
});

engine.tick(0);
let snapshot = engine.genericDefense.getSnapshot();
assert.equal(snapshot.economy.currency, 180);
assert.equal(snapshot.session.status, "planning");

engine.genericDefense.build("slot-a", "bolt", { commandId: "build-a" });
engine.tick(1 / 60);
snapshot = engine.genericDefense.getSnapshot();
assert.equal(Object.keys(snapshot.structures.structures).length, 1);
assert.ok(snapshot.economy.currency < 180, "building spends currency");

engine.genericDefense.build("slot-d", "ember", { commandId: "build-d" });
engine.tick(1 / 60);
engine.genericDefense.startWave({ commandId: "wave-one" });
engine.tick(1 / 60);

snapshot = engine.genericDefense.getSnapshot();
assert.equal(snapshot.session.status, "combat");
assert.equal(snapshot.agents.waveActive, true);

for (let i = 0; i < 900; i += 1) {
  engine.tick(1 / 60);
}

snapshot = engine.genericDefense.getSnapshot();
assert.ok(snapshot.session.waveIndex >= 1, "first wave should complete");
assert.ok(snapshot.map.vital.health > 0, "core should survive the test slice");
assert.ok(snapshot.render.descriptors.length > 0, "render descriptors should exist");

const beforeDuplicate = snapshot.economy.currency;
engine.genericDefense.build("slot-a", "bolt", { commandId: "duplicate-occupied" });
engine.tick(1 / 60);
engine.genericDefense.build("slot-a", "bolt", { commandId: "duplicate-occupied" });
engine.tick(1 / 60);
snapshot = engine.genericDefense.getSnapshot();
assert.equal(Object.keys(snapshot.structures.structures).length, 2, "occupied slot should not duplicate structures");
assert.equal(snapshot.economy.currency, beforeDuplicate, "rejected duplicate/occupied build should not spend");

console.log("generic-defense-kits test passed");
