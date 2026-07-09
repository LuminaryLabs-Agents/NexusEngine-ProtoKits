import assert from "node:assert/strict";
import {
  createStonewakeSystemsDomainKits
} from "../protokits/stonewake-systems-domain-kits/index.js";

function createHarness(kits) {
  const resources = new Map();
  const events = [];
  const world = {
    __nexusClock: { frame: 0 },
    __nexusDelta: 1 / 10,
    setResource(resource, value) { resources.set(resource, value); },
    getResource(resource) { return resources.get(resource); },
    emit(event, payload) { events.push({ event, payload }); }
  };
  const engine = { n: {} };
  for (const kit of kits) kit.initWorld?.({ world, engine });
  for (const kit of kits) kit.install?.({ world, engine });
  return {
    world,
    engine,
    events,
    tick(count = 1) {
      for (let i = 0; i < count; i += 1) {
        world.__nexusClock.frame += 1;
        for (const kit of kits) {
          for (const entry of kit.systems ?? []) entry.system(world);
        }
      }
    }
  };
}

const NexusEngine = {
  defineResource(name) { return name; },
  defineEvent(name) { return name; },
  defineRuntimeKit(spec) { return spec; }
};

const kits = createStonewakeSystemsDomainKits(NexusEngine, {
  acousticSignal: { defaultSpeed: 100, radiusPerIntensity: 100 },
  conditionGate: { },
  physicsBodyLite: { gravity: { x: 0, y: 0, z: 0 } },
  projectileLite: { gravity: { x: 0, y: 0, z: 0 } }
});

const harness = createHarness(kits);
const { engine } = harness;

assert.equal(typeof engine.n.acousticSignal.emitSignal, "function");
assert.equal(typeof engine.n.weightedTrigger.registerTrigger, "function");
assert.equal(typeof engine.n.conditionGate.registerGate, "function");
assert.equal(typeof engine.n.physicsBodyLite.registerBody, "function");
assert.equal(typeof engine.n.projectileLite.spawnProjectile, "function");
assert.equal(typeof engine.n.sensoryAgent.registerAgent, "function");

engine.n.weightedTrigger.registerTrigger({ id: "plate-a", bounds: { x: 0, y: 0, w: 20, h: 20 }, requiredWeight: 3 });
engine.n.weightedTrigger.setWeightSource({ id: "stone-a", position: { x: 10, y: 10 }, weight: 4 });
harness.tick(1);
assert.equal(engine.n.weightedTrigger.isActive("plate-a"), true);

engine.n.conditionGate.registerGate({ id: "door-a", conditions: ["plate-a", "machine-a"], openRate: 5, closeRate: 5 });
engine.n.conditionGate.setCondition("plate-a", engine.n.weightedTrigger.isActive("plate-a"));
engine.n.conditionGate.setCondition("machine-a", true);
harness.tick(3);
assert.equal(engine.n.conditionGate.getGate("door-a").state, "open");

engine.n.sensoryAgent.registerAgent({ id: "lurker-a", position: { x: 50, y: 0 }, hearingRadius: 1, chaseAtIntensity: 1.1 });
engine.n.acousticSignal.emitSignal({ id: "scrape-a", sourceId: "stone-a", position: { x: 50, y: 0 }, intensity: 1.5, maxRadius: 80, speed: 120 });
harness.tick(2);
assert.equal(engine.n.sensoryAgent.getAgent("lurker-a").state, "chase");

engine.n.physicsBodyLite.registerBody({ id: "block-a", position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, size: { w: 10, h: 10 }, mass: 5 });
engine.n.physicsBodyLite.applyImpulse("block-a", { x: 10, y: 0 });
harness.tick(1);
assert.ok(engine.n.physicsBodyLite.getBody("block-a").position.x > 0);

engine.n.projectileLite.setColliders([{ id: "floor", x: 10, y: 0, w: 40, h: 40 }]);
engine.n.projectileLite.spawnProjectile({ id: "pebble-a", position: { x: 0, y: 10 }, velocity: { x: 100, y: 0 }, acousticIntensity: 0.8, maxAge: 3 });
harness.tick(2);
assert.ok(engine.n.projectileLite.getState().projectiles.length >= 0);

console.log("stonewake-systems-domain-kits smoke passed");
