import { approach, clone, defineInjectedRuntimeKit, ensureResource, getClockDelta, number } from "../protokit-core/index.js";
import { createVerticalClimbDefinitions } from "../vertical-climb-core/index.js";

export const CLIMB_CAMERA_KIT_VERSION = "0.0.1";

function createInitialState(options = {}) {
  return {
    version: CLIMB_CAMERA_KIT_VERSION,
    mode: options.mode ?? "follow",
    position: { x: number(options.position?.x), y: number(options.position?.y, 5), z: number(options.position?.z, 18) },
    lookAt: { x: number(options.lookAt?.x), y: number(options.lookAt?.y, 2), z: number(options.lookAt?.z) },
    zoom: number(options.zoom, 1),
    parallax: number(options.parallax, 0.42),
    shake: 0,
    target: null
  };
}

export function computeClimbCameraTarget(climbState = {}, swingState = {}, cloudState = {}, options = {}) {
  const player = climbState.player ?? { x: 0, y: 0, z: 0 };
  const mode = climbState.mode === "swinging" || swingState.attached ? "swing" : climbState.mode === "falling" ? "fall" : "follow";
  const lookAheadY = mode === "fall" ? -1.5 : mode === "swing" ? 3.2 : number(options.lookAheadY, 5.5);
  const lookAheadX = mode === "swing" ? number(swingState.horizontalMomentum) * 1.2 : 0;
  return {
    mode,
    position: { x: number(player.x) * number(options.followX, 0.18) + lookAheadX, y: number(player.y) + lookAheadY, z: number(options.distance, 18) },
    lookAt: { x: number(player.x) * number(options.lookAtX, 0.35), y: number(player.y) + number(options.lookAtYOffset, 1.5), z: 0 },
    zoom: number(options.zoom, 1) + (mode === "swing" ? 0.03 : 0),
    shake: mode === "fall" ? 0.08 : 0
  };
}

export function createClimbCameraKit(nexusEngine = {}, options = {}) {
  const definitions = createVerticalClimbDefinitions(nexusEngine, options);
  const { resources } = definitions;
  const system = (world) => {
    const state = ensureResource(world, resources.CameraState, () => createInitialState(options));
    const target = computeClimbCameraTarget(world.getResource(resources.ClimbState) ?? {}, world.getResource(resources.SwingState) ?? {}, world.getResource(resources.CloudState) ?? {}, options);
    const dt = getClockDelta(world);
    const rate = number(options.smoothing, target.mode === "fall" ? 7 : 4.5);
    state.mode = target.mode;
    for (const axis of ["x", "y", "z"]) {
      state.position[axis] = approach(state.position[axis], target.position[axis], rate, dt);
      state.lookAt[axis] = approach(state.lookAt[axis], target.lookAt[axis], rate, dt);
    }
    state.zoom = approach(state.zoom, target.zoom, rate, dt);
    state.shake = approach(state.shake, target.shake, 8, dt);
    state.target = target;
    world.setResource(resources.CameraState, state);
  };
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "climb-camera-kit",
    resources: { CameraState: resources.CameraState, ClimbState: resources.ClimbState, SwingState: resources.SwingState, CloudState: resources.CloudState },
    systems: [{ phase: "resolve", name: "climbCameraSystem", system }],
    provides: ["climb-camera"],
    bindings: { computeClimbCameraTarget },
    initWorld({ world }) { ensureResource(world, resources.CameraState, () => createInitialState(options)); },
    install({ engine, world }) {
      engine.climbCamera = { definitions, snapshot: () => clone(world.getResource(resources.CameraState)), setMode(mode) { const state = ensureResource(world, resources.CameraState, () => createInitialState(options)); state.mode = mode; world.setResource(resources.CameraState, state); return state; } };
    },
    metadata: { version: CLIMB_CAMERA_KIT_VERSION, purpose: "2.5D vertical camera descriptor state for climb games." }
  });
}
