import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const FLIGHT_MOTION_KIT_VERSION = "0.1.0";

export const DEFAULT_FLIGHT_CONFIG = Object.freeze({
  gravity: 0.18,
  drag: 0.04,
  lift: 0.95,
  maxSpeed: 140,
  boostImpulse: 45,
  boostCooldown: 1.5,
  pitchSpeed: 1.8,
  rollSpeed: 2.2,
  yawFromRoll: 1.5,
  groundClearance: 12,
  stallSpeed: 8,
  minForwardSpeed: 15
});

export function createFlightState(options = {}) {
  return {
    version: FLIGHT_MOTION_KIT_VERSION,
    config: { ...DEFAULT_FLIGHT_CONFIG, ...(options.physics ?? options.config ?? {}) },
    actorId: options.actorId ?? "player",
    position: { x: 0, y: 180, z: 0 },
    velocity: { x: 0, y: -5, z: -45 },
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    speed: 45,
    onGround: false,
    boostCooldown: 0
  };
}

const add = (a, b, s = 1) => ({ x: number(a.x) + number(b.x) * s, y: number(a.y) + number(b.y) * s, z: number(a.z) + number(b.z) * s });
const len = (v) => Math.hypot(number(v.x), number(v.y), number(v.z));
const scale = (v, s) => ({ x: number(v.x) * s, y: number(v.y) * s, z: number(v.z) * s });
const norm = (v) => { const l = len(v) || 1; return scale(v, 1 / l); };

export function forwardFromRotation(rotation = {}) {
  const pitch = number(rotation.pitch);
  const yaw = number(rotation.yaw);
  return { x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) };
}

export function stepFlight(state = {}, input = {}, dt = 1 / 60, terrainSampler = null) {
  const next = clone(state);
  const cfg = { ...DEFAULT_FLIGHT_CONFIG, ...(next.config ?? {}) };
  const delta = clamp(dt, 0, 0.1);
  let pitchInput = 0;
  let rollInput = 0;
  if (input.pitchUp) pitchInput += 1;
  if (input.pitchDown) pitchInput -= 1;
  if (input.bankLeft) rollInput += 1;
  if (input.bankRight) rollInput -= 1;
  next.rotation.pitch = clamp(number(next.rotation.pitch) + pitchInput * cfg.pitchSpeed * delta, -1.4, 1.4);
  next.rotation.roll = clamp(number(next.rotation.roll) + rollInput * cfg.rollSpeed * delta, -1.2, 1.2);
  next.rotation.yaw = number(next.rotation.yaw) + next.rotation.roll * cfg.yawFromRoll * delta;
  if (!rollInput) next.rotation.roll *= Math.exp(-4.5 * delta);
  let velocity = clone(next.velocity);
  const forward = forwardFromRotation(next.rotation);
  if (next.boostCooldown > 0) next.boostCooldown = Math.max(0, next.boostCooldown - delta);
  if (input.boost && next.boostCooldown <= 0) { velocity = add(velocity, forward, cfg.boostImpulse); next.boostCooldown = cfg.boostCooldown; }
  velocity.y -= 9.81 * cfg.gravity * delta;
  const speed = len(velocity);
  if (next.rotation.pitch < 0) velocity = add(velocity, forward, Math.abs(Math.sin(next.rotation.pitch)) * 42 * delta);
  else if (speed > cfg.stallSpeed) {
    const climb = Math.sin(next.rotation.pitch);
    velocity.y += speed * 0.45 * climb * cfg.lift * delta;
    velocity = add(velocity, forward, -speed * 0.28 * climb * delta);
  }
  const drag = Math.min(speed * speed * cfg.drag * 0.0018, 0.45);
  velocity = add(velocity, norm(velocity), -drag);
  const forwardDot = velocity.x * forward.x + velocity.y * forward.y + velocity.z * forward.z;
  if (forwardDot < cfg.minForwardSpeed && !next.onGround) velocity = add(velocity, forward, 6 * delta);
  const capped = len(velocity);
  if (capped > cfg.maxSpeed) velocity = scale(norm(velocity), cfg.maxSpeed);
  next.position = add(next.position, velocity, delta);
  const ground = (terrainSampler?.getHeight?.(next.position.x, next.position.z) ?? 0) + cfg.groundClearance;
  if (next.position.y < ground) {
    next.position.y = ground;
    velocity.y = Math.max(0, velocity.y);
    velocity.x *= Math.exp(-12 * delta);
    velocity.z *= Math.exp(-12 * delta);
    next.rotation.pitch = 0;
    next.rotation.roll = 0;
    next.onGround = true;
  } else next.onGround = false;
  next.velocity = velocity;
  next.speed = len(velocity);
  return next;
}

export function createFlightMotionKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const FlightMotionState = resource(options.resourceName ?? "flightMotion.state");
  const FlightMotionUpdated = event("flightMotion.updated");
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "flight-motion-kit",
    resources: { FlightMotionState },
    events: { FlightMotionUpdated },
    provides: ["flight-motion", "glide-motion"],
    initWorld({ world }) { ensureResource(world, FlightMotionState, () => createFlightState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, FlightMotionState, () => createFlightState(options));
      engine.flightMotion = {
        getState: state,
        step(input = {}, dt = 1 / 60) {
          const next = stepFlight(state(), input, dt, engine.terrainSampler);
          world.setResource(FlightMotionState, next);
          world.emit(FlightMotionUpdated, { state: clone(next) });
          return next;
        },
        setState(patch = {}) { const next = { ...state(), ...clone(patch) }; world.setResource(FlightMotionState, next); return next; },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: FLIGHT_MOTION_KIT_VERSION, purpose: "Generic pitch/roll/yaw glider physics with terrain collision and boost support." }
  });
}
