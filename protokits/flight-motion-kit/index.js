import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const FLIGHT_MOTION_KIT_VERSION = "0.1.1";

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
  minForwardSpeed: 15,
  controlMode: "assisted",
  targetPitch: 0.035,
  targetRoll: 0,
  maxPitch: 0.82,
  maxRoll: 0.86,
  pitchResponse: 5.4,
  rollResponse: 6.2,
  autoLevel: 4.6,
  pitchDamping: 2.2,
  rollDamping: 3.8,
  minimumAirspeed: 42,
  stallRecoveryPitch: 0.14,
  stallRecoveryLift: 10,
  terrainAvoidance: true,
  safeClearance: 96,
  criticalClearance: 44,
  terrainPitchBias: 0.18,
  terrainLift: 18,
  terrainSpeedBias: 8,
  sinkRateLimit: -38
});

export function createFlightState(options = {}) {
  const config = { ...DEFAULT_FLIGHT_CONFIG, ...(options.physics ?? options.config ?? {}) };
  return {
    version: FLIGHT_MOTION_KIT_VERSION,
    config,
    actorId: options.actorId ?? "player",
    position: { x: 0, y: 180, z: 0 },
    velocity: { x: 0, y: -5, z: -45 },
    rotation: { pitch: 0, yaw: 0, roll: 0 },
    control: {
      mode: config.controlMode,
      targetPitch: number(config.targetPitch, 0.035),
      targetRoll: number(config.targetRoll, 0),
      lastInput: { pitch: 0, bank: 0, boost: false }
    },
    stability: {
      active: config.controlMode !== "manual",
      autoLevelActive: false,
      terrainAvoidanceActive: false,
      stallRisk: 0,
      clearance: null,
      groundHeight: null,
      sinkRate: -5
    },
    speed: 45,
    onGround: false,
    boostCooldown: 0
  };
}

const add = (a, b, s = 1) => ({ x: number(a.x) + number(b.x) * s, y: number(a.y) + number(b.y) * s, z: number(a.z) + number(b.z) * s });
const len = (v) => Math.hypot(number(v.x), number(v.y), number(v.z));
const scale = (v, s) => ({ x: number(v.x) * s, y: number(v.y) * s, z: number(v.z) * s });
const norm = (v) => { const l = len(v) || 1; return scale(v, 1 / l); };
const approach = (value, target, rate, dt) => target + (number(value) - target) * Math.exp(-Math.max(0, rate) * dt);

export function forwardFromRotation(rotation = {}) {
  const pitch = number(rotation.pitch);
  const yaw = number(rotation.yaw);
  return { x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) };
}

function normalizedControlInput(input = {}) {
  const pitch = number(input.pitch, 0) + (input.pitchUp ? 1 : 0) - (input.pitchDown ? 1 : 0);
  const bank = number(input.bank, 0) + (input.bankLeft ? 1 : 0) - (input.bankRight ? 1 : 0);
  return {
    pitch: clamp(pitch, -1, 1),
    bank: clamp(bank, -1, 1),
    boost: Boolean(input.boost)
  };
}

function assistedTargets(next, cfg, input, delta, clearance) {
  const previous = next.control ?? {};
  const mode = input.mode ?? cfg.controlMode ?? previous.mode ?? "assisted";
  let targetPitch = number(previous.targetPitch, number(cfg.targetPitch, 0.035));
  let targetRoll = number(previous.targetRoll, number(cfg.targetRoll, 0));

  if (mode === "manual") {
    targetPitch = number(next.rotation.pitch) + input.pitch * cfg.pitchSpeed * delta;
    targetRoll = number(next.rotation.roll) + input.bank * cfg.rollSpeed * delta;
  } else {
    targetPitch += input.pitch * cfg.pitchSpeed * delta;
    targetRoll += input.bank * cfg.rollSpeed * delta;
    if (Math.abs(input.bank) < 0.001) targetRoll = approach(targetRoll, 0, cfg.autoLevel, delta);
    if (Math.abs(input.pitch) < 0.001) targetPitch = approach(targetPitch, number(cfg.targetPitch, 0.035), cfg.pitchDamping, delta);
  }

  const terrainAvoidanceActive = mode !== "manual" && cfg.terrainAvoidance !== false && Number.isFinite(clearance) && clearance < number(cfg.safeClearance, 96);
  if (terrainAvoidanceActive) {
    const lowRatio = clamp((number(cfg.safeClearance, 96) - clearance) / Math.max(1, number(cfg.safeClearance, 96) - number(cfg.criticalClearance, 44)), 0, 1);
    targetPitch += number(cfg.terrainPitchBias, 0.18) * lowRatio;
  }

  return {
    mode,
    targetPitch: clamp(targetPitch, -number(cfg.maxPitch, 0.82), number(cfg.maxPitch, 0.82)),
    targetRoll: clamp(targetRoll, -number(cfg.maxRoll, 0.86), number(cfg.maxRoll, 0.86)),
    terrainAvoidanceActive
  };
}

export function stepFlight(state = {}, input = {}, dt = 1 / 60, terrainSampler = null) {
  const next = clone(state);
  const cfg = { ...DEFAULT_FLIGHT_CONFIG, ...(next.config ?? {}) };
  const delta = clamp(dt, 0, 0.1);
  const controlInput = normalizedControlInput(input);
  const groundHeightNow = terrainSampler?.getHeight?.(next.position?.x ?? 0, next.position?.z ?? 0) ?? 0;
  const clearanceNow = number(next.position?.y, 0) - groundHeightNow;
  const targets = assistedTargets(next, cfg, { ...controlInput, mode: input.mode }, delta, clearanceNow);
  const assisted = targets.mode !== "manual";

  next.rotation = next.rotation ?? { pitch: 0, yaw: 0, roll: 0 };
  if (assisted) {
    next.rotation.pitch = approach(number(next.rotation.pitch), targets.targetPitch, cfg.pitchResponse, delta);
    next.rotation.roll = approach(number(next.rotation.roll), targets.targetRoll, cfg.rollResponse, delta);
  } else {
    next.rotation.pitch = targets.targetPitch;
    next.rotation.roll = targets.targetRoll;
  }
  next.rotation.pitch = clamp(number(next.rotation.pitch), -1.4, 1.4);
  next.rotation.roll = clamp(number(next.rotation.roll), -1.2, 1.2);
  next.rotation.yaw = number(next.rotation.yaw) + next.rotation.roll * cfg.yawFromRoll * delta;
  if (!assisted && Math.abs(controlInput.bank) < 0.001) next.rotation.roll *= Math.exp(-4.5 * delta);

  let velocity = clone(next.velocity ?? { x: 0, y: 0, z: -45 });
  const forward = forwardFromRotation(next.rotation);
  if (next.boostCooldown > 0) next.boostCooldown = Math.max(0, next.boostCooldown - delta);
  if (controlInput.boost && next.boostCooldown <= 0) {
    velocity = add(velocity, forward, cfg.boostImpulse);
    next.boostCooldown = cfg.boostCooldown;
  }

  velocity.y -= 9.81 * cfg.gravity * delta;
  const speed = len(velocity);
  if (next.rotation.pitch < 0) velocity = add(velocity, forward, Math.abs(Math.sin(next.rotation.pitch)) * 42 * delta);
  else if (speed > cfg.stallSpeed) {
    const climb = Math.sin(next.rotation.pitch);
    velocity.y += speed * 0.45 * climb * cfg.lift * delta;
    velocity = add(velocity, forward, -speed * 0.28 * climb * delta);
  }

  const forwardDot = velocity.x * forward.x + velocity.y * forward.y + velocity.z * forward.z;
  const stallRisk = clamp((number(cfg.minimumAirspeed, cfg.minForwardSpeed) - forwardDot) / Math.max(1, number(cfg.minimumAirspeed, cfg.minForwardSpeed)), 0, 1);
  if (assisted && stallRisk > 0) {
    velocity = add(velocity, forward, (number(cfg.stallRecoveryLift, 10) + number(cfg.terrainSpeedBias, 8) * stallRisk) * stallRisk * delta);
    velocity.y += number(cfg.stallRecoveryPitch, 0.14) * stallRisk * delta * Math.max(speed, number(cfg.minimumAirspeed, 42));
  }
  if (targets.terrainAvoidanceActive) {
    const lowRatio = clamp((number(cfg.safeClearance, 96) - clearanceNow) / Math.max(1, number(cfg.safeClearance, 96)), 0, 1);
    velocity.y += number(cfg.terrainLift, 18) * lowRatio * delta;
    velocity = add(velocity, forward, number(cfg.terrainSpeedBias, 8) * lowRatio * delta);
  }
  if (assisted && velocity.y < number(cfg.sinkRateLimit, -38)) velocity.y = approach(velocity.y, number(cfg.sinkRateLimit, -38), 7, delta);

  const drag = Math.min(speed * speed * cfg.drag * 0.0018 * delta, speed * 0.4);
  velocity = add(velocity, norm(velocity), -drag);
  const nextForwardDot = velocity.x * forward.x + velocity.y * forward.y + velocity.z * forward.z;
  if (nextForwardDot < cfg.minForwardSpeed && !next.onGround) velocity = add(velocity, forward, 6 * delta);
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

  const groundHeight = terrainSampler?.getHeight?.(next.position.x, next.position.z) ?? 0;
  const clearance = next.position.y - groundHeight;
  next.velocity = velocity;
  next.speed = len(velocity);
  next.control = {
    mode: targets.mode,
    targetPitch: targets.targetPitch,
    targetRoll: targets.targetRoll,
    lastInput: controlInput
  };
  next.stability = {
    active: assisted,
    autoLevelActive: assisted && Math.abs(controlInput.bank) < 0.001,
    terrainAvoidanceActive: targets.terrainAvoidanceActive,
    stallRisk,
    clearance,
    groundHeight,
    sinkRate: velocity.y,
    minimumAirspeed: number(cfg.minimumAirspeed, cfg.minForwardSpeed),
    targetPitch: targets.targetPitch,
    targetRoll: targets.targetRoll
  };
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
    provides: ["flight-motion", "glide-motion", "assisted-flight"],
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
        setControlMode(mode = "assisted") {
          const current = state();
          const next = { ...current, control: { ...(current.control ?? {}), mode }, config: { ...(current.config ?? {}), controlMode: mode } };
          world.setResource(FlightMotionState, next);
          return next;
        },
        setTrim(trim = {}) {
          const current = state();
          const next = {
            ...current,
            control: {
              ...(current.control ?? {}),
              targetPitch: number(trim.pitch, current.control?.targetPitch ?? current.config?.targetPitch ?? DEFAULT_FLIGHT_CONFIG.targetPitch),
              targetRoll: number(trim.roll, current.control?.targetRoll ?? current.config?.targetRoll ?? DEFAULT_FLIGHT_CONFIG.targetRoll)
            }
          };
          world.setResource(FlightMotionState, next);
          return next;
        },
        setStability(stability = {}) {
          const current = state();
          const next = { ...current, config: { ...(current.config ?? {}), ...clone(stability) } };
          world.setResource(FlightMotionState, next);
          return next;
        },
        setState(patch = {}) { const next = { ...state(), ...clone(patch) }; world.setResource(FlightMotionState, next); return next; },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: FLIGHT_MOTION_KIT_VERSION, purpose: "Generic pitch/roll/yaw glider physics with assisted stabilization, terrain clearance, boost, and manual override support." }
  });
}
