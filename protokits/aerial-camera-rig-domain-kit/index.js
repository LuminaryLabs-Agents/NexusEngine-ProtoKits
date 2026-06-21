import { defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const AERIAL_CAMERA_RIG_DOMAIN_KIT_VERSION = "0.1.1";

function defineResource(NexusRealtime, name) {
  return typeof NexusRealtime.defineResource === "function" ? NexusRealtime.defineResource(name) : `resource:${name}`;
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function norm3(v = {}, fallback = { x: 0, y: 1, z: 0 }) {
  const x = number(v.x), y = number(v.y), z = number(v.z);
  const length = Math.hypot(x, y, z) || 0;
  return length > 0.000001 ? { x: x / length, y: y / length, z: z / length } : { ...fallback };
}

function forwardFromRotation(rotation = {}) {
  const yaw = number(rotation.yaw, 0);
  const pitch = number(rotation.pitch, 0);
  const cp = Math.cos(pitch);
  return norm3({ x: Math.sin(yaw) * cp, y: -Math.sin(pitch), z: Math.cos(yaw) * cp }, { x: 0, y: 0, z: 1 });
}

function addScaled(origin = {}, vector = {}, scalar = 1) {
  return {
    x: number(origin.x) + number(vector.x) * scalar,
    y: number(origin.y) + number(vector.y) * scalar,
    z: number(origin.z) + number(vector.z) * scalar
  };
}

function initialState(config = {}) {
  return {
    id: config.id ?? "aerial-camera-rig",
    version: AERIAL_CAMERA_RIG_DOMAIN_KIT_VERSION,
    mode: config.mode ?? "chase-drone",
    descriptor: null,
    frame: 0
  };
}

function normalizePhase(phase, fallback = "cleanup") {
  const value = String(phase ?? fallback);
  if (value === "post" || value === "render") return "cleanup";
  if (["input", "simulate", "resolve", "cleanup"].includes(value)) return value;
  return fallback;
}

export function createAerialCameraRigDomainKit(NexusRealtime = {}, config = {}) {
  const State = defineResource(NexusRealtime, config.resourceName ?? "aerialCameraRig.state");
  let installedEngine = null;

  function system(world) {
    const state = clone(world.getResource(State) ?? initialState(config));
    const body = installedEngine?.poweredAerialFlight?.getBody?.() ?? installedEngine?.genericAerialBody?.getActiveBody?.();
    if (!body?.position) {
      world.setResource(State, state);
      return;
    }
    const forward = forwardFromRotation(body.rotation ?? {});
    const base = body.position;
    const followDistance = number(config.followDistance, 100);
    const followHeight = number(config.followHeight, 30);
    const lookAhead = number(config.lookAhead, 132);
    const lookUp = number(config.lookUp, 7);
    const position = addScaled({ x: base.x, y: number(base.y) + followHeight, z: base.z }, forward, -followDistance);
    const lookAt = addScaled({ x: base.x, y: number(base.y) + lookUp, z: base.z }, forward, lookAhead);
    const speedT = Math.max(0, Math.min(1, (number(body.speed, 0) - 80) / 160));
    world.setResource(State, {
      ...state,
      descriptor: {
        id: "camera.chase-drone",
        mode: config.mode ?? "chase-drone",
        position,
        lookAt,
        up: { x: 0, y: 1, z: 0 },
        fov: number(config.fov, 64) + speedT * number(config.speedFovBoost, 8),
        smoothing: {
          position: number(config.positionSmoothing, 7),
          look: number(config.lookSmoothing, 8.2),
          up: number(config.upSmoothing, 4)
        }
      },
      frame: state.frame + 1
    });
  }

  return defineInjectedRuntimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-camera-rig-domain-kit",
    requires: ["aerial:body"],
    provides: ["camera:state", "camera:chase-rig", "render:camera-descriptor"],
    resources: { State },
    systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialCameraRigSystem", system }],
    initWorld({ world }) { world.setResource(State, initialState(config)); },
    install({ engine, world }) {
      installedEngine = engine;
      engine.aerialCameraRig = {
        getState() { return world.getResource(State); },
        getSnapshot() { return clone(world.getResource(State)); },
        getDescriptor() { return world.getResource(State)?.descriptor ?? null; }
      };
    },
    metadata: {
      version: AERIAL_CAMERA_RIG_DOMAIN_KIT_VERSION,
      domain: "aerial-camera-rig",
      purpose: "Renderer-independent camera-drone chase descriptor over powered aerial body state."
    }
  });
}

export default createAerialCameraRigDomainKit;
