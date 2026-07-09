import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const STEREOSCOPIC_RENDER_DOMAIN_KIT_VERSION = "0.1.0";

export const DEFAULT_STEREOSCOPIC_RENDER_CONFIG = Object.freeze({
  mode: "stereo",
  referenceSpace: "local-floor",
  interpupillaryDistance: 0.064,
  fovDegrees: 70,
  aspect: 1,
  near: 0.05,
  far: 1000,
  renderScale: 1,
  convergenceDistance: 10,
  projection: "parallel-off-axis",
  textureLayout: "array-layer",
  viewportLayout: "full-eye",
  lateLatchPolicy: "host-owned",
  poseSource: "host-camera"
});

const EPSILON = 0.000001;
const vec3 = (value = {}, fallback = {}) => ({
  x: number(value.x, number(fallback.x, 0)),
  y: number(value.y, number(fallback.y, 0)),
  z: number(value.z, number(fallback.z, 0))
});
const add = (a = {}, b = {}, scale = 1) => ({
  x: number(a.x) + number(b.x) * number(scale, 1),
  y: number(a.y) + number(b.y) * number(scale, 1),
  z: number(a.z) + number(b.z) * number(scale, 1)
});
const sub = (a = {}, b = {}) => ({ x: number(a.x) - number(b.x), y: number(a.y) - number(b.y), z: number(a.z) - number(b.z) });
const scale = (v = {}, s = 1) => ({ x: number(v.x) * number(s), y: number(v.y) * number(s), z: number(v.z) * number(s) });
const length = (v = {}) => Math.hypot(number(v.x), number(v.y), number(v.z));
const normalize = (v = {}, fallback = { x: 0, y: 0, z: -1 }) => {
  const magnitude = length(v);
  return magnitude > EPSILON ? scale(v, 1 / magnitude) : clone(fallback);
};
const cross = (a = {}, b = {}) => ({
  x: number(a.y) * number(b.z) - number(a.z) * number(b.y),
  y: number(a.z) * number(b.x) - number(a.x) * number(b.z),
  z: number(a.x) * number(b.y) - number(a.y) * number(b.x)
});
const dot = (a = {}, b = {}) => number(a.x) * number(b.x) + number(a.y) * number(b.y) + number(a.z) * number(b.z);

function configOverrides(options = {}) {
  return options.stereoscopicRender ?? options.stereo ?? options.config ?? options;
}

function configFrom(options = {}) {
  return {
    ...DEFAULT_STEREOSCOPIC_RENDER_CONFIG,
    ...configOverrides(options)
  };
}

export function basisFromForwardUp(forwardInput = {}, upInput = {}) {
  const forward = normalize(forwardInput, { x: 0, y: 0, z: -1 });
  let up = normalize(upInput, { x: 0, y: 1, z: 0 });
  let right = normalize(cross(forward, up), { x: 1, y: 0, z: 0 });
  if (Math.abs(dot(forward, up)) > 0.98) {
    up = { x: 0, y: 1, z: 0 };
    right = normalize(cross(forward, up), { x: 1, y: 0, z: 0 });
  }
  up = normalize(cross(right, forward), { x: 0, y: 1, z: 0 });
  return { forward, right, up };
}

export function createStereoscopicRenderState(options = {}) {
  const config = configFrom(options);
  return {
    version: STEREOSCOPIC_RENDER_DOMAIN_KIT_VERSION,
    mode: config.mode,
    status: "ready",
    frameId: 0,
    config,
    referenceSpace: String(config.referenceSpace ?? "local-floor"),
    headset: {
      position: { x: 0, y: 1.6, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
      up: { x: 0, y: 1, z: 0 },
      right: { x: 1, y: 0, z: 0 }
    },
    eyes: {
      left: null,
      right: null
    },
    views: [],
    metadata: {
      rendererOwnedRuntimeObjects: false,
      lateLatchPolicy: config.lateLatchPolicy,
      projection: config.projection,
      textureLayout: config.textureLayout
    }
  };
}

export function normalizeStereoCameraInput(camera = {}, options = {}) {
  const config = configFrom(options);
  const position = vec3(camera.position ?? camera.headset?.position ?? camera.pose?.position, { x: 0, y: 1.6, z: 0 });
  const forward = normalize(camera.forward ?? camera.lookDirection ?? camera.headset?.forward ?? sub(camera.lookAt, position), { x: 0, y: 0, z: -1 });
  const basis = basisFromForwardUp(forward, camera.up ?? camera.headset?.up ?? { x: 0, y: 1, z: 0 });
  return {
    position,
    forward: basis.forward,
    right: basis.right,
    up: basis.up,
    fovDegrees: number(camera.fovDegrees ?? camera.fov, config.fovDegrees),
    aspect: number(camera.aspect, config.aspect),
    near: number(camera.near, config.near),
    far: number(camera.far, config.far),
    referenceSpace: camera.referenceSpace ?? config.referenceSpace
  };
}

function viewportForEye(eye, config) {
  if (config.viewportLayout === "side-by-side") {
    return eye === "left"
      ? { x: 0, y: 0, width: 0.5, height: 1 }
      : { x: 0.5, y: 0, width: 0.5, height: 1 };
  }
  return { x: 0, y: 0, width: 1, height: 1 };
}

function makeEyeDescriptor(eye, sign, camera, config, frameId) {
  const halfIpd = clamp(number(config.interpupillaryDistance, 0.064), 0, 0.12) * 0.5;
  const eyeOffset = scale(camera.right, sign * halfIpd);
  const position = add(camera.position, eyeOffset, 1);
  const convergenceDistance = Math.max(0.001, number(config.convergenceDistance, 10));
  const focusPoint = add(camera.position, camera.forward, convergenceDistance);
  const projectionCenterOffset = config.projection === "parallel-off-axis"
    ? -sign * halfIpd / convergenceDistance
    : 0;

  return {
    eye,
    frameId,
    referenceSpace: String(camera.referenceSpace ?? config.referenceSpace ?? "local-floor"),
    position,
    orientation: {
      forward: clone(camera.forward),
      right: clone(camera.right),
      up: clone(camera.up)
    },
    lookAt: add(position, camera.forward, convergenceDistance),
    focusPoint,
    eyeOffsetMeters: { x: eyeOffset.x, y: eyeOffset.y, z: eyeOffset.z },
    interpupillaryDistance: halfIpd * 2,
    fovDegrees: number(camera.fovDegrees, config.fovDegrees),
    aspect: number(camera.aspect, config.aspect),
    near: number(camera.near, config.near),
    far: number(camera.far, config.far),
    projection: {
      type: String(config.projection ?? "parallel-off-axis"),
      centerOffsetX: projectionCenterOffset,
      convergenceDistance,
      hostProjectionMatrixRequired: false
    },
    viewport: viewportForEye(eye, config),
    renderTarget: {
      layout: String(config.textureLayout ?? "array-layer"),
      layer: eye === "left" ? 0 : 1,
      renderScale: clamp(number(config.renderScale, 1), 0.25, 2)
    }
  };
}

export function computeStereoscopicRenderSnapshot(previous = {}, camera = {}, dt = 1 / 60, options = {}) {
  const config = { ...DEFAULT_STEREOSCOPIC_RENDER_CONFIG, ...(previous.config ?? {}), ...configOverrides(options) };
  const normalizedCamera = normalizeStereoCameraInput(camera, config);
  const frameId = number(camera.frameId ?? previous.frameId, 0) + 1;
  const left = makeEyeDescriptor("left", -1, normalizedCamera, config, frameId);
  const right = makeEyeDescriptor("right", 1, normalizedCamera, config, frameId);

  return {
    version: STEREOSCOPIC_RENDER_DOMAIN_KIT_VERSION,
    mode: config.mode,
    status: "stereo-ready",
    frameId,
    delta: clamp(number(dt, 1 / 60), 0, 0.1),
    config,
    referenceSpace: String(normalizedCamera.referenceSpace ?? config.referenceSpace ?? "local-floor"),
    headset: {
      position: normalizedCamera.position,
      forward: normalizedCamera.forward,
      right: normalizedCamera.right,
      up: normalizedCamera.up
    },
    eyes: { left, right },
    views: [left, right],
    metadata: {
      rendererOwnedRuntimeObjects: false,
      poseSource: config.poseSource,
      lateLatchPolicy: config.lateLatchPolicy,
      projection: config.projection,
      textureLayout: config.textureLayout,
      viewportLayout: config.viewportLayout,
      eyeSeparationMeters: length(sub(right.position, left.position)),
      headToFocusMeters: number(config.convergenceDistance, 10)
    }
  };
}

export function createStereoscopicRenderDomainKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const StereoscopicRenderState = resource(options.resourceName ?? "stereoscopicRender.state");
  const StereoscopicRenderRequested = event("stereoscopicRender.requested");
  const StereoscopicRenderUpdated = event("stereoscopicRender.updated");
  const StereoscopicRenderConfigured = event("stereoscopicRender.configured");
  const initial = () => createStereoscopicRenderState(options);

  function setState(world, next, reason = "stereo") {
    world.setResource(StereoscopicRenderState, next);
    world.emit(StereoscopicRenderUpdated, { reason, state: clone(next) });
    return next;
  }

  function system(world) {
    let state = ensureResource(world, StereoscopicRenderState, initial);
    for (const event of world.readEvents(StereoscopicRenderRequested)) {
      state = computeStereoscopicRenderSnapshot(state, event.camera ?? event.pose ?? event, event.dt ?? world?.__nexusClock?.delta ?? 1 / 60, event.config ?? {});
      world.setResource(StereoscopicRenderState, state);
      world.emit(StereoscopicRenderUpdated, { reason: "request", state: clone(state) });
    }
  }

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "stereoscopic-render-domain-kit",
    resources: { StereoscopicRenderState },
    events: { StereoscopicRenderRequested, StereoscopicRenderUpdated, StereoscopicRenderConfigured },
    systems: [{ phase: "render", name: "stereoscopicRenderDomainSystem", system }],
    provides: ["render:stereoscopic-views", "xr:stereo-render-state", "xr:eye-view-descriptors"],
    requires: options.requires ?? ["camera:state"],
    initWorld({ world }) { ensureResource(world, StereoscopicRenderState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, StereoscopicRenderState, initial);
      engine.stereoscopicRender = {
        getState: state,
        requestFrame(payload = {}) {
          world.emit(StereoscopicRenderRequested, payload);
          return state();
        },
        updateFromCamera(camera = {}, dt = 1 / 60, config = {}) {
          return setState(world, computeStereoscopicRenderSnapshot(state(), camera, dt, config), "camera");
        },
        submitHeadPose(pose = {}, dt = 1 / 60) {
          return setState(world, computeStereoscopicRenderSnapshot(state(), pose, dt, { poseSource: pose.source ?? "head-pose" }), "pose");
        },
        configure(config = {}) {
          const next = { ...state(), config: { ...(state().config ?? {}), ...clone(config) } };
          world.setResource(StereoscopicRenderState, next);
          world.emit(StereoscopicRenderConfigured, { config: clone(next.config), state: clone(next) });
          return next;
        },
        getStereoSnapshot() {
          return clone(state());
        },
        reset() {
          return setState(world, initial(), "reset");
        },
        snapshot() {
          return clone(state());
        }
      };
    },
    bindings: { StereoscopicRenderState },
    metadata: {
      version: STEREOSCOPIC_RENDER_DOMAIN_KIT_VERSION,
      purpose: "Renderer-agnostic stereoscopic rendering domain kit that converts a host camera/head pose into deterministic left/right eye descriptors without owning WebXR, OpenXR, swapchains, framebuffers, Canvas, or Three.js objects.",
      status: "experimental",
      category: "xr-render-domain-kit"
    }
  });
}

export default createStereoscopicRenderDomainKit;
