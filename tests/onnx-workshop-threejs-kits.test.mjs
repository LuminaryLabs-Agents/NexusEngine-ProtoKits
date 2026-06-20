import assert from "node:assert/strict";

import {
  createOnnxWorkshopThreeJsKits,
  createWoundBoxMesh,
  createRingTubeMesh,
  createHelixRibbonMesh,
  createGearDiscMesh
} from "../protokits/onnx-workshop-threejs-kits/index.js";

function createNexusStub() {
  return {
    defineResource(name) { return { kind: "resource", name }; },
    defineEvent(name) { return { kind: "event", name }; },
    defineRuntimeKit(definition) { return definition; }
  };
}

function install(kits) {
  const resources = new Map();
  const events = [];
  const world = {
    __nexusClock: { frame: 1, elapsed: 0, delta: 1 / 60 },
    getResource(resource) { return resources.get(resource); },
    setResource(resource, value) { resources.set(resource, value); },
    emit(event, payload) { events.push({ event: event.name, payload }); },
    readEvents(event) { return events.filter((entry) => entry.event === event.name).map((entry) => entry.payload); }
  };
  const engine = {};
  for (const kit of kits) kit.initWorld?.({ world, engine });
  for (const kit of kits) kit.install?.({ world, engine });
  return { engine, world, events };
}

assert.equal(createWoundBoxMesh().primitive, false);
assert.ok(createWoundBoxMesh().indices.length >= 36);
assert.equal(createRingTubeMesh().primitive, false);
assert.ok(createRingTubeMesh().vertices.length > 8);
assert.equal(createHelixRibbonMesh().primitive, false);
assert.ok(createHelixRibbonMesh().indices.length > 40);
assert.equal(createGearDiscMesh().primitive, false);
assert.ok(createGearDiscMesh().vertices.length > 20);

const kits = createOnnxWorkshopThreeJsKits(createNexusStub());
assert.ok(kits.some((kit) => kit.id === "onnx-workshop-scene-domain-kit"));
assert.ok(kits.some((kit) => kit.id === "workshop-object-review-domain-kit"));
assert.ok(kits.some((kit) => kit.id === "workshop-companion-vision-domain-kit"));
assert.ok(kits.some((kit) => kit.id === "workshop-signal-flow-domain-kit"));
assert.ok(kits.some((kit) => kit.id === "workshop-three-render-plan-domain-kit"));

const { engine } = install(kits);
const objects = engine.onnxWorkshopScene.listObjects();
assert.ok(objects.length >= 12);
assert.ok(engine.onnxWorkshopScene.getObject("hammer"));
assert.ok(engine.onnxWorkshopScene.getObject("onnx-core"));

const review = engine.workshopReview.enter("hammer");
assert.equal(review.selectedObjectId, "hammer");
assert.equal(review.mode, "review");
assert.ok(review.reviewTokens.some((token) => token.action === "what-is-this"));

engine.workshopReview.updateMotion(0.5);
const movedHammer = engine.onnxWorkshopScene.getObject("hammer");
assert.equal(movedHammer.state, "reviewing");
assert.notDeepEqual(movedHammer.currentTransform.position, movedHammer.spawnTransform.position);

const answer = engine.companionVision.inspectSelected("what is this?");
assert.equal(answer.inspection.objectId, "hammer");
assert.match(answer.answer.text, /impact/i);

const connection = engine.workshopSignalFlow.connect("hammer", "force-gauge");
assert.equal(connection.compatible, true);
const packet = engine.workshopSignalFlow.startPacket(connection.id, { kind: "review-data" });
assert.equal(packet.status, "moving");
engine.workshopSignalFlow.updatePackets(2);
assert.equal(engine.workshopSignalFlow.getState().packets[0].status, "complete");

const plan = engine.workshopThreePlan.buildPlan();
assert.equal(plan.camera.mode, "first-person");
assert.ok(plan.objects.some((object) => object.id === "hammer"));
assert.ok(plan.reviewTokens.length > 0);
assert.equal(plan.meshLibrary.box.primitive, false);
assert.equal(plan.meshLibrary.tube.primitive, false);

engine.workshopReview.exit({ reason: "click-away" });
engine.workshopReview.updateMotion(1);
const returned = engine.onnxWorkshopScene.getObject("hammer");
assert.equal(returned.state, "idle");
assert.deepEqual(returned.currentTransform.position, returned.spawnTransform.position);

console.log("onnx-workshop-threejs-kits.test.mjs passed");
