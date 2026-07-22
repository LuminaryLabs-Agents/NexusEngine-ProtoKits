import assert from "node:assert/strict";
import * as NexusEngineRuntime from "nexusengine";
import {
  createStonewakeSystemsDomainKits
} from "../protokits/stonewake-systems-domain-kits/index.js";
import {
  createPhysicsBodyWeightSourceProjectionKit
} from "../protokits/physics-body-weight-source-projection-kit/index.js";
import {
  createPhysicsBodyLiteDomainKit
} from "../protokits/physics-body-lite-domain-kit/index.js";
import {
  createWeightedTriggerDomainKit
} from "../protokits/weighted-trigger-domain-kit/index.js";

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

const endpointKits = createStonewakeSystemsDomainKits(NexusEngine, {
  acousticSignal: { defaultSpeed: 100, radiusPerIntensity: 100 },
  conditionGate: { },
  physicsBodyLite: { gravity: { x: 0, y: 0, z: 0 } },
  projectileLite: { gravity: { x: 0, y: 0, z: 0 } }
});
const projectionKit = createPhysicsBodyWeightSourceProjectionKit(NexusEngine);
const kits = [...endpointKits, projectionKit];

assert.deepEqual(projectionKit.requires, ["physics:body-lite", "trigger:weighted"]);
assert.deepEqual(projectionKit.provides, ["trigger:weighted-source-ingestion:physics-body"]);
assert.deepEqual(projectionKit.resources, {});
assert.deepEqual(projectionKit.events, {});
assert.deepEqual(projectionKit.systems, []);
assert.equal(projectionKit.metadata.ownsLoop, false);

const harness = createHarness(kits);
const { engine } = harness;

assert.equal(typeof engine.n.acousticSignal.emitSignal, "function");
assert.equal(typeof engine.n.weightedTrigger.registerTrigger, "function");
assert.equal(typeof engine.n.conditionGate.registerGate, "function");
assert.equal(typeof engine.n.physicsBodyLite.registerBody, "function");
assert.equal(typeof engine.n.weightedTrigger.sourceIngestion.projectPhysicsBody, "function");
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

assert.deepEqual(
  engine.n.weightedTrigger.sourceIngestion.projectPhysicsBody(),
  { accepted: false, reason: "body-id-required" }
);
assert.deepEqual(
  engine.n.weightedTrigger.sourceIngestion.projectPhysicsBody({ bodyId: "missing-body" }),
  { accepted: false, reason: "physics-body-not-found", bodyId: "missing-body" }
);

engine.n.physicsBodyLite.registerBody({
  id: "projection-body",
  position: { x: 4, y: 5, z: 6 },
  velocity: { x: 0, y: 0, z: 0 },
  size: { w: 2, h: 2, d: 2 },
  mass: 7
});
const frameBeforeProjection = harness.world.__nexusClock.frame;
const triggerTickBeforeProjection = engine.n.weightedTrigger.getState().tick;
const projected = engine.n.weightedTrigger.sourceIngestion.projectPhysicsBody({
  bodyId: "projection-body",
  tags: ["cargo", 2, "settled"],
  disabled: true,
  sourceId: "forbidden-source",
  position: { x: 999, y: 999, z: 999 },
  weight: 999,
  mass: 999
});
assert.deepEqual(projected, {
  accepted: true,
  bodyId: "projection-body",
  source: {
    id: "projection-body",
    position: { x: 4, y: 5, z: 6 },
    weight: 7,
    tags: ["cargo", "settled"],
    disabled: true
  }
});
assert.doesNotThrow(() => JSON.stringify(projected));
assert.equal(harness.world.__nexusClock.frame, frameBeforeProjection);
assert.equal(engine.n.weightedTrigger.getState().tick, triggerTickBeforeProjection);
projected.source.position.x = 999;
assert.equal(engine.n.weightedTrigger.getState().weightSources.find((source) => source.id === "projection-body").position.x, 4);

engine.n.weightedTrigger.sourceIngestion.projectPhysicsBody({ bodyId: "projection-body", tags: ["updated"] });
const projectedSources = engine.n.weightedTrigger.getState().weightSources.filter((source) => source.id === "projection-body");
assert.equal(projectedSources.length, 1);
assert.deepEqual(projectedSources[0].tags, ["updated"]);
assert.equal(projectedSources[0].disabled, false);

engine.n.projectileLite.setColliders([{ id: "floor", x: 10, y: 0, w: 40, h: 40 }]);
engine.n.projectileLite.spawnProjectile({ id: "pebble-a", position: { x: 0, y: 10 }, velocity: { x: 100, y: 0 }, acousticIntensity: 0.8, maxAge: 3 });
harness.tick(2);
assert.ok(engine.n.projectileLite.getState().projectiles.length >= 0);

const realEngine = NexusEngineRuntime.createEngine({
  kits: [
    createPhysicsBodyLiteDomainKit(NexusEngineRuntime, { gravity: { x: 0, y: 0, z: 0 } }),
    createWeightedTriggerDomainKit(NexusEngineRuntime),
    createPhysicsBodyWeightSourceProjectionKit(NexusEngineRuntime)
  ]
});
realEngine.n.physicsBodyLite.registerBody({ id: "real-body", position: { x: 2, y: 3, z: 4 }, mass: 6 });
const realTriggerTick = realEngine.n.weightedTrigger.getState().tick;
assert.deepEqual(
  realEngine.n.weightedTrigger.sourceIngestion.projectPhysicsBody({ bodyId: "real-body", tags: ["plate"] }).source,
  { id: "real-body", position: { x: 2, y: 3, z: 4 }, weight: 6, tags: ["plate"], disabled: false }
);
assert.equal(realEngine.n.weightedTrigger.getState().tick, realTriggerTick);
assert.equal(realEngine.n.weightedTrigger.getState().weightSources.length, 1);

console.log("stonewake-systems-domain-kits smoke passed");
