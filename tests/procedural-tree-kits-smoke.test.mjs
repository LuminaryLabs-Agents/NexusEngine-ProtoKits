import assert from "node:assert/strict";
import {
  createProceduralTreeApi,
  createProceduralTreePbrFieldApi,
  createTreeAssetSnapshotApi,
  createTreeLodApi,
  generateTreeDescriptor,
  selectImpostorFrame,
  validatePbrFieldSet,
  validateTreeDescriptor,
  validateTreeLodDescriptor,
  weightsAtDistance
} from "../protokits/procedural-tree-kits/index.js";

const request = {
  id: "oak-1737",
  seed: "1737",
  preset: {
    species: "test-oak",
    morphology: {
      height: 12,
      levels: 3,
      branchCounts: [6, 3, 2, 1],
      leafDensity: 5
    },
    materials: {
      textureSize: 64
    }
  }
};

const first = generateTreeDescriptor(request);
const replay = generateTreeDescriptor(request);
const different = generateTreeDescriptor({
  ...request,
  id: "oak-1738",
  seed: "1738"
});

assert.equal(first.hash, replay.hash);
assert.notEqual(first.hash, different.hash);
assert.deepEqual(validateTreeDescriptor(first), { valid: true, errors: [] });
assert.equal(first.objectDescriptor.schema, "nexus-object-descriptor/1");
assert.equal(first.objectDescriptor.id, first.id);
assert.equal(first.objectDescriptor.objectType, "procedural-tree");
assert.deepEqual(first.objectDescriptor.pivot, first.bounds.center);
assert.equal(first.objectDescriptor.groundAnchor[1], first.bounds.min[1]);
assert.equal(first.objectDescriptor.capture.provider, "procedural-object-capture-profile-kit");

const branchIds = new Set(first.branches.map((branch) => branch.id));
for (const branch of first.branches) {
  if (branch.parentId !== null) assert.ok(branchIds.has(branch.parentId));
  assert.equal(branch.points.length, branch.radii.length);
}

const treeApi = createProceduralTreeApi();
treeApi.generate(request);
assert.equal(
  treeApi.getObjectDescriptor("oak-1737").contentHash,
  first.objectDescriptor.contentHash
);
const treeSnapshot = treeApi.getSnapshot();
treeApi.reset();
treeApi.loadSnapshot(treeSnapshot);
assert.equal(treeApi.get("oak-1737").hash, first.hash);

const pbrApi = createProceduralTreePbrFieldApi({ textureSize: 64 });
const pbr = pbrApi.generate(first);
assert.deepEqual(validatePbrFieldSet(pbr), { valid: true, errors: [] });

const lod = createTreeLodApi().register(first, {
  impostor: { frameSize: 128 }
});
assert.deepEqual(validateTreeLodDescriptor(lod), { valid: true, errors: [] });
for (const distance of [0, lod.distances.lod1, lod.distances.lod2, lod.distances.impostor, 10000]) {
  const weights = weightsAtDistance(lod, distance);
  assert.ok(Math.abs(weights.reduce((sum, value) => sum + value, 0) - 1) < 1e-8);
}
const frame = selectImpostorFrame(lod, [3, 2, 8]);
assert.ok(frame.frameIndex >= 0);

const snapshots = createTreeAssetSnapshotApi();
const asset = snapshots.package({
  id: "oak-asset",
  treeDescriptor: first,
  pbrFields: pbr,
  lodDescriptor: lod,
  render: {
    objectDescriptor: first.objectDescriptor
  }
});
assert.equal(asset.schema, "nexus-tree-asset/1");

console.log(JSON.stringify({
  ok: true,
  treeHash: first.hash,
  objectHash: first.objectDescriptor.contentHash,
  branches: first.stats.branchCount,
  leaves: first.stats.leafCount
}, null, 2));
