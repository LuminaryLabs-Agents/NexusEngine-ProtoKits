import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const CAMERA_SHAKE_KIT_VERSION = "0.1.0";

export function createCameraShakeState(options = {}) {
  return { version: CAMERA_SHAKE_KIT_VERSION, amount: 0, decay: number(options.decay, 8), impulses: [], walkScale: number(options.walkScale, 0.035), sprintScale: number(options.sprintScale, 0.062) };
}

export function stepCameraShake(state = createCameraShakeState(), dt = 1 / 60) {
  const next = clone(state);
  next.amount *= Math.exp(-Math.max(0, next.decay) * Math.max(0, number(dt, 0)));
  next.impulses = next.impulses.map((impulse) => ({ ...impulse, age: number(impulse.age, 0) + number(dt, 0), amount: number(impulse.amount, 0) * Math.exp(-Math.max(0, number(impulse.decay, next.decay)) * number(dt, 0)) })).filter((impulse) => impulse.amount > 0.0001 && impulse.age < number(impulse.duration, 2));
  next.amount = Math.max(next.amount, ...next.impulses.map((impulse) => impulse.amount), 0);
  return next;
}

export function getCameraShakeOffset(state = createCameraShakeState(), time = 0) {
  const amount = number(state.amount, 0);
  return { positionOffset: { x: Math.sin(time * 37) * amount * 0.08, y: Math.sin(time * 29) * amount * 0.05, z: 0 }, rotationOffset: { x: Math.sin(time * 23) * amount * 0.015, y: Math.sin(time * 19) * amount * 0.012, z: Math.sin(time * 31) * amount * 0.01 }, amount };
}

export function createCameraShakeKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const CameraShakeState = resource(options.resourceName ?? "cameraShake.state");
  const CameraShakeUpdated = event("cameraShake.updated");
  const CameraShakeImpulse = event("cameraShake.impulse");
  const initial = () => createCameraShakeState(options);
  return defineInjectedRuntimeKit(nexusEngine, { id: options.id ?? "camera-shake-kit", resources: { CameraShakeState }, events: { CameraShakeUpdated, CameraShakeImpulse }, provides: ["camera:shake", "camera:shake-descriptor"], initWorld({ world }) { ensureResource(world, CameraShakeState, initial); }, install({ engine, world }) { const state = () => ensureResource(world, CameraShakeState, initial); const api = { getState: state, impulse(amount = 0.05, payload = {}) { const next = { ...state(), amount: Math.max(state().amount, number(amount, 0)), impulses: [...state().impulses, { amount: number(amount, 0), age: 0, decay: number(payload.decay, state().decay), duration: number(payload.duration, 2), source: payload.source ?? "impulse" }].slice(-16) }; world.setResource(CameraShakeState, next); world.emit?.(CameraShakeImpulse, { amount, payload }); world.emit?.(CameraShakeUpdated, { state: clone(next) }); return clone(next); }, step(dt = number(world?.__nexusClock?.delta, 1 / 60)) { const next = stepCameraShake(state(), dt); world.setResource(CameraShakeState, next); world.emit?.(CameraShakeUpdated, { state: clone(next) }); return clone(next); }, getOffset(time = number(world?.__nexusClock?.elapsed, 0)) { return getCameraShakeOffset(state(), time); }, snapshot: () => clone(state()) }; engine.cameraShake = api; engine.n ??= {}; engine.n.cameraShake = api; }, metadata: { version: CAMERA_SHAKE_KIT_VERSION, purpose: "Deterministic camera shake impulse and offset descriptors." } });
}

export default createCameraShakeKit;
