export const GENERIC_TETHER_TRAVERSAL_DOMAIN_KITS_VERSION = "0.1.0";
export const GENERIC_TETHER_MOTION_KIT_VERSION = "0.1.0";
export const GENERIC_CABLE_LAUNCH_KIT_VERSION = "0.1.0";
export const GENERIC_TRAVERSAL_VITALS_KIT_VERSION = "0.1.0";
export const GENERIC_TRAVERSAL_RECOVERY_KIT_VERSION = "0.1.0";
export const GENERIC_TRAVERSAL_CAMERA_KIT_VERSION = "0.1.0";
export const GENERIC_TRAVERSAL_CUE_KIT_VERSION = "0.1.0";
export const GENERIC_TRAVERSAL_FEEDBACK_KIT_VERSION = "0.1.0";
export const GENERIC_ROUTE_PACING_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireRuntime(NexusRealtime, factoryName) {
  for (const key of ["defineRuntimeKit", "defineResource"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`${factoryName} requires NexusRealtime.${key}.`);
  }
}

function createConfigKit(NexusRealtime, config = {}, shape) {
  requireRuntime(NexusRealtime, shape.factoryName);
  const State = NexusRealtime.defineResource(config.resourceName ?? shape.resourceName);
  const createState = () => ({ version: shape.version, id: config.id ?? shape.id, status: "ready", settings: { ...shape.defaults, ...(config.settings ?? config) }, lastReason: "initialized" });
  return NexusRealtime.defineRuntimeKit({
    id: config.kitId ?? shape.kitId,
    provides: shape.provides,
    resources: { [shape.stateName]: State },
    initWorld({ world }) { world.setResource(State, createState()); },
    install({ engine, world }) {
      engine[shape.apiName] = {
        resources: { [shape.stateName]: State },
        getState: () => world.getResource(State),
        getSettings: () => world.getResource(State)?.settings ?? { ...shape.defaults },
        configure(patch = {}, reason = "configure") {
          const current = world.getResource(State) ?? createState();
          const next = { ...current, settings: { ...(current.settings ?? {}), ...patch }, lastReason: reason };
          world.setResource(State, next);
          return next;
        },
        reset() { const next = createState(); world.setResource(State, next); return next; }
      };
    },
    metadata: { version: shape.version, domain: shape.domain, purpose: shape.purpose }
  });
}

export const tetherMotionDefaults = Object.freeze({
  gravityBase: 0.049,
  gravityPerSector: 0.0022,
  ropeLength: 52,
  maxCableLength: 168,
  swingInputTorque: 0.0049,
  angularDamping: 0.9915,
  windPerSector: 0.004,
  windCoupling: 14,
  idleDrainPerFrame: 0.011,
  inputDrainPerFrame: 0.046,
  reelPull: 0.72,
  reelDamping: 0.958,
  reelGravityScale: 0.32,
  reelShortenRate: 2.2,
  wallBounce: 0.62,
  airControl: 0.12,
  ropeSlack: 7,
  launchSlack: 12,
  retractSlack: 10
});

export const cableLaunchDefaults = Object.freeze({
  projectileSpeed: 10.8,
  liftBoost: 0.52,
  launchOffset: 9,
  maxProbeTicks: 86,
  retractSpeed: 18,
  latchRadius: 12,
  sweepRadius: 8,
  sameAnchorIgnoreTicks: 8,
  launchStaminaCost: 3,
  aimAssistRadius: 28,
  aimAssistDistance: 185,
  aimAssistStrength: 0.72,
  nearMissRadius: 14
});

export const traversalVitalsDefaults = Object.freeze({ maxStamina: 115, criticalStamina: 24, restRestore: 58, exhaustedRelease: true, lowStaminaCue: 0.24, recoveryPerSecond: 4.5 });
export const traversalRecoveryDefaults = Object.freeze({ scaffoldBoundary: 176, failFloorDistance: 520, restartMessage: "Anchor reset. Re-enter the route with a cleaner swing.", nextSectorMessage: "Next sector generated. Route pressure increased." });
export const traversalCameraDefaults = Object.freeze({ z: 232, leadY: 68, swingFollow: 0.046, fallFollow: 0.094, lookAtZ: 0, anticipationY: 22, traumaDecay: 0.88 });
export const traversalCueDefaults = Object.freeze({ actionHint: "Release / fire", swingHint: "Build arc, then release", fallHint: "Aim and fire before the floor drops away", restHint: "Restore unit", summitHint: "Summit beam", maxVisibleUi: 2 });
export const traversalFeedbackDefaults = Object.freeze({ trailMax: 44, sparksOnLatch: 14, sparksOnWall: 18, cameraImpulseLatch: 0.16, cameraImpulseFail: 0.38, audioEventNames: ["released", "grapple-fired", "grapple-latched", "restored", "failed", "summit-reached"] });
export const routePacingDefaults = Object.freeze({ summitBaseY: 2200, summitPerSectorY: 760, sampleSpacingY: 125, minAnchors: 14, jitterX: 165, jitterY: 36, minSpacing: 54, maxEdgeDistance: 205, restEvery: 4, anchorRadius: 6.5 });

export function createGenericTetherMotionKit(NexusRealtime, config = {}) { return createConfigKit(NexusRealtime, config, { factoryName: "createGenericTetherMotionKit", kitId: "generic-tether-motion-kit", id: "tether-motion", resourceName: "genericTetherMotion.state", stateName: "TetherMotionState", apiName: "tetherMotion", version: GENERIC_TETHER_MOTION_KIT_VERSION, domain: "traversal", provides: ["traversal:tether-motion"], defaults: tetherMotionDefaults, purpose: "Reusable tether and swing motion tuning." }); }
export function createGenericCableLaunchKit(NexusRealtime, config = {}) { return createConfigKit(NexusRealtime, config, { factoryName: "createGenericCableLaunchKit", kitId: "generic-cable-launch-kit", id: "cable-launch", resourceName: "genericCableLaunch.state", stateName: "CableLaunchState", apiName: "cableLaunch", version: GENERIC_CABLE_LAUNCH_KIT_VERSION, domain: "traversal", provides: ["traversal:cable-launch"], defaults: cableLaunchDefaults, purpose: "Reusable projectile cable launch, latch, retract, and aim assist tuning." }); }
export function createGenericTraversalVitalsKit(NexusRealtime, config = {}) { return createConfigKit(NexusRealtime, config, { factoryName: "createGenericTraversalVitalsKit", kitId: "generic-traversal-vitals-kit", id: "traversal-vitals", resourceName: "genericTraversalVitals.state", stateName: "TraversalVitalsState", apiName: "traversalVitals", version: GENERIC_TRAVERSAL_VITALS_KIT_VERSION, domain: "traversal", provides: ["traversal:vitals"], defaults: traversalVitalsDefaults, purpose: "Reusable stamina and traversal vital tuning." }); }
export function createGenericTraversalRecoveryKit(NexusRealtime, config = {}) { return createConfigKit(NexusRealtime, config, { factoryName: "createGenericTraversalRecoveryKit", kitId: "generic-traversal-recovery-kit", id: "traversal-recovery", resourceName: "genericTraversalRecovery.state", stateName: "TraversalRecoveryState", apiName: "traversalRecovery", version: GENERIC_TRAVERSAL_RECOVERY_KIT_VERSION, domain: "traversal", provides: ["traversal:recovery"], defaults: traversalRecoveryDefaults, purpose: "Reusable fail floor, boundary, checkpoint, and retry tuning." }); }
export function createGenericTraversalCameraKit(NexusRealtime, config = {}) { return createConfigKit(NexusRealtime, config, { factoryName: "createGenericTraversalCameraKit", kitId: "generic-traversal-camera-kit", id: "traversal-camera", resourceName: "genericTraversalCamera.state", stateName: "TraversalCameraState", apiName: "traversalCamera", version: GENERIC_TRAVERSAL_CAMERA_KIT_VERSION, domain: "camera", provides: ["camera:traversal-framing"], defaults: traversalCameraDefaults, purpose: "Reusable traversal camera framing and anticipation tuning." }); }
export function createGenericTraversalCueKit(NexusRealtime, config = {}) { return createConfigKit(NexusRealtime, config, { factoryName: "createGenericTraversalCueKit", kitId: "generic-traversal-cue-kit", id: "traversal-cue", resourceName: "genericTraversalCue.state", stateName: "TraversalCueState", apiName: "traversalCue", version: GENERIC_TRAVERSAL_CUE_KIT_VERSION, domain: "feedback", provides: ["feedback:diegetic-cues"], defaults: traversalCueDefaults, purpose: "Reusable diegetic cue copy and cue budget." }); }
export function createGenericTraversalFeedbackKit(NexusRealtime, config = {}) { return createConfigKit(NexusRealtime, config, { factoryName: "createGenericTraversalFeedbackKit", kitId: "generic-traversal-feedback-kit", id: "traversal-feedback", resourceName: "genericTraversalFeedback.state", stateName: "TraversalFeedbackState", apiName: "traversalFeedback", version: GENERIC_TRAVERSAL_FEEDBACK_KIT_VERSION, domain: "feedback", provides: ["feedback:kinetic-traversal"], defaults: traversalFeedbackDefaults, purpose: "Reusable trails, sparks, camera impulses, and audio event mapping." }); }
export function createGenericRoutePacingKit(NexusRealtime, config = {}) { return createConfigKit(NexusRealtime, config, { factoryName: "createGenericRoutePacingKit", kitId: "generic-route-pacing-kit", id: "route-pacing", resourceName: "genericRoutePacing.state", stateName: "RoutePacingState", apiName: "routePacing", version: GENERIC_ROUTE_PACING_KIT_VERSION, domain: "route", provides: ["route:pacing"], defaults: routePacingDefaults, purpose: "Reusable route height, anchor density, rest cadence, and jitter tuning." }); }

export function createGenericTetherTraversalDomainKits(NexusRealtime, config = {}) {
  return [
    createGenericRoutePacingKit(NexusRealtime, config.routePacing ?? {}),
    createGenericTetherMotionKit(NexusRealtime, config.tetherMotion ?? {}),
    createGenericCableLaunchKit(NexusRealtime, config.cableLaunch ?? {}),
    createGenericTraversalVitalsKit(NexusRealtime, config.traversalVitals ?? config.vitals ?? {}),
    createGenericTraversalRecoveryKit(NexusRealtime, config.traversalRecovery ?? config.recovery ?? {}),
    createGenericTraversalCameraKit(NexusRealtime, config.traversalCamera ?? config.camera ?? {}),
    createGenericTraversalCueKit(NexusRealtime, config.traversalCue ?? config.cues ?? {}),
    createGenericTraversalFeedbackKit(NexusRealtime, config.traversalFeedback ?? config.feedback ?? {})
  ];
}

export const genericTetherTraversalDomainKitOrder = Object.freeze(["generic-route-pacing-kit", "generic-tether-motion-kit", "generic-cable-launch-kit", "generic-traversal-vitals-kit", "generic-traversal-recovery-kit", "generic-traversal-camera-kit", "generic-traversal-cue-kit", "generic-traversal-feedback-kit"]);
export function createGenericTetherTraversalPreset(overrides = {}) {
  return {
    routePacing: { settings: { ...routePacingDefaults, ...(overrides.routePacing ?? {}) } },
    tetherMotion: { settings: { ...tetherMotionDefaults, ...(overrides.tetherMotion ?? {}) } },
    cableLaunch: { settings: { ...cableLaunchDefaults, ...(overrides.cableLaunch ?? {}) } },
    traversalVitals: { settings: { ...traversalVitalsDefaults, ...(overrides.traversalVitals ?? overrides.vitals ?? {}) } },
    traversalRecovery: { settings: { ...traversalRecoveryDefaults, ...(overrides.traversalRecovery ?? overrides.recovery ?? {}) } },
    traversalCamera: { settings: { ...traversalCameraDefaults, ...(overrides.traversalCamera ?? overrides.camera ?? {}) } },
    traversalCue: { settings: { ...traversalCueDefaults, ...(overrides.traversalCue ?? overrides.cues ?? {}) } },
    traversalFeedback: { settings: { ...traversalFeedbackDefaults, ...(overrides.traversalFeedback ?? overrides.feedback ?? {}) } }
  };
}
