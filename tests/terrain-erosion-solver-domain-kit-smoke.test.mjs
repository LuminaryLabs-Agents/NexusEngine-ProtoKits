import assert from "node:assert/strict";
import {
  createTerrainErosionSolverState,
  solveTerrainErosionAt,
  solveTerrainErosionField
} from "../protokits/terrain-erosion-solver-domain-kit/index.js";

const state = createTerrainErosionSolverState();
assert.equal(state.validation.solverOnly, true);
assert.equal(state.validation.doesNotAuthorTerrain, true);
assert.equal(state.validation.doesNotRenderMeshes, true);

const stableInput = {
  position: { x: 10, z: 20 },
  baseHeight: 120,
  localSlope: 0.8,
  curvature: 0.35,
  rainfall: 0.9,
  waterFlow: 0.7,
  soilHardness: 0.2,
  vegetationCover: 0.1,
  material: "soil",
  exposureTime: 1.2,
  upstreamArea: 3
};

const first = solveTerrainErosionAt(stableInput);
const second = solveTerrainErosionAt(stableInput);
assert.deepEqual(first, second);
assert.ok(first.heightDelta <= 0 || first.sedimentDelta > 0);
assert.ok(first.wetness >= 0 && first.wetness <= 1);
assert.ok(first.materialHints.wetSoil >= 0 && first.materialHints.wetSoil <= 1);

const rock = solveTerrainErosionAt({ ...stableInput, material: "rock", soilHardness: 0.9, vegetationCover: 0.8 });
assert.ok(Math.abs(rock.heightDelta) <= Math.abs(first.heightDelta));

const field = solveTerrainErosionField({
  fieldId: "radial-core",
  dt: 1,
  samples: [stableInput, { ...stableInput, position: { x: 40, z: 90 }, localSlope: 0.2 }]
});
assert.equal(field.fieldId, "radial-core");
assert.equal(field.samples.length, 2);
assert.equal(field.samples[0].id, "radial-core:sample:0");

console.log("terrain-erosion-solver-domain-kit smoke passed");
