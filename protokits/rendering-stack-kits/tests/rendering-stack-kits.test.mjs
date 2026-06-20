import assert from "node:assert/strict";

import {
  RENDERING_STACK_KIT_FACTORIES,
  RENDERING_STACK_KIT_ORDER,
  RENDERING_STACK_MANIFEST,
  createMeadowRenderingStackKits,
  createProceduralMeshKit,
  createRenderingStackKits,
  createTerrainFieldKit,
  createTerrainMeshKit,
  createTriangleWindingKit,
  createNormalTangentKit,
  createUvUnwrapKit,
  createThreeRenderAdapterKit
} from "../index.js";

assert.equal(RENDERING_STACK_KIT_ORDER.length, 53);
assert.equal(Object.keys(RENDERING_STACK_KIT_FACTORIES).length, RENDERING_STACK_KIT_ORDER.length);
assert.equal(RENDERING_STACK_MANIFEST.length, RENDERING_STACK_KIT_ORDER.length);

for (const factoryName of RENDERING_STACK_KIT_ORDER) {
  const factory = RENDERING_STACK_KIT_FACTORIES[factoryName];
  const api = factory();
  assert.equal(typeof api.createRuntimeKit, "function", `${factoryName} should expose createRuntimeKit`);
  const runtimeKit = api.createRuntimeKit();
  assert.ok(runtimeKit.id.endsWith("-kit"), `${factoryName} should return a kit id`);
  assert.ok(runtimeKit.provides.length >= 1, `${factoryName} should provide at least one capability`);
}

const meshKit = createProceduralMeshKit();
const plane = meshKit.createPlaneGrid({ width: 4, depth: 4, segments: 2 });
assert.equal(plane.vertexCount, 9);
assert.equal(plane.triangleCount, 8);
assert.equal(meshKit.validate(plane).ok, true);

const triangleWindingKit = createTriangleWindingKit();
const upwardQuad = triangleWindingKit.buildQuad(0, 1, 3, 4, "y-up");
assert.deepEqual(upwardQuad.slice(0, 3), [0, 3, 1]);

const normalKit = createNormalTangentKit();
const normals = normalKit.computeVertexNormals(plane.positions, plane.indices);
assert.equal(normals.length, plane.positions.length);
assert.ok(normals.some((value) => Math.abs(value) > 0));

const uvKit = createUvUnwrapKit();
const withUvs = uvKit.withPlanarUvs(plane, { scale: 0.5 });
assert.equal(withUvs.uvs.length, withUvs.vertexCount * 2);

const terrainField = createTerrainFieldKit(null, { seed: "test-meadow", amplitude: 2 });
const sample = terrainField.sample(2, 3);
assert.equal(typeof sample.y, "number");
assert.ok(Math.abs(sample.normal.y) > 0.1);

const terrainMeshKit = createTerrainMeshKit(null, { sampler: terrainField, width: 8, depth: 8, segments: 4 });
const terrainMesh = terrainMeshKit.createTerrainMesh();
assert.equal(terrainMesh.vertexCount, 25);
assert.equal(terrainMesh.triangleCount, 32);

const allRuntimeKits = createRenderingStackKits();
assert.equal(allRuntimeKits.length, RENDERING_STACK_KIT_ORDER.length);
assert.ok(allRuntimeKits.some((kit) => kit.id === "triangle-winding-kit"));
assert.ok(allRuntimeKits.some((kit) => kit.id === "three-render-adapter-kit"));

const meadowRuntimeKits = createMeadowRenderingStackKits();
assert.ok(meadowRuntimeKits.length < allRuntimeKits.length);
assert.ok(meadowRuntimeKits.some((kit) => kit.id === "terrain-mesh-kit"));
assert.ok(meadowRuntimeKits.some((kit) => kit.id === "three-render-adapter-kit"));

const threeAdapter = createThreeRenderAdapterKit();
const descriptor = threeAdapter.createAdapterDescriptor();
assert.equal(descriptor.backend, "three");
assert.equal(descriptor.capabilities.instancing, true);

console.log("rendering-stack-kits tests passed");
