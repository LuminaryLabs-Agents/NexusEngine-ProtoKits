import assert from "node:assert/strict";
import {
  basisFromForwardUp,
  computeStereoscopicRenderSnapshot,
  createStereoscopicRenderState
} from "../protokits/stereoscopic-render-domain-kit/index.js";

const initial = createStereoscopicRenderState({
  interpupillaryDistance: 0.064,
  convergenceDistance: 8,
  textureLayout: "side-by-side",
  viewportLayout: "side-by-side"
});

const snapshot = computeStereoscopicRenderSnapshot(initial, {
  position: { x: 0, y: 1.7, z: 0 },
  forward: { x: 0, y: 0, z: -1 },
  up: { x: 0, y: 1, z: 0 },
  fovDegrees: 72,
  aspect: 1.1,
  near: 0.04,
  far: 500
}, 1 / 72);

assert.equal(snapshot.status, "stereo-ready");
assert.equal(snapshot.views.length, 2);
assert.equal(snapshot.eyes.left.eye, "left");
assert.equal(snapshot.eyes.right.eye, "right");
assert.equal(snapshot.eyes.left.position.x, -0.032);
assert.equal(snapshot.eyes.right.position.x, 0.032);
assert.equal(snapshot.metadata.eyeSeparationMeters.toFixed(3), "0.064");
assert.equal(snapshot.eyes.left.orientation.forward.z, -1);
assert.equal(snapshot.eyes.right.orientation.forward.z, -1);
assert.equal(snapshot.eyes.left.viewport.width, 0.5);
assert.equal(snapshot.eyes.right.viewport.x, 0.5);
assert.equal(snapshot.eyes.left.renderTarget.layer, 0);
assert.equal(snapshot.eyes.right.renderTarget.layer, 1);
assert.ok(snapshot.eyes.left.projection.centerOffsetX > 0, "left eye should shift projection center right for off-axis stereo");
assert.ok(snapshot.eyes.right.projection.centerOffsetX < 0, "right eye should shift projection center left for off-axis stereo");

const yawed = computeStereoscopicRenderSnapshot(snapshot, {
  position: { x: 10, y: 2, z: -4 },
  forward: { x: 1, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 }
}, 1 / 60);
assert.equal(yawed.eyes.left.position.z.toFixed(3), "-4.032");
assert.equal(yawed.eyes.right.position.z.toFixed(3), "-3.968");

const basis = basisFromForwardUp({ x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 });
assert.deepEqual(basis.right, { x: 1, y: -0, z: 0 });

console.log("Stereoscopic render domain kit smoke passed.");
