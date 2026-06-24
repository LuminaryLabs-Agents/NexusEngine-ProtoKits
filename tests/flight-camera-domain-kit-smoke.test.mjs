import assert from "node:assert/strict";
import { computeFlightCameraSnapshot, createFlightCameraState, forwardFromRotation } from "../protokits/flight-camera-domain-kit/index.js";

const initial = createFlightCameraState({
  camera: {
    followDistance: 28,
    followHeight: 8.5,
    lookAhead: 34,
    verticalLookAhead: 8,
    positionLag: 0.08,
    targetLag: 0.1,
    headingLag: 0.07,
    velocityLeadWeight: 0.16,
    carveLookWeight: 0.12
  }
});

const motionA = {
  position: { x: 0, y: 200, z: 0 },
  velocity: { x: 0, y: 0, z: -90 },
  rotation: { pitch: 0, yaw: 0, roll: 0 },
  speed: 90,
  carve: { focusDirection: { x: 1, y: 0, z: 0 }, turnStrength: 1 }
};

const cameraA = computeFlightCameraSnapshot(initial, motionA, 1 / 60);
assert.equal(cameraA.initialized, true);
assert.ok(cameraA.position.z > 0, "camera should trail behind the bird instead of jumping ahead");
assert.ok(cameraA.lookAt.z < 0, "look target should remain in front of bird heading");
assert.ok(cameraA.lookDirection.x < 0.2, "carve focus should have low authority over the look direction");

const motionB = {
  ...motionA,
  position: { x: 12, y: 205, z: -40 },
  rotation: { pitch: 0.08, yaw: 0.35, roll: 0.2 },
  velocity: { x: -22, y: -4, z: -100 },
  speed: 104
};
const cameraB = computeFlightCameraSnapshot(cameraA, motionB, 1 / 60);
assert.ok(cameraB.position.x !== cameraA.position.x, "camera should update from motion");
assert.ok(cameraB.position.z > motionB.position.z, "camera should remain behind the bird after motion update");
assert.ok(cameraB.fov > cameraA.config.baseFov, "camera should add speed FOV");

const forward = forwardFromRotation({ pitch: 0, yaw: 0 });
assert.deepEqual(forward, { x: -0, y: 0, z: -1 });

console.log("Flight camera domain kit smoke passed.");
