import { defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const AERIAL_CAMERA_RIG_DOMAIN_KIT_VERSION = "0.2.0";

function defineResource(NexusEngine, name) { return typeof NexusEngine.defineResource === "function" ? NexusEngine.defineResource(name) : `resource:${name}`; }
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function norm3(v = {}, fallback = { x: 0, y: 1, z: 0 }) { const x = number(v.x), y = number(v.y), z = number(v.z); const length = Math.hypot(x, y, z) || 0; return length > 0.000001 ? { x: x / length, y: y / length, z: z / length } : { ...fallback }; }
function add(a = {}, b = {}) { return { x: number(a.x) + number(b.x), y: number(a.y) + number(b.y), z: number(a.z) + number(b.z) }; }
function scale(v = {}, s = 1) { return { x: number(v.x) * s, y: number(v.y) * s, z: number(v.z) * s }; }
function cross(a = {}, b = {}) { return { x: number(a.y) * number(b.z) - number(a.z) * number(b.y), y: number(a.z) * number(b.x) - number(a.x) * number(b.z), z: number(a.x) * number(b.y) - number(a.y) * number(b.x) }; }
function lerp3(a = {}, b = {}, t = 0) { return { x: number(a.x) + (number(b.x) - number(a.x)) * t, y: number(a.y) + (number(b.y) - number(a.y)) * t, z: number(a.z) + (number(b.z) - number(a.z)) * t }; }
function forwardFromRotation(rotation = {}) { const yaw = number(rotation.yaw, 0); const pitch = number(rotation.pitch, 0); const cp = Math.cos(pitch); return norm3({ x: Math.sin(yaw) * cp, y: -Math.sin(pitch), z: Math.cos(yaw) * cp }, { x: 0, y: 0, z: 1 }); }
function normalizePhase(phase, fallback = "cleanup") { const value = String(phase ?? fallback); if (value === "post" || value === "render") return "cleanup"; if (["input", "simulate", "resolve", "cleanup"].includes(value)) return value; return fallback; }
function initialState(config = {}) { return { id: config.id ?? "aerial-camera-rig", version: AERIAL_CAMERA_RIG_DOMAIN_KIT_VERSION, mode: config.mode ?? "floating-chase", descriptor: null, frame: 0 }; }

export function createAerialCameraRigDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialCameraRig.state");
  let installedEngine = null;
  function system(world) {
    const state = clone(world.getResource(State) ?? initialState(config));
    const body = installedEngine?.poweredAerialFlight?.getBody?.() ?? installedEngine?.genericAerialBody?.getActiveBody?.();
    if (!body?.position) { world.setResource(State, state); return; }
    const noseForward = body.forward ?? forwardFromRotation(body.rotation ?? {});
    const velocityForward = norm3(body.velocity ?? noseForward, noseForward);
    const velocityLead = number(config.velocityLead, 0.45);
    const blendedForward = norm3(lerp3(noseForward, velocityForward, velocityLead), noseForward);
    const up = { x: 0, y: 1, z: 0 };
    const right = norm3(cross(blendedForward, up), { x: 1, y: 0, z: 0 });
    const boostState = installedEngine?.aerialSpeedFeel?.getState?.() ?? {};
    const assist = installedEngine?.aerialFlightAssist?.getState?.() ?? {};
    const speedT = number(boostState.speedT, Math.max(0, Math.min(1, (number(body.speed, 0) - 80) / 180)));
    const lowAglT = number(assist.lowAglT, Math.max(0, Math.min(1, (75 - number(body.agl, 100)) / 47)));
    const roll = number(body.rotation?.roll, 0);
    const followDistance = number(config.followDistance, 115) + speedT * number(config.boostPullback, 28);
    const followHeight = number(config.followHeight, 34) + lowAglT * number(config.lowAglRise, 18);
    const lookAhead = number(config.lookAhead, 165) + speedT * 35;
    const lookUp = number(config.lookUp, 11) + lowAglT * 10;
    const rollSideOffset = -roll * number(config.rollSideOffset, 18);
    const anchorPosition = add(add(body.position, scale(blendedForward, lookAhead)), { x: 0, y: lookUp, z: 0 });
    const desiredCameraPosition = add(add(add(body.position, scale(blendedForward, -followDistance)), { x: 0, y: followHeight, z: 0 }), scale(right, rollSideOffset));
    const fov = number(config.fovBase, number(config.fov, 62)) + speedT * number(config.fovBoost, 12) - (body.airbrake ? 3 : 0);
    world.setResource(State, { ...state, mode: config.mode ?? "floating-chase", descriptor: { id: "camera.floating-chase", mode: config.mode ?? "floating-chase", anchorPosition, position: desiredCameraPosition, lookAt: anchorPosition, up, fov, rollInfluence: number(config.rollInfluence, 0.15), shake: { intensity: lowAglT * 0.18 + speedT * 0.035, lowAglT, speedT }, smoothing: { position: number(config.positionSmoothing, 7), look: number(config.lookSmoothing, 9), up: number(config.upSmoothing, 4) } }, frame: state.frame + 1 });
  }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-camera-rig-domain-kit", requires: ["aerial:body"], provides: ["camera:state", "camera:chase-rig", "render:camera-descriptor"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialCameraRigSystem", system }], initWorld({ world }) { world.setResource(State, initialState(config)); }, install({ engine, world }) { installedEngine = engine; engine.aerialCameraRig = { getState() { return world.getResource(State); }, getSnapshot() { return clone(world.getResource(State)); }, getDescriptor() { return world.getResource(State)?.descriptor ?? null; } }; }, metadata: { version: AERIAL_CAMERA_RIG_DOMAIN_KIT_VERSION, domain: "aerial-camera-rig", purpose: "Floating chase camera anchor with velocity lead, roll damping, FOV kick, and low-AGL rise descriptors." } });
}

export default createAerialCameraRigDomainKit;
