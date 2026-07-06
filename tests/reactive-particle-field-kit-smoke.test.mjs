import assert from "node:assert/strict";
import {
  createStonewakeParticleKits
} from "../protokits/reactive-particle-field-kit/index.js";

const NexusRealtime = {
  defineResource(name) { return name; },
  defineEvent(name) { return name; },
  defineRuntimeKit(spec) { return spec; }
};

function harness(kits) {
  const resources = new Map();
  const events = [];
  const world = {
    __nexusClock: { frame: 0 },
    __nexusDelta: 1 / 30,
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
        for (const kit of kits) for (const system of kit.systems ?? []) system.system(world);
      }
    }
  };
}

const kits = createStonewakeParticleKits(NexusRealtime);
assert.equal(kits.length, 15);

const h = harness(kits);
h.engine.n.gpuSparkBurst.burst({ position: { x: 10, y: 20 }, count: 8, speed: 100 });
h.engine.n.gpuWaterMist.burst({ position: { x: 30, y: 40 }, count: 5 });
h.engine.n.gpuDoorAwakening.burst({ position: { x: 100, y: 60 }, count: 10 });
h.tick(2);

assert.ok(h.engine.n.gpuSparkBurst.getDescriptors().length > 0);
assert.ok(h.engine.n.gpuWaterMist.getDescriptors()[0].shader.fragment.includes("shadeParticle"));
assert.ok(h.engine.n.gpuDoorAwakening.getDescriptors().every((descriptor) => descriptor.kind === "gpu-door-awakening"));

console.log("reactive-particle-field-kit smoke passed");
