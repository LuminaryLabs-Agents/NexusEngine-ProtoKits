import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const FLIGHT_MOTION_KIT_VERSION = "0.1.3";

export const DEFAULT_FLIGHT_CONFIG = Object.freeze({
  gravity: 0.18,
  drag: 0.04,
  lift: 0.95,
  maxSpeed: 140,
  boostImpulse: 45,
  boostCooldown: 1.5,
  pitchSpeed: 2.1,
  rollSpeed: 2.6,
  yawFromRoll: 1.42,
  groundClearance: 12,
  stallSpeed: 8,
  minForwardSpeed: 15,
  controlMode: "assisted",
  controlResponseMode: "direct",
  targetPitch: 0.035,
  targetRoll: 0,
  pitchInputScale: 0.78,
  rollInputScale: 0.94,
  maxPitch: 0.82,
  maxRoll: 0.82,
  pitchResponse: 7.2,
  rollResponse: 10.8,
  autoLevel: 7.4,
  pitchDamping: 4.2,
  rollDamping: 6.5,
  minimumAirspeed: 42,
  stallRecoveryPitch: 0.14,
  stallRecoveryLift: 10,
  terrainAvoidance: true,
  safeClearance: 96,
  criticalClearance: 44,
  terrainPitchBias: 0.18,
  terrainLift: 18,
  terrainSpeedBias: 8,
  sinkRateLimit: -38,
  flightPathAlignment: true,
  horizontalAlignRate: 5.2,
  verticalAlignRate: 4.8,
  carveMode: "screen-focus",
  carveStrength: 1.02,
  carveResponse: 9.5,
  bankCarveScale: 1.34,
  pitchCarveScale: 1.14,
  bankTurnAuthority: 1.74,
  turnLiftLoss: 0.055,
  turnDiveAssist: 0.03,
  swoopAcceleration: 18,
  diveAcceleration: 30,
  climbAcceleration: 17
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
      responseMode: config.controlResponseMode,
      lastInput: { pitch: 0, bank: 0, boost: false }
    },
    carve: {
      mode: config.carveMode,
      active: false,
      focusDirection: { x: 0, y: 0, z: -1 },
      alignmentError: 0,
      turnStrength: 0,
      velocityForwardDot: 1,
      desiredVelocity: { x: 0, y: 0, z: -45 }
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
const norm = (v, fallback = { x: 0, y: 0, z: -1 }) => { const l = len(v); return l > 0.000001 ? scale(v, 1 / l) : clone(fallback); };
const dot = (a, b) => number(a.x) * number(b.x) + number(a.y) * number(b.y) + number(a.z) * number(b.z);
const mix = (a, b, t) => number(a) + (number(b) - number(a)) * clamp(t, 0, 1);
const approach = (value, target, rate, dt) => target + (number(value) - target) * Math.exp(-Math.max(0, rate) * dt);
const alignAmount = (rate, delta) => clamp(1 - Math.exp(-Math.max(0, number(rate)) * delta), 0, 1);
const vecMix = (a, b, t) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) });

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
  const trimPitch = number(cfg.targetPitch, 0.035);
  const direct = cfg.controlResponseMode !== "incremental";
  let targetPitch = number(previous.targetPitch, trimPitch);
  let targetRoll = number(previous.targetRoll, number(cfg.targetRoll, 0));

  if (mode === "manual") {
    targetPitch = number(next.rotation.pitch) + input.pitch * cfg.pitchSpeed * delta;
    targetRoll = number(next.rotation.roll) + input.bank * cfg.rollSpeed * delta;
  } else if (direct) {
    const desiredPitch = trimPitch + input.pitch * number(cfg.maxPitch, 0.82) * number(cfg.pitchInputScale, 0.78);
    const desiredRoll = input.bank * number(cfg.maxRoll, 0.82) * number(cfg.rollInputScale, 0.94);
    targetPitch = Math.abs(input.pitch) > 0.001 ? desiredPitch : approach(targetPitch, trimPitch, cfg.pitchDamping, delta);
    targetRoll = Math.abs(input.bank) > 0.001 ? desiredRoll : approach(targetRoll, 0, cfg.autoLevel, delta);
  } else {
    targetPitch += input.pitch * cfg.pitchSpeed * delta;
    targetRoll += input.bank * cfg.rollSpeed * delta;
    if (Math.abs(input.bank) < 0.001) targetRoll = approach(targetRoll, 0, cfg.autoLevel, delta);
    if (Math.abs(input.pitch) < 0.001) targetPitch = approach(targetPitch, trimPitch, cfg.pitchDamping, delta);
  }

  const terrainAvoidanceActive = mode !== "manual" && cfg.terrainAvoidance !== false && Number.isFinite(clearance) && clearance < number(cfg.safeClearance, 96);
  if (terrainAvoidanceActive) {
    const lowRatio = clamp((number(cfg.safeClearance, 96) - clearance) / Math.max(1, number(cfg.safeClearance, 96) - number(cfg.criticalClearance, 44)), 0, 1);
    targetPitch += number(cfg.terrainPitchBias, 0.18) * lowRatio;
  }

  return {
    mode,
    responseMode: direct ? "direct" : "incremental",
    targetPitch: clamp(targetPitch, -number(cfg.maxPitch, 0.82), number(cfg.maxPitch, 0.82)),
    targetRoll: clamp(targetRoll, -number(cfg.maxRoll, 0.82), number(cfg.maxRoll, 0.82)),
    terrainAvoidanceActive
  };
}

function carveFocusDirection(next, targets, cfg, input, assisted, delta) {
  const rotation = next.rotation ?? {};
  const roll = number(rotation.roll);
  const turnStrength = clamp(Math.max(Math.abs(roll) / Math.max(0.0001, number(cfg.maxRoll, 0.82)), Math.abs(input.bank) * 0.55), 0, 1);
  if (!assisted || cfg.carveMode === "off") {
    return { focusDirection: forwardFromRotation(rotation), turnStrength, active: false };
  }
  const carveLean = roll * number(cfg.bankCarveScale, 1.34) + input.bank * number(cfg.carveStrength, 1.02) * 0.24;
  const pitchLean = (targets.targetPitch - number(rotation.pitch)) * number(cfg.pitchCarveScale, 1.14) + input.pitch * 0.055;
  const rawFocus = norm(forwardFromRotation({
    pitch: number(rotation.pitch) + pitchLean,
    yaw: number(rotation.yaw) + carveLean,
    roll: number(rotation.roll)
  }));
  const previous = norm(next.carve?.focusDirection, forwardFromRotation(rotation));
  const response = alignAmount(number(cfg.carveResponse, 9.5), delta);
  return {
    focusDirection: norm(vecMix(previous, rawFocus, response), rawFocus),
    turnStrength,
    active: true
  };
}

function alignVelocityToFocus(velocity, focusDirection, speed, cfg, delta) {
  const desiredSpeed = Math.max(number(speed), number(cfg.minForwardSpeed, 15), number(cfg.minimumAirspeed, 42));
  const desiredVelocity = scale(focusDirection, desiredSpeed);
  const h = alignAmount(cfg.horizontalAlignRate, delta);
  const v = alignAmount(cfg.verticalAlignRate, delta);
  return {
    velocity: {
      x: mix(velocity.x, desiredVelocity.x, h),
      y: mix(velocity.y, desiredVelocity.y, v),
      z: mix(velocity.z, desiredVelocity.z, h)
    },
    desiredVelocity
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
  const turnBoost = 1 + Math.abs(next.rotation.roll) * number(cfg.bankTurnAuthority, 1.74) * 0.22;
  next.rotation.yaw = number(next.rotation.yaw) + next.rotation.roll * cfg.yawFromRoll * turnBoost * delta;
  if (!assisted && Math.abs(controlInput.bank) < 0.001) next.rotation.roll *= Math.exp(-4.5 * delta);

  let velocity = clone(next.velocity ?? { x: 0, y: 0, z: -45 });
  const carve = carveFocusDirection(next, targets, cfg, controlInput, assisted, delta);
  const focusDirection = carve.focusDirection;
  if (next.boostCooldown > 0) next.boostCooldown = Math.max(0, next.boostCooldown - delta);
  if (controlInput.boost && next.boostCooldown <= 0) {
    velocity = add(velocity, focusDirection, cfg.boostImpulse);
    next.boostCooldown = cfg.boostCooldown;
  }

  velocity.y -= 9.81 * cfg.gravity * delta;
  const speed = len(velocity);
  if (next.rotation.pitch < 0) velocity = add(velocity, focusDirection, Math.abs(Math.sin(next.rotation.pitch)) * (42 + number(cfg.diveAcceleration, 30)) * delta);
  else if (speed > cfg.stallSpeed) {
    const climb = Math.sin(next.rotation.pitch);
    velocity.y += speed * 0.45 * climb * cfg.lift * delta;
    velocity = add(velocity, focusDirection, -speed * 0.28 * climb * delta);
    velocity = add(velocity, focusDirection, Math.max(0, climb) * number(cfg.climbAcceleration, 17) * delta);
  }

  if (assisted && cfg.flightPathAlignment !== false) {
    const aligned = alignVelocityToFocus(velocity, focusDirection, speed, cfg, delta);
    velocity = aligned.velocity;
  }

  const turnStrength = carve.turnStrength;
  if (assisted && turnStrength > 0.001) {
    velocity = add(velocity, focusDirection, number(cfg.swoopAcceleration, 18) * turnStrength * delta);
    velocity.y -= Math.max(0, number(cfg.turnLiftLoss, 0.055)) * turnStrength * Math.max(20, speed) * delta;
    velocity.y -= Math.max(0, number(cfg.turnDiveAssist, 0.03)) * turnStrength * Math.max(20, speed) * delta;
  }

  const forwardDot = dot(velocity, focusDirection);
  const stallRisk = clamp((number(cfg.minimumAirspeed, cfg.minForwardSpeed) - forwardDot) / Math.max(1, number(cfg.minimumAirspeed, cfg.minForwardSpeed)), 0, 1);
  if (assisted && stallRisk > 0) {
    velocity = add(velocity, focusDirection, (number(cfg.stallRecoveryLift, 10) + number(cfg.terrainSpeedBias, 8) * stallRisk) * stallRisk * delta);
    velocity.y += number(cfg.stallRecoveryPitch, 0.14) * stallRisk * delta * Math.max(speed, number(cfg.minimumAirspeed, 42));
  }
  if (targets.terrainAvoidanceActive) {
    const lowRatio = clamp((number(cfg.safeClearance, 96) - clearanceNow) / Math.max(1, number(cfg.safeClearance, 96)), 0, 1);
    velocity.y += number(cfg.terrainLift, 18) * lowRatio * delta;
    velocity = add(velocity, focusDirection, number(cfg.terrainSpeedBias, 8) * lowRatio * delta);
  }
  if (assisted && velocity.y < number(cfg.sinkRateLimit, -38)) velocity.y = approach(velocity.y, number(cfg.sinkRateLimit, -38), 7, delta);

  const currentSpeed = len(velocity);
  const drag = Math.min(currentSpeed * currentSpeed * cfg.drag * 0.0018 * delta, currentSpeed * 0.4);
  velocity = add(velocity, norm(velocity), -drag);
  const nextForwardDot = dot(velocity, focusDirection);
  if (nextForwardDot < cfg.minForwardSpeed && !next.onGround) velocity = add(velocity, focusDirection, 6 * delta);
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
  const velocityDirection = norm(velocity, focusDirection);
  const alignmentError = 1 - clamp(dot(velocityDirection, focusDirection), -1, 1);
  next.velocity = velocity;
  next.speed = len(velocity);
  next.control = {
    mode: targets.mode,
    responseMode: targets.responseMode,
    targetPitch: targets.targetPitch,
    targetRoll: targets.targetRoll,
    lastInput: controlInput
  };
  next.carve = {
    mode: cfg.carveMode,
    active: assisted && cfg.carveMode !== "off",
    focusDirection,
    alignmentError,
    turnStrength,
    velocityForwardDot: dot(velocityDirection, focusDirection),
    desiredVelocity: scale(focusDirection, Math.max(next.speed, number(cfg.minForwardSpeed, 15)))
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

export function createFlightMotionKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const FlightMotionState = resource(options.resourceName ?? "flightMotion.state");
  const FlightMotionUpdated = event("flightMotion.updated");
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "flight-motion-kit",
    resources: { FlightMotionState },
    events: { FlightMotionUpdated },
    provides: ["flight-motion", "glide-motion", "assisted-flight", "carve-flight"],
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
    metadata: { version: FLIGHT_MOTION_KIT_VERSION, purpose: "Generic pitch/roll/yaw glider physics with direct assisted controls, flight-path alignment, screen-focus carving, terrain clearance, boost, and manual override support." }
  });
}
