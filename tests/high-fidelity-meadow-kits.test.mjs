import assert from "node:assert/strict";
import {
  createCreatureDomainServiceKit,
  createCreatureProceduralBodyKit,
  createFurWoolHairDomainServiceKit,
  createGrassFieldSystemKit,
  createHighFidelityMeadowKits,
  createMeadowSimulationModeKit,
  createMeadowVisualTargetKit,
  createParticleVfxDomainServiceKit,
  createProceduralMeshSynthesisKit,
  createProceduralStructureDomainServiceKit,
  createResourceLifetimeRuntimeKit,
  createTerrainFieldDomainServiceKit,
  createTypedArrayStoreRuntimeKit,
  createWindFieldDomainServiceKit
} from "../protokits/high-fidelity-meadow-kits/index.js";

const lifetime = createResourceLifetimeRuntimeKit({}, {});
const resource = lifetime.allocate({ type: "geometry", bytes: 4096 });
assert.equal(lifetime.getStats().active, 1);
lifetime.release(resource.id);
assert.equal(lifetime.getStats().queued, 1);
lifetime.disposeQueued();
assert.equal(lifetime.getStats().disposed, 1);

const store = createTypedArrayStoreRuntimeKit({}, {});
const buffer = store.createBuffer({ type: "f32", length: 16, stride: 4 });
store.write(buffer.id, 4, [1, 2, 3, 4]);
assert.deepEqual(store.getBuffer(buffer.id).dirtyRanges, [{ start: 4, end: 8 }]);
assert.equal(store.getStats().dirtyBuffers, 1);

const terrain = createTerrainFieldDomainServiceKit({}, { seed: "test-meadow", foundationMasks: [{ center: { x: 0, z: 0 }, radius: 4, height: 0 }] });
assert.equal(terrain.heightAt(0, 0), 0);
assert.equal(terrain.normalAt(1, 1).y > 0.5, true);
assert.equal(terrain.maskAt(0, 0).grassDensity < terrain.maskAt(12, 12).grassDensity, true);
assert.ok(terrain.createRuntimeKit().provides.includes("terrain:height-sampler"));

const wind = createWindFieldDomainServiceKit({}, { seed: "test-wind", baseStrength: 1 });
const windSample = wind.sampleWind({ x: 2, y: 0, z: 3 }, 1.25);
assert.equal(windSample.strength > 0, true);

const grass = createGrassFieldSystemKit({}, { density: 1.2, maxInstancesPerChunk: 300 });
const chunk = terrain.createChunkDescriptor(0, 0);
const grassInstances = grass.generateChunkInstances(chunk, { terrain, camera: { x: 0, z: 0 } });
assert.equal(grassInstances.attributes instanceof Float32Array, true);
assert.equal(grassInstances.count > 0, true);
assert.equal(grass.createRenderBatchDescriptor(grassInstances).windReactive, true);

const structures = createProceduralStructureDomainServiceKit({}, {});
const cottage = structures.createStructureDescriptor({ id: "test-cottage" });
assert.ok(cottage.anchors.chimneyTop.y > cottage.wallHeight);
const meshKit = createProceduralMeshSynthesisKit({}, {});
const cottageMesh = meshKit.buildStructureMesh(cottage);
assert.equal(cottageMesh.indices.length % 3, 0);
assert.equal(cottageMesh.triangleCount > 20, true);

const particles = createParticleVfxDomainServiceKit({}, { capacity: 128 });
const pool = particles.createParticlePool(128);
const emitter = particles.createEmitter({ position: cottage.anchors.chimneyTop, rate: 24 });
particles.stepPool(pool, [emitter], 0.5, { wind, time: 0.5 });
assert.equal(pool.aliveCount > 0, true);
assert.equal(particles.createBatchDescriptor(pool).softParticles, true);

const creatureDomain = createCreatureDomainServiceKit({}, { seed: "test-herd" });
const herd = creatureDomain.createHerd(3);
assert.equal(herd.length, 3);
const bodyKit = createCreatureProceduralBodyKit({}, { triangleCount: 320 });
const creatureMesh = bodyKit.buildLivestockMesh({ id: "test-sheep" });
assert.equal(creatureMesh.positions instanceof Float32Array, true);
assert.equal(creatureMesh.triangleCount > 250, true);

const fur = createFurWoolHairDomainServiceKit({}, { shellCount: 6 });
const groom = fur.createGroomDescriptor(creatureMesh);
assert.equal(fur.createShellDescriptors(groom, "near").length, 6);
assert.equal(fur.createShellDescriptors(groom, "mid").length, 2);

const mode = createMeadowSimulationModeKit({}, { livestockCount: 2, smokeCapacity: 64, maxGrassInstancesPerChunk: 200 });
const scene = mode.buildScene();
assert.ok(scene.kitStack.includes("grass-field-system-kit"));
assert.equal(scene.structures.mesh.triangleCount > 20, true);
assert.equal(scene.creatures.herd.length, 2);
assert.equal(scene.sky.shaderModel, "webgl-procedural-skybox");

const visualTarget = createMeadowVisualTargetKit({}, { seed: "test-target" });
const targetDescriptor = visualTarget.createTargetDescriptor();
assert.equal(targetDescriptor.type, "visual-target-composition");
assert.ok(targetDescriptor.path.points.length >= 4);
assert.ok(targetDescriptor.treeLine.trees.length >= 4);
assert.ok(targetDescriptor.focus.focalFeatures.includes("player-silhouette"));
assert.equal(visualTarget.validateSceneDescriptor({ ...scene, visualTarget: targetDescriptor, flowers: { flowers: [{ id: "flower" }] } }).passed, true);

const bundle = createHighFidelityMeadowKits({}, { meadowContent: { livestockCount: 1 } });
assert.ok(bundle.meadowSimulationMode.kitStack.includes("fur-wool-hair-domain-service-kit"));
assert.ok(bundle.meadowVisualTarget.provides.includes("visual:target-composition"));

console.log("High-fidelity meadow ProtoKits passed.");
