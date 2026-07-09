import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as NexusEngine from "nexusengine";
import { createGenericAnchorDescriptorKit } from "../../generic-anchor-descriptor-kit/index.js";
import { createSpatialSurfaceCandidateDomainKit } from "../../spatial-surface-candidate-domain-kit/index.js";
import {
  createSurfaceObservationFromWebXRHit,
  createWebXRHitTestAdapterDomainKit,
  normalizeWebXRHitTestPose
} from "../index.js";

const HALF_SQRT = Math.sqrt(0.5);
const WALL_POSE = Object.freeze({
  matrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0.1, 1.2, -1.5, 1],
  position: { x: 0.1, y: 1.2, z: -1.5 },
  orientation: { x: HALF_SQRT, y: 0, z: 0, w: HALF_SQRT }
});

function rawResult(pose = WALL_POSE) {
  return {
    getPose() {
      return {
        transform: {
          matrix: pose.matrix,
          position: pose.position,
          orientation: pose.orientation
        }
      };
    }
  };
}

function createFrame(results) {
  return { getHitTestResults() { return results; } };
}

function runScenario() {
  const engine = NexusEngine.createEngine({
    kits: [
      createSpatialSurfaceCandidateDomainKit(NexusEngine, {
        stableFramesRequired: 3,
        minConfidence: 0.7,
        preferredOrientations: ["vertical", "horizontal-up"]
      }),
      createWebXRHitTestAdapterDomainKit(NexusEngine, { maxResultsPerFrame: 2 }),
      createGenericAnchorDescriptorKit(NexusEngine)
    ]
  });

  const direct = engine.n.webxrHitTestAdapter.observePose(WALL_POSE, { id: "wall-main", confidence: 0.94 });
  assert.equal(direct.accepted, true);
  assert.equal(direct.observation.normal.z > 0.999, true);

  const frame = createFrame([rawResult(), rawResult(), rawResult()]);
  const firstFrame = engine.n.webxrHitTestAdapter.observeFrame(frame, {}, {}, { surfaceId: "wall-main", confidence: 0.94 });
  assert.equal(firstFrame.processedCount, 2, "host result processing respects its performance cap");
  assert.deepEqual(firstFrame.results.map((entry) => entry.observation.id), ["wall-main", "webxr-hit-1"], "surfaceId applies only to the first hit");
  const secondFrame = engine.n.webxrHitTestAdapter.observeFrame(createFrame([rawResult()]), {}, {}, { surfaceId: "wall-main", confidence: 0.94 });
  assert.equal(secondFrame.acceptedCount, 1);

  const selection = engine.n.spatialSurfaceCandidate.select("wall-main");
  assert.equal(selection.accepted, true);
  assert.equal(selection.descriptor.orientation, "vertical");

  engine.n.anchorDescriptors.addAnchor({
    ...selection.descriptor,
    groupId: "wall-placement",
    tags: ["surface-anchor", "wall"]
  }, { reason: "surface-selected" });
  engine.tick(1 / 60);
  assert.equal(engine.n.anchorDescriptors.getAnchor("wall-main").normal.z > 0.999, true);
  assert.equal(engine.anchorDescriptors, engine.n.anchorDescriptors, "legacy anchor alias preserves the existing host surface");

  return {
    engine,
    snapshot: {
      adapter: engine.n.webxrHitTestAdapter.getSnapshot(),
      candidates: engine.n.spatialSurfaceCandidate.getSnapshot(),
      anchors: engine.n.anchorDescriptors.getSnapshot()
    }
  };
}

const normalized = normalizeWebXRHitTestPose(WALL_POSE);
assert.equal(normalized.normal.z > 0.999, true, "WebXR local positive Y rotates into the wall normal");
const matrixOnly = normalizeWebXRHitTestPose({ matrix: WALL_POSE.matrix });
assert.equal(matrixOnly.normal.z > 0.999, true, "matrix-only host poses preserve the surface normal");
assert.equal(createSurfaceObservationFromWebXRHit(WALL_POSE, { id: "wall" }).id, "wall");
assert.throws(() => normalizeWebXRHitTestPose({ position: {}, orientation: {} }), /finite|non-zero/);

const first = runScenario();
const second = runScenario();
assert.deepEqual(second.snapshot, first.snapshot, "same host observations replay to identical composed snapshots");

const adapterSnapshot = first.snapshot.adapter;
first.engine.n.webxrHitTestAdapter.reset({ reason: "test" });
assert.equal(first.engine.n.webxrHitTestAdapter.getSnapshot().acceptedCount, 0);
first.engine.n.webxrHitTestAdapter.loadSnapshot(adapterSnapshot);
assert.deepEqual(first.engine.n.webxrHitTestAdapter.getSnapshot(), adapterSnapshot);

const anchorSnapshot = first.snapshot.anchors;
first.engine.n.anchorDescriptors.reset({ reason: "test" });
assert.equal(first.engine.n.anchorDescriptors.getAnchors().length, 0);
first.engine.n.anchorDescriptors.loadSnapshot(anchorSnapshot);
assert.deepEqual(first.engine.n.anchorDescriptors.getSnapshot(), anchorSnapshot);

const empty = first.engine.n.webxrHitTestAdapter.observeFrame(createFrame([]), {}, {});
assert.equal(empty.reason, "no-hit-test-results");
const invalid = first.engine.n.webxrHitTestAdapter.observeFrame({}, {}, {});
assert.equal(invalid.reason, "invalid-xr-frame");

for (const relative of ["../index.js", "../../generic-anchor-descriptor-kit/index.js", "../../spatial-surface-candidate-domain-kit/index.js"]) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  for (const forbidden of ["document.", "window.", "requestAnimationFrame", "Date.now", "Math.random", "new THREE", "getContext("]) {
    assert.equal(source.includes(forbidden), false, `${relative} excludes ${forbidden}`);
  }
}

console.log("webxr-hit-test-adapter-domain-kit: ok");
