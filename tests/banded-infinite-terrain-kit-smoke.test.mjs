import assert from "node:assert/strict";
import {
  advanceBandedTerrainState,
  createBandedTerrainRenderContract,
  createBandedTerrainState,
  sampleBandedTerrainDensity,
  validateBandedTerrainContract
} from "../protokits/banded-infinite-terrain-kit/index.js";

const initial = createBandedTerrainState({ camera: { x: 0.19, z: 0.22 }, snapSize: 4 });
assert.equal(initial.topology.kind, "single-fixed-radial-surface");
assert.equal(initial.topology.noSquarePatchLod, true);
assert.equal(initial.topology.noCameraMoveRebuild, true);
assert.equal(initial.validation.noRawCameraFloatSampling, true);
assert.deepEqual(initial.origin.snapped, { x: 0, z: 0 });

const movedInsideSnap = advanceBandedTerrainState(initial, {
  dt: 1 / 60,
  camera: { x: 1.9, z: 2.1 },
  cameraForward: { x: 0, z: 1 }
});
assert.deepEqual(movedInsideSnap.origin.snapped, { x: 0, z: 0 });
assert.equal(movedInsideSnap.origin.changed, false);
assert.equal(movedInsideSnap.origin.fractionalOffset.x, 1.9);

const movedAcrossSnap = advanceBandedTerrainState(movedInsideSnap, {
  dt: 1 / 60,
  camera: { x: 4.2, z: 8.3 },
  cameraForward: { x: 1, z: 0 }
});
assert.deepEqual(movedAcrossSnap.origin.snapped, { x: 4, z: 8 });
assert.equal(movedAcrossSnap.origin.changed, true);
assert.equal(movedAcrossSnap.origin.rebaseCount, 1);
assert.deepEqual(movedAcrossSnap.origin.previous, { x: 0, z: 0 });

const density = sampleBandedTerrainDensity(movedAcrossSnap, { x: 20, z: 8 });
assert.ok(["focus", "safety", "peripheral", "horizon"].includes(density.band));
assert.ok(density.density >= 0 && density.density <= 1);

const contract = createBandedTerrainRenderContract(movedAcrossSnap);
assert.deepEqual(contract.uniforms.terrainOriginSnapped, { x: 4, z: 8 });
assert.equal(contract.constraints.shaderOwnsDisplacement, true);
assert.equal(contract.constraints.noRawCameraFloatSampling, true);
assert.equal(validateBandedTerrainContract(contract).passed, true);

console.log("banded-infinite-terrain-kit smoke passed");
