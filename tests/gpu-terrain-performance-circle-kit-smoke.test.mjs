import assert from "node:assert/strict";
import {
  createGpuTerrainDrawPlan,
  createGpuTerrainPerformanceCircleKit,
  createTerrainDensityPolicy,
  validateGpuTerrainPlan
} from "../protokits/gpu-terrain-performance-circle-kit/index.js";

function createWorld() {
  const resources = new Map();
  const events = new Map();
  return {
    setResource(key, value) { resources.set(key, value); },
    getResource(key) { return resources.get(key); },
    emit(key, value) {
      if (!events.has(key)) events.set(key, []);
      events.get(key).push(value);
    },
    readEvents(key) {
      const out = events.get(key) ?? [];
      events.set(key, []);
      return out;
    }
  };
}

const policy = createTerrainDensityPolicy();
const front = policy.scoreAt(
  { x: 64, z: 0 },
  { player: { x: 0, z: 0 }, camera: { x: 0, z: 0 }, forward: { x: 1, z: 0 } }
);
const behind = policy.scoreAt(
  { x: -64, z: 0 },
  { player: { x: 0, z: 0 }, camera: { x: 0, z: 0 }, forward: { x: 1, z: 0 } }
);
const far = policy.scoreAt(
  { x: 850, z: 0 },
  { player: { x: 0, z: 0 }, camera: { x: 0, z: 0 }, forward: { x: 1, z: 0 } }
);

assert(front.score > behind.score, "view cone should increase density in front of the camera");
assert(front.score > far.score, "near/front terrain should score denser than horizon terrain");

const plan = createGpuTerrainDrawPlan({}, { brush: { x: 12, z: 0, radius: 8 } });
assert.equal(plan.topology.strategy, "fixed-radial-performance-circle");
assert.equal(plan.topology.meshCount, 1);
assert.equal(plan.performance.cpuGeometryRebuild, false);
assert.equal(plan.performance.squarePatchLod, false);
assert.equal(plan.dirtyRegions.length, 1);
assert.equal(validateGpuTerrainPlan(plan).passed, true);

const kit = createGpuTerrainPerformanceCircleKit();
const world = createWorld();
const engine = {};
kit.initWorld({ world });
kit.install({ engine, world });

const next = engine.gpuTerrainPerformanceCircle.updateFrame({
  player: { x: 0, z: 0 },
  camera: { x: 0, z: 0 },
  forward: { x: 1, z: 0 },
  brush: { x: 20, z: 0, radius: 10 },
  speed: 12
});

assert.equal(next.drawPlan.performance.stableGpuBuffers, true);
assert.equal(engine.gpuTerrainPerformanceCircle.runSmoke().passed, true);

console.log("gpu-terrain-performance-circle-kit smoke passed");
