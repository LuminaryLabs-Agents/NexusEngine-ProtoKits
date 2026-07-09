import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const FPS_MOTION_KIT_VERSION = "0.1.0";

export function createFpsMotionState(options = {}) {
  return { version: FPS_MOTION_KIT_VERSION, position: { x: number(options.position?.x, 0), y: number(options.position?.y, 2), z: number(options.position?.z, 0) }, velocity: { x: 0, y: 0, z: 0 }, yaw: number(options.yaw, 0), pitch: number(options.pitch, 0), sprinting: false, grounded: true, speed: 0, eyeHeight: number(options.eyeHeight, 1.86), walkDistance: 0, input: { moveX: 0, moveZ: 0, lookX: 0, lookY: 0, sprint: false }, tuning: { walkSpeed: number(options.walkSpeed, 5.6), sprintSpeed: number(options.sprintSpeed, 10.5), acceleration: number(options.acceleration, 16), lookSensitivityX: number(options.lookSensitivityX, 0.0022), lookSensitivityY: number(options.lookSensitivityY, 0.0018), groundFollowRate: number(options.groundFollowRate, 16) } };
}

export function stepFpsMotion(state = createFpsMotionState(), input = {}, dt = 1 / 60, terrain = null) {
  const next = clone(state);
  const d = Math.max(0, number(dt, 0));
  const t = next.tuning;
  const intent = { ...next.input, ...input };
  next.input = intent;
  next.yaw -= number(intent.lookX, 0) * t.lookSensitivityX;
  next.pitch = clamp(next.pitch - number(intent.lookY, 0) * t.lookSensitivityY, -1.35, 1.35);
  const forward = { x: Math.sin(next.yaw), z: -Math.cos(next.yaw) };
  const right = { x: Math.cos(next.yaw), z: Math.sin(next.yaw) };
  let wx = forward.x * number(intent.moveZ, 0) + right.x * number(intent.moveX, 0);
  let wz = forward.z * number(intent.moveZ, 0) + right.z * number(intent.moveX, 0);
  const wl = Math.hypot(wx, wz) || 1;
  if (wl > 1) { wx /= wl; wz /= wl; }
  next.sprinting = Boolean(intent.sprint);
  const targetSpeed = next.sprinting ? t.sprintSpeed : t.walkSpeed;
  const blend = 1 - Math.exp(-t.acceleration * d);
  next.velocity.x += (wx * targetSpeed - next.velocity.x) * blend;
  next.velocity.z += (wz * targetSpeed - next.velocity.z) * blend;
  next.position.x += next.velocity.x * d;
  next.position.z += next.velocity.z * d;
  const ground = typeof terrain?.getHeight === "function" ? number(terrain.getHeight(next.position.x, next.position.z), 0) : 0;
  next.position.y += (ground + next.eyeHeight - next.position.y) * (1 - Math.exp(-t.groundFollowRate * d));
  next.grounded = true;
  next.speed = Math.hypot(next.velocity.x, next.velocity.z);
  next.walkDistance += next.speed * d;
  return next;
}

export function createFpsMotionKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const FpsMotionState = resource(options.resourceName ?? "fpsMotion.state");
  const FpsMotionUpdated = event("fpsMotion.updated");
  const initial = () => createFpsMotionState(options);
  return defineInjectedRuntimeKit(nexusEngine, { id: options.id ?? "fps-motion-kit", resources: { FpsMotionState }, events: { FpsMotionUpdated }, requires: ["terrain:sampler", "input:actions"], provides: ["fps:motion", "player:pose", "camera:fps-pose"], initWorld({ world }) { ensureResource(world, FpsMotionState, initial); }, install({ engine, world }) { const state = () => ensureResource(world, FpsMotionState, initial); const api = { getState: state, setPose(pose = {}) { const next = { ...state(), ...pose, position: { ...state().position, ...(pose.position ?? {}) }, velocity: { ...state().velocity, ...(pose.velocity ?? {}) } }; world.setResource(FpsMotionState, next); world.emit?.(FpsMotionUpdated, { state: clone(next) }); return clone(next); }, setInput(input = {}) { const next = { ...state(), input: { ...state().input, ...input } }; world.setResource(FpsMotionState, next); return clone(next); }, step(input = state().input, dt = number(world?.__nexusClock?.delta, 1 / 60)) { const next = stepFpsMotion(state(), input, dt, engine.terrainSampler); world.setResource(FpsMotionState, next); world.emit?.(FpsMotionUpdated, { state: clone(next) }); return clone(next); }, snapshot: () => clone(state()) }; engine.fpsMotion = api; engine.n ??= {}; engine.n.fpsMotion = api; }, metadata: { version: FPS_MOTION_KIT_VERSION, purpose: "Renderer-agnostic first-person motion and camera pose descriptors." } });
}

export default createFpsMotionKit;
