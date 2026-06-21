import assert from "node:assert/strict";
import { sampleWindField } from "../protokits/wind-field-kit/index.js";
import { describeFoliageWind } from "../protokits/wind-response-kit/index.js";
import { createProceduralSkyboxDescriptor } from "../protokits/procedural-skybox-kit/index.js";
import { stepFpsMotion } from "../protokits/fps-motion-kit/index.js";

const windA = sampleWindField(1, 2, 3, 4);
const windB = sampleWindField(1, 2, 3, 4);
assert.deepEqual(windA, windB);
assert.equal(typeof describeFoliageWind({ kind: "grass" }, "clump", windA).bend, "number");
assert.ok(createProceduralSkyboxDescriptor().sunDirection);
assert.ok(stepFpsMotion(undefined, { moveZ: 1 }, 1 / 60).position.z < 0);
console.log("foliage-fps-domain-kits ok");
