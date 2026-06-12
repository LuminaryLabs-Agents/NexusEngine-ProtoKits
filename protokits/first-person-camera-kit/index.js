import { clamp, wrapRadians, defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const FIRST_PERSON_CAMERA_KIT_VERSION = "0.0.1";

export function createFirstPersonCamera(options = {}) {
  return {
    x: options.x ?? 0,
    y: options.y ?? 0,
    z: options.z ?? 0,
    yaw: options.yaw ?? 0,
    pitch: options.pitch ?? 0,
    height: options.height ?? 0.72,
    radius: options.radius ?? 0.18,
    speed: options.speed ?? 2.8,
    sprintMultiplier: options.sprintMultiplier ?? 1.45,
    lookSensitivity: options.lookSensitivity ?? 0.0025,
    minPitch: options.minPitch ?? -1.2,
    maxPitch: options.maxPitch ?? 1.2
  };
}

export function cameraForward(camera) {
  return { x: Math.cos(camera.yaw), y: Math.sin(camera.yaw) };
}

export function cameraRight(camera) {
  return { x: Math.cos(camera.yaw + Math.PI / 2), y: Math.sin(camera.yaw + Math.PI / 2) };
}

export function applyLook(camera, look = {}, scale = 1) {
  camera.yaw = wrapRadians(camera.yaw + (look.x ?? 0) * camera.lookSensitivity * scale);
  camera.pitch = clamp(camera.pitch - (look.y ?? 0) * camera.lookSensitivity * scale, camera.minPitch, camera.maxPitch);
  return camera;
}

export function moveFirstPersonCamera(camera, movement = {}, delta = 1 / 60, collision = null) {
  const forward = cameraForward(camera);
  const right = cameraRight(camera);
  const speed = camera.speed * (movement.sprint ? camera.sprintMultiplier : 1);
  const mx = (forward.x * (movement.y ?? 0) + right.x * (movement.x ?? 0)) * speed * delta;
  const my = (forward.y * (movement.y ?? 0) + right.y * (movement.x ?? 0)) * speed * delta;
  const canMove = typeof collision === "function" ? collision : () => true;
  if (canMove(camera.x + mx, camera.y, camera)) camera.x += mx;
  if (canMove(camera.x, camera.y + my, camera)) camera.y += my;
  return camera;
}

export function updateFirstPersonCamera(camera, input, delta, collision = null) {
  const movement = input?.readMovement?.() ?? input?.movement ?? { x: 0, y: 0 };
  const look = input?.consumePointerDelta?.() ?? input?.look ?? { x: 0, y: 0 };
  applyLook(camera, look, 1);
  moveFirstPersonCamera(camera, movement, delta, collision);
  return camera;
}

export function createFirstPersonCameraKit(nexusRealtime = {}, options = {}) {
  const kit = { id: options.id ?? "first-person-camera-kit", version: FIRST_PERSON_CAMERA_KIT_VERSION, createFirstPersonCamera, cameraForward, cameraRight, applyLook, moveFirstPersonCamera, updateFirstPersonCamera };
  return Object.freeze({
    ...kit,
    createRuntimeKit(runtimeOptions = {}) {
      return defineInjectedRuntimeKit(nexusRealtime, {
        id: runtimeOptions.id ?? kit.id,
        provides: runtimeOptions.provides ?? ["camera:first-person", "camera:pointer-look"],
        requires: runtimeOptions.requires ?? [],
        bindings: { firstPersonCameraKit: kit },
        metadata: { version: FIRST_PERSON_CAMERA_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) }
      });
    }
  });
}
