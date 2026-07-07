import assert from "node:assert/strict";
import { generateLayeredDrunkWalkLevel } from "../protokits/layered-drunk-walk-level-generation-kit/index.js";

const request = {
  id: "stonewake-smoke",
  seed: "stonewake-smoke-001",
  bounds: { width: 4200, height: 920, margin: 80 },
  targets: {
    focusPoints: 4,
    platforms: 18,
    recoveryPlatforms: 4,
    chains: 5,
    heavyBlocks: 1,
    weightedTriggers: 1,
    valves: 1,
    finishGates: 1,
    creatures: 1,
    waterZones: 1,
    torches: 9,
    wallMarks: 12,
    reactiveEffectAnchors: 35
  }
};

const first = generateLayeredDrunkWalkLevel(request);
const second = generateLayeredDrunkWalkLevel(request);

assert.deepEqual(first.focusPath, second.focusPath);
assert.equal(first.bounds.width, 4200);
assert.equal(first.focusPath.points.length, 6);
assert.ok(first.platforms.length >= 12);
assert.ok(first.objects.some((object) => object.type === "heavy-block"));
assert.ok(first.objects.some((object) => object.type === "weighted-trigger"));
assert.ok(first.objects.some((object) => object.type === "valve"));
assert.ok(first.objects.some((object) => object.type === "finish-gate"));
assert.ok(first.hazards.some((hazard) => hazard.type === "rising-water"));
assert.ok(["pass", "pass-with-warning"].includes(first.validation.status));

console.log("level generation kit smoke passed");
