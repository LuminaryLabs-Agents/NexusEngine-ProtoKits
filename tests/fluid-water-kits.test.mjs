import assert from "node:assert/strict";
import { createFluidFieldKit } from "../protokits/fluid-field-kit/index.js";
import { createFluidMotionKit } from "../protokits/fluid-motion-kit/index.js";
import { createFluidShadingKit } from "../protokits/fluid-shading-kit/index.js";
import { createFluidEffectsKit } from "../protokits/fluid-effects-kit/index.js";
import { createWaterDataKit } from "../protokits/water-data-kit/index.js";
import { createWaterStreamKit } from "../protokits/water-stream-kit/index.js";
import { createWaterSurfaceKit } from "../protokits/water-surface-kit/index.js";
import { createWaterMeshKit } from "../protokits/water-mesh-kit/index.js";
import { createWaterShadingKit } from "../protokits/water-shading-kit/index.js";
import { createWaterPhysicsKit } from "../protokits/water-physics-kit/index.js";
import { createWaterBehaviorKit } from "../protokits/water-behavior-kit/index.js";
import { createWaterEffectsKit } from "../protokits/water-effects-kit/index.js";
import { createWaterAudioKit } from "../protokits/water-audio-kit/index.js";
import { createWaterModeKit } from "../protokits/water-mode-kit/index.js";

function createMiniNexus() {
  return {
    defineResource: (id) => ({ id }),
    defineEvent: (id) => ({ id }),
    defineRuntimeKit: (kit) => kit
  };
}

function createMiniEngine(kits) {
  const resources = new Map();
  let pendingEvents = new Map();
  let frame = 0;
  const world = {
    __nexusClock: { frame: 0, delta: 0, elapsed: 0 },
    getResource(resource) { return resources.get(resource.id ?? resource); },
    setResource(resource, value) { resources.set(resource.id ?? resource, value); },
    emit(event, payload = {}) {
      const id = event.id ?? event;
      const list = pendingEvents.get(id) ?? [];
      list.push(payload);
      pendingEvents.set(id, list);
    },
    readEvents(event) { return pendingEvents.get(event.id ?? event) ?? []; }
  };
  const engine = {};
  for (const kit of kits) kit.initWorld?.({ world, engine });
  for (const kit of kits) kit.install?.({ world, engine });
  return {
    engine,
    tick(delta = 1 / 60) {
      frame += 1;
      world.__nexusClock = { frame, delta, elapsed: world.__nexusClock.elapsed + delta };
      for (const kit of kits) for (const entry of kit.systems ?? []) entry.system(world);
      pendingEvents = new Map();
    }
  };
}

const NexusEngine = createMiniNexus();
const kits = [
  createFluidFieldKit(NexusEngine),
  createFluidMotionKit(NexusEngine),
  createFluidShadingKit(NexusEngine),
  createFluidEffectsKit(NexusEngine),
  createWaterDataKit(NexusEngine),
  createWaterStreamKit(NexusEngine),
  createWaterSurfaceKit(NexusEngine),
  createWaterMeshKit(NexusEngine),
  createWaterShadingKit(NexusEngine),
  createWaterPhysicsKit(NexusEngine),
  createWaterBehaviorKit(NexusEngine),
  createWaterEffectsKit(NexusEngine),
  createWaterAudioKit(NexusEngine),
  createWaterModeKit(NexusEngine)
];

assert.equal(kits.length, 14);
assert.ok(kits.every((kit) => kit.id.endsWith("-kit")));
assert.ok(kits.every((kit) => kit.id.split("-").length <= 3));

const { engine, tick } = createMiniEngine(kits);
assert.deepEqual(engine.waterMode.getStack().slice(0, 3), ["fluid-field-kit", "fluid-motion-kit", "fluid-shading-kit"]);

engine.waterStream.setFocus({ x: 12, z: -7 });
engine.waterSurface.disturb({ x: 0, z: 0 }, 4, 0.8);
engine.waterBehavior.enter({ actorId: "player", depth: 2.2 });
engine.waterEffects.splash({ position: { x: 0, z: 0 }, intensity: 1.2 });
engine.waterAudio.play("splash", { gain: 0.6 });

tick(1 / 30);

const surface = engine.waterSurface.sample({ x: 1.5, z: 0.25, depth: 3 });
assert.equal(typeof surface.height, "number");
assert.ok(surface.foam >= 0 && surface.foam <= 1);
assert.equal(engine.waterBehavior.getActor("player").mode, "swimming");
assert.ok(engine.waterStream.getActiveTiles().length > 0);
assert.ok(engine.waterEffects.getDescriptors().length > 0);
assert.ok(engine.waterAudio.getState().oneShots.length > 0);
assert.equal(engine.waterShading.getMaterial("clear-water").profileId, "clear-water");
assert.ok(engine.waterPhysics.sampleProbe({ x: 0, y: -0.2, z: 0 }).depth > -10);

console.log("fluid/water kit composition smoke passed");
