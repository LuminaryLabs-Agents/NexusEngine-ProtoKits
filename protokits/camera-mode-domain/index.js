import {
  clone,
  createDefinitionFactory,
  defineInjectedRuntimeKit,
  ensureResource,
  number
} from "../protokit-core/index.js";

export const CAMERA_MODE_DOMAIN_VERSION = "0.1.0";

export function resolveCameraMode(radius = 420, thresholds = {}) {
  const orbitMin = number(thresholds.orbitMin, 260);
  const firstPersonEnter = number(thresholds.firstPersonEnter, 90);
  if (radius <= firstPersonEnter) return "first-person";
  if (radius <= orbitMin) return "inspection";
  return "orbit";
}

export function createCameraModeDescriptor(options = {}) {
  const radius = number(options.radius, 420);
  const thresholds = { orbitMin: number(options.thresholds?.orbitMin, 260), firstPersonEnter: number(options.thresholds?.firstPersonEnter, 90) };
  const mode = options.mode ?? resolveCameraMode(radius, thresholds);
  return {
    id: options.id ?? "cozy-island-camera-mode",
    type: "camera-mode-descriptor",
    version: CAMERA_MODE_DOMAIN_VERSION,
    mode,
    thresholds,
    orbit: {
      minRadius: number(options.orbit?.minRadius, 120),
      maxRadius: number(options.orbit?.maxRadius, 900),
      moveSpeed: number(options.orbit?.moveSpeed, 38)
    },
    inspection: {
      focusId: options.inspection?.focusId ?? "campfire:central-001",
      targetLerp: number(options.inspection?.targetLerp, 0.08),
      heightMeters: number(options.inspection?.heightMeters, 26)
    },
    firstPerson: {
      anchorId: options.firstPerson?.anchorId ?? "central-clearing:campfire:first-person-spawn-anchor",
      boundsId: options.firstPerson?.boundsId ?? "central-clearing:campfire:collision-boundary",
      eyeHeightMeters: number(options.firstPerson?.eyeHeightMeters, 1.7),
      moveSpeed: number(options.firstPerson?.moveSpeed, 2.6),
      lookSensitivity: number(options.firstPerson?.lookSensitivity, 0.0025),
      exitRadius: number(options.firstPerson?.exitRadius, 125)
    },
    rendererBoundary: { ownsCamera: false, adapterRequired: true }
  };
}

export function createCameraModeState(options = {}) {
  return { id: options.id ?? "camera-mode-domain", version: CAMERA_MODE_DOMAIN_VERSION, descriptor: createCameraModeDescriptor(options) };
}

export function createCameraModeDomainKit(nexusRealtime = {}, options = {}) {
  const defs = createDefinitionFactory(nexusRealtime);
  const State = defs.resource(options.resourceName ?? "cameraMode.state");
  const initial = () => createCameraModeState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.kitId ?? "camera-mode-domain",
    resources: { State },
    provides: ["camera:mode-descriptor", "camera:first-person-mode", "camera:zoom-transition"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const getState = () => ensureResource(world, State, initial);
      engine.cameraMode = {
        getState,
        getSnapshot: () => clone(getState()),
        resolveMode: resolveCameraMode,
        createDescriptor: createCameraModeDescriptor,
        reset() { const next = initial(); world.setResource(State, next); return next; }
      };
      engine.n = engine.n || {};
      engine.n.cameraMode = engine.cameraMode;
    },
    metadata: { version: CAMERA_MODE_DOMAIN_VERSION, domain: "camera-mode", purpose: "Describe orbit, inspection, and first-person camera mode transitions without owning renderer camera objects." }
  });
}

export default createCameraModeDomainKit;
