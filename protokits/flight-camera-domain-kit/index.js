import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const FLIGHT_CAMERA_DOMAIN_KIT_VERSION = "0.1.1";

export const DEFAULT_FLIGHT_CAMERA_CONFIG = Object.freeze({
  mode: "bird-follow",
  baseFov: 64,
  speedFovBoost: 10,
  diveFovBoost: 6,
  maxSpeed: 164,
  followDistance: 4.2,
  followHeight: 1.5,
  lookAhead: 5.5,
  verticalLookAhead: 0.65,
  positionLag: 0.16,
  targetLag: 0.14,
  headingLag: 0.1,
  velocityLeadWeight: 0.12,
  carveLookWeight: 0.08,
  rollFrameWeight: 0.04,
  horizonStabilization: 0.86,
  shakeBase: 0.006,
  shakeSpeed: 0.09,
  shakeDive: 0.07,
  shakeBoost: 0.11,
  shakeFrequency: 10.5
});

const add = (a = {}, b = {}, scale = 1) => ({ x: number(a.x) + number(b.x) * scale, y: number(a.y) + number(b.y) * scale, z: number(a.z) + number(b.z) * scale });
const mix = (a = 0, b = 0, t = 0) => number(a) + (number(b) - number(a)) * clamp(t, 0, 1);
const vecMix = (a = {}, b = {}, t = 0) => ({ x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), z: mix(a.z, b.z, t) });
const len = (v = {}) => Math.hypot(number(v.x), number(v.y), number(v.z));
const scale = (v = {}, s = 1) => ({ x: number(v.x) * number(s), y: number(v.y) * number(s), z: number(v.z) * number(s) });
const norm = (v = {}, fallback = { x: 0, y: 0, z: -1 }) => {
  const l = len(v);
  return l > 0.000001 ? scale(v, 1 / l) : clone(fallback);
};
const cross = (a = {}, b = {}) => ({ x: number(a.y) * number(b.z) - number(a.z) * number(b.y), y: number(a.z) * number(b.x) - number(a.x) * number(b.z), z: number(a.x) * number(b.y) - number(a.y) * number(b.x) });

export function forwardFromRotation(rotation = {}) {
  const pitch = number(rotation.pitch);
  const yaw = number(rotation.yaw);
  return { x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) };
}

function lagAmount(lag = 0.1, dt = 1 / 60) {
  const normalized = clamp(number(lag, 0.1), 0.001, 1);
  return clamp(1 - Math.pow(1 - normalized, Math.max(1, number(dt, 1 / 60) * 60)), 0, 1);
}

export function createFlightCameraState(options = {}) {
  const config = { ...DEFAULT_FLIGHT_CAMERA_CONFIG, ...(options.camera ?? options.config ?? options) };
  return {
    version: FLIGHT_CAMERA_DOMAIN_KIT_VERSION,
    mode: config.mode,
    config,
    initialized: false,
    position: { x: 0, y: 0, z: 0 },
    lookAt: { x: 0, y: 0, z: -1 },
    followDirection: { x: 0, y: 0, z: -1 },
    lookDirection: { x: 0, y: 0, z: -1 },
    fov: number(config.baseFov, 64),
    anchors: {
      bird: { x: 0, y: 0, z: 0 },
      desiredPosition: { x: 0, y: 0, z: 0 },
      desiredLookAt: { x: 0, y: 0, z: -1 }
    },
    metadata: {
      velocityLeadWeight: number(config.velocityLeadWeight, 0.12),
      carveLookWeight: number(config.carveLookWeight, 0.08),
      horizonStabilization: number(config.horizonStabilization, 0.86),
      shakePhase: 0,
      shakeAmplitude: 0
    }
  };
}

export function computeFlightCameraSnapshot(previous = {}, motion = {}, dt = 1 / 60, options = {}) {
  const config = { ...DEFAULT_FLIGHT_CAMERA_CONFIG, ...(previous.config ?? {}), ...(options.camera ?? options.config ?? options) };
  const position = clone(motion.position ?? previous.anchors?.bird ?? { x: 0, y: 0, z: 0 });
  const birdForward = norm(forwardFromRotation(motion.rotation), previous.followDirection ?? { x: 0, y: 0, z: -1 });
  const velocityForward = norm(motion.velocity, birdForward);
  const carveForward = norm(motion.carve?.focusDirection, birdForward);
  const followVelocity = norm(vecMix(birdForward, velocityForward, clamp(config.velocityLeadWeight, 0, 0.5)), birdForward);
  const previousFollow = norm(previous.followDirection, followVelocity);
  const headingT = lagAmount(config.headingLag, dt);
  const followDirection = norm(vecMix(previousFollow, followVelocity, headingT), followVelocity);
  const carveBias = clamp(config.carveLookWeight, 0, 0.35) * clamp(number(motion.carve?.turnStrength, 0), 0, 1);
  const lookDirectionRaw = norm(vecMix(birdForward, carveForward, carveBias), birdForward);
  const horizon = clamp(config.horizonStabilization, 0, 1);
  const lookDirection = norm({ x: lookDirectionRaw.x, y: mix(lookDirectionRaw.y, birdForward.y * 0.55, horizon * 0.62), z: lookDirectionRaw.z }, lookDirectionRaw);
  const roll = number(motion.rotation?.roll, 0);
  const rollOffset = { x: Math.sin(roll) * number(config.rollFrameWeight, 0.04) * number(config.followDistance, 4.2), y: 0, z: 0 };

  const desiredPosition = add(add(position, followDirection, -number(config.followDistance, 4.2)), { x: 0, y: 1, z: 0 }, number(config.followHeight, 1.5));
  desiredPosition.x += rollOffset.x;
  const desiredLookAt = add(add(position, lookDirection, number(config.lookAhead, 5.5)), { x: 0, y: 1, z: 0 }, number(config.verticalLookAhead, 0.65));
  const speedRatio = clamp(number(motion.speed, len(motion.velocity)) / Math.max(1, number(config.maxSpeed, 164)), 0, 1);
  const dive = clamp(Math.max(0, -number(motion.velocity?.y, 0) / 72), 0, 1);
  const boost = motion.control?.lastInput?.boost ? 1 : 0;
  const desiredFov = number(config.baseFov, 64) + speedRatio * number(config.speedFovBoost, 10) + dive * number(config.diveFovBoost, 6);

  const initialized = Boolean(previous.initialized);
  const positionT = initialized ? lagAmount(config.positionLag, dt) : 1;
  const targetT = initialized ? lagAmount(config.targetLag, dt) : 1;
  const phase = number(previous.metadata?.shakePhase, 0) + number(dt, 1 / 60) * number(config.shakeFrequency, 10.5) * (1 + speedRatio * 1.8 + boost * 0.8);
  const shakeAmplitude = number(config.shakeBase, 0.006) + speedRatio * number(config.shakeSpeed, 0.09) + dive * number(config.shakeDive, 0.07) + boost * number(config.shakeBoost, 0.11);
  const right = norm(cross(followDirection, { x: 0, y: 1, z: 0 }), { x: 1, y: 0, z: 0 });
  const up = { x: 0, y: 1, z: 0 };
  const shake = add(scale(right, Math.sin(phase * 1.7) * shakeAmplitude), up, Math.cos(phase * 2.3) * shakeAmplitude * 0.62);

  const smoothedPosition = initialized ? vecMix(previous.position, desiredPosition, positionT) : desiredPosition;
  const smoothedLookAt = initialized ? vecMix(previous.lookAt, desiredLookAt, targetT) : desiredLookAt;

  return {
    version: FLIGHT_CAMERA_DOMAIN_KIT_VERSION,
    mode: config.mode,
    config,
    initialized: true,
    position: add(smoothedPosition, shake, 1),
    lookAt: add(smoothedLookAt, shake, 0.42),
    followDirection,
    lookDirection,
    velocityForward,
    birdForward,
    fov: initialized ? mix(previous.fov, desiredFov, targetT) : desiredFov,
    anchors: { bird: position, desiredPosition, desiredLookAt },
    metadata: {
      velocityLeadWeight: number(config.velocityLeadWeight, 0.12),
      carveLookWeight: number(config.carveLookWeight, 0.08),
      rollFrameWeight: number(config.rollFrameWeight, 0.04),
      horizonStabilization: number(config.horizonStabilization, 0.86),
      speedRatio,
      dive,
      boost,
      shakePhase: phase,
      shakeAmplitude,
      positionLagApplied: positionT,
      targetLagApplied: targetT
    }
  };
}

export function createFlightCameraDomainKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const FlightCameraState = resource(options.resourceName ?? "flightCamera.state");
  const FlightCameraUpdated = event("flightCamera.updated");
  const initial = () => createFlightCameraState(options);

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "flight-camera-domain-kit",
    resources: { FlightCameraState },
    events: { FlightCameraUpdated },
    provides: ["flight-camera", "bird-follow-camera", "camera-rig-state", "speed-reactive-camera-shake"],
    initWorld({ world }) { ensureResource(world, FlightCameraState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, FlightCameraState, initial);
      const setState = (next, reason = "camera") => {
        world.setResource(FlightCameraState, next);
        world.emit(FlightCameraUpdated, { reason, state: clone(next) });
        return next;
      };
      engine.flightCamera = {
        getState: state,
        updateFromMotion(motion = {}, dt = 1 / 60) {
          return setState(computeFlightCameraSnapshot(state(), motion, dt, state().config), "motion");
        },
        getCameraSnapshot() { return clone(state()); },
        setMode(mode = "bird-follow") {
          const next = { ...state(), mode, config: { ...(state().config ?? {}), mode } };
          return setState(next, "mode");
        },
        setConfig(config = {}) {
          const next = { ...state(), config: { ...(state().config ?? {}), ...clone(config) } };
          return setState(next, "config");
        },
        reset() { return setState(initial(), "reset"); },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: FLIGHT_CAMERA_DOMAIN_KIT_VERSION, purpose: "Persistent close trailing bird-flight camera with follow anchor, look anchor, lag, horizon stabilization, low carve authority, and speed-reactive shake." }
  });
}

export default createFlightCameraDomainKit;
