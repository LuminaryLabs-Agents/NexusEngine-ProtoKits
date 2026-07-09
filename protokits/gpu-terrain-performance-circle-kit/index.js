import { clamp, defineInjectedRuntimeKit, normalize2, number } from "../foundation-kit/index.js";

export const GPU_TERRAIN_PERFORMANCE_CIRCLE_KIT_VERSION = "0.1.0";

export const GPU_TERRAIN_NAMING_RULES = Object.freeze({
  "terrain-*": "renderer-neutral domain logic",
  "gpu-*": "GPU-resident data/work, not necessarily compute",
  "compute-*": "real compute shader/pass work",
  "shader-*": "vertex/fragment/material shader work",
  "webgpu-*": "WebGPU backend adapter",
  "webgl-*": "WebGL fallback adapter",
  "wgpu-*": "Rust/wgpu native/web adapter",
  "vulkan-*": "native Vulkan adapter"
});

export const DEFAULT_DENSITY_BANDS = Object.freeze([
  Object.freeze({
    id: "focus",
    label: "Focus Cone",
    radius: 140,
    spacing: 2,
    scoreFloor: 0.78,
    role: "highest density in the camera view cone and brush focus area"
  }),
  Object.freeze({
    id: "safety",
    label: "Safety Circle",
    radius: 95,
    spacing: 3,
    scoreFloor: 0.58,
    role: "always-available player-centered performance circle"
  }),
  Object.freeze({
    id: "peripheral",
    label: "Peripheral Field",
    radius: 320,
    spacing: 8,
    scoreFloor: 0.26,
    role: "medium/low density side terrain and medium-distance view support"
  }),
  Object.freeze({
    id: "horizon",
    label: "Horizon Skirt",
    radius: 900,
    spacing: 24,
    scoreFloor: 0,
    role: "very sparse geometry plus shader/fog horizon illusion"
  })
]);

export const GPU_TERRAIN_FIRST_BATCH_KITS = Object.freeze([
  "terrain-performance-circle-kit",
  "terrain-density-policy-kit",
  "gpu-terrain-radial-mesh-kit",
  "shader-terrain-height-displacement-kit",
  "shader-terrain-density-debug-kit",
  "gpu-terrain-paint-field-kit",
  "shader-terrain-paint-blend-kit",
  "shader-terrain-slope-material-kit",
  "webgl-terrain-render-adapter-kit",
  "webgpu-terrain-capability-probe-kit",
  "validate-terrain-no-cpu-rebuild-kit",
  "validate-terrain-single-mesh-kit",
  "validate-terrain-performance-circle-kit",
  "smoke-terrain-gpu-render-kit",
  "nexus-terrain-runtime-bridge-kit"
]);

export const GPU_TERRAIN_LATER_WEBGPU_BATCH_KITS = Object.freeze([
  "webgpu-terrain-render-adapter-kit",
  "webgpu-terrain-compute-adapter-kit",
  "compute-terrain-normal-pass-kit",
  "compute-terrain-density-field-kit",
  "compute-terrain-paint-apply-kit",
  "compute-terrain-visibility-field-kit",
  "compute-terrain-screen-error-pass-kit",
  "compute-terrain-indirect-draw-plan-kit",
  "gpu-terrain-storage-buffer-kit",
  "gpu-terrain-storage-texture-kit",
  "gpu-pipeline-cache-kit",
  "gpu-bind-group-cache-kit",
  "gpu-frame-budget-kit",
  "gpu-profiler-kit",
  "validate-terrain-no-readback-stall-kit"
]);

const DEFAULT_POLICY = Object.freeze({
  id: "player-performance-circle-view-cone",
  topology: "fixed-radial-performance-circle",
  backend: "webgl-shader-displaced-first-webgpu-compute-later",
  minSafetyRadius: 95,
  focusDistance: 280,
  peripheralDistance: 560,
  horizonDistance: 900,
  viewConeCosine: 0.45,
  behindCameraPenalty: 0.22,
  brushBoost: 0.25,
  roughnessBoost: 0.15,
  movementReserve: 0.08,
  maxTriangleBudget: 220000,
  noCpuGeometryRebuild: true,
  noSquarePatchLod: true,
  noTerrainPatchEntities: true
});

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function defineResource(NexusEngine, name) {
  return typeof NexusEngine.defineResource === "function" ? NexusEngine.defineResource(name) : `resource:${name}`;
}

function defineEvent(NexusEngine, name) {
  return typeof NexusEngine.defineEvent === "function" ? NexusEngine.defineEvent(name) : `event:${name}`;
}

function runtimeKit(NexusEngine, config) {
  return defineInjectedRuntimeKit(NexusEngine, config);
}

function vec2(value = {}, fallback = {}) {
  return {
    x: number(value.x, number(fallback.x, 0)),
    z: number(value.z ?? value.y, number(fallback.z ?? fallback.y, 0))
  };
}

function normalizeForward(value = {}, fallback = { x: 0, z: 1 }) {
  const normalized = normalize2(value.x, value.z ?? value.y);
  return normalized.length > 0 ? { x: normalized.x, z: normalized.y } : { ...fallback };
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((number(value) - number(edge0)) / Math.max(0.000001, number(edge1) - number(edge0)), 0, 1);
  return t * t * (3 - 2 * t);
}

function distanceWeight(distance, policy) {
  const safety = 1 - smoothstep(0, policy.minSafetyRadius, distance);
  const focus = 1 - smoothstep(policy.minSafetyRadius, policy.focusDistance, distance);
  const peripheral = 1 - smoothstep(policy.focusDistance, policy.peripheralDistance, distance);
  const horizon = 1 - smoothstep(policy.peripheralDistance, policy.horizonDistance, distance);
  return clamp(Math.max(safety * 0.82, focus * 0.66, peripheral * 0.38, horizon * 0.16), 0, 1);
}

function bandForScore(score, bands) {
  const ordered = [...bands].sort((a, b) => b.scoreFloor - a.scoreFloor);
  return clone(ordered.find((band) => score >= band.scoreFloor) ?? ordered[ordered.length - 1]);
}

function estimateRingVertices(radius, spacing) {
  const circumference = Math.max(1, Math.PI * 2 * number(radius));
  const radialSteps = Math.max(1, Math.ceil(number(radius) / Math.max(1, number(spacing))));
  const angularSteps = Math.max(8, Math.ceil(circumference / Math.max(1, number(spacing))));
  return radialSteps * angularSteps;
}

function normalizeBands(bands = DEFAULT_DENSITY_BANDS) {
  return (bands ?? DEFAULT_DENSITY_BANDS).map((band, index) => ({
    id: band.id ?? `band-${index}`,
    label: band.label ?? band.id ?? `Band ${index}`,
    radius: number(band.radius, DEFAULT_DENSITY_BANDS[index]?.radius ?? 100),
    spacing: Math.max(1, number(band.spacing, DEFAULT_DENSITY_BANDS[index]?.spacing ?? 4)),
    scoreFloor: clamp(number(band.scoreFloor, DEFAULT_DENSITY_BANDS[index]?.scoreFloor ?? 0), 0, 1),
    role: band.role ?? "terrain density band"
  }));
}

export function createTerrainDensityPolicy(config = {}) {
  const policy = { ...DEFAULT_POLICY, ...(config.policy ?? config) };
  const bands = normalizeBands(config.bands ?? policy.bands ?? DEFAULT_DENSITY_BANDS);

  function scoreAt(point = {}, context = {}) {
    const player = vec2(context.player ?? context.playerPosition ?? context.camera ?? {});
    const camera = vec2(context.camera ?? context.cameraPosition ?? player, player);
    const forward = normalizeForward(context.forward ?? context.cameraForward ?? { x: 0, z: 1 });
    const target = vec2(point, player);
    const dx = target.x - player.x;
    const dz = target.z - player.z;
    const cameraDx = target.x - camera.x;
    const cameraDz = target.z - camera.z;
    const distance = Math.hypot(dx, dz);
    const cameraDistance = Math.hypot(cameraDx, cameraDz);
    const targetDirection = normalizeForward({ x: cameraDx, z: cameraDz }, forward);
    const viewDot = targetDirection.x * forward.x + targetDirection.z * forward.z;
    const viewWeight = clamp((viewDot - policy.viewConeCosine) / Math.max(0.000001, 1 - policy.viewConeCosine), 0, 1);
    const behindPenalty = viewDot < 0 ? policy.behindCameraPenalty : 1;
    const base = distanceWeight(distance, policy);
    const brush = context.brush ?? null;
    const brushDistance = brush ? Math.hypot(target.x - number(brush.x), target.z - number(brush.z ?? brush.y)) : Infinity;
    const brushRadius = Math.max(1, number(brush?.radius, 1));
    const brushWeight = brush ? (1 - smoothstep(0, brushRadius, brushDistance)) * policy.brushBoost : 0;
    const roughness = clamp(number(context.roughness ?? point.roughness, 0), 0, 1) * policy.roughnessBoost;
    const speed = clamp(number(context.speed ?? context.playerSpeed, 0) / Math.max(1, number(context.maxSpeed, 120)), 0, 1) * policy.movementReserve;
    const focusBoost = viewWeight * 0.32;
    const score = clamp((base + focusBoost + brushWeight + roughness + speed) * behindPenalty, 0, 1);
    return {
      point: target,
      distance,
      cameraDistance,
      viewDot,
      viewWeight,
      score,
      band: bandForScore(score, bands),
      inputs: {
        distanceWeight: base,
        focusBoost,
        brushWeight,
        roughness,
        speed,
        behindPenalty
      }
    };
  }

  function bandAt(point = {}, context = {}) {
    return scoreAt(point, context).band;
  }

  return Object.freeze({
    id: policy.id,
    version: GPU_TERRAIN_PERFORMANCE_CIRCLE_KIT_VERSION,
    policy: clone(policy),
    bands: clone(bands),
    scoreAt,
    bandAt,
    snapshot() {
      return { id: policy.id, policy: clone(policy), bands: clone(bands) };
    }
  });
}

export function createGpuTerrainRadialMeshDescriptor(config = {}) {
  const policy = createTerrainDensityPolicy(config);
  const bands = policy.bands;
  const rings = bands.map((band, index) => {
    const innerRadius = index === 0 ? 0 : bands[index - 1].radius;
    const outerRadius = band.radius;
    const verticesEstimate = estimateRingVertices(outerRadius - innerRadius || outerRadius, band.spacing);
    return {
      id: band.id,
      label: band.label,
      innerRadius,
      outerRadius,
      spacing: band.spacing,
      densityRole: band.role,
      verticesEstimate
    };
  });
  const verticesEstimate = rings.reduce((total, ring) => total + ring.verticesEstimate, 0);
  return Object.freeze({
    id: config.id ?? "gpu-terrain-radial-mesh-descriptor",
    version: GPU_TERRAIN_PERFORMANCE_CIRCLE_KIT_VERSION,
    topology: {
      strategy: "fixed-radial-performance-circle",
      meshCount: 1,
      center: "player-camera-origin",
      rebasesWithCameraUniforms: true,
      rebuildsOnCameraMove: false,
      squarePatchLod: false,
      rings
    },
    estimates: {
      vertices: verticesEstimate,
      triangles: Math.max(0, Math.round(verticesEstimate * 1.85))
    },
    shaderContracts: [
      "shader-terrain-height-displacement-kit",
      "shader-terrain-density-debug-kit",
      "shader-terrain-slope-material-kit",
      "shader-terrain-paint-blend-kit"
    ],
    gpuResourceContracts: [
      "gpu-terrain-paint-field-kit",
      "gpu-terrain-uniform-pack-kit",
      "gpu-terrain-buffer-pool-kit"
    ]
  });
}

export function createGpuTerrainDrawPlan(config = {}, context = {}) {
  const densityPolicy = createTerrainDensityPolicy(config);
  const mesh = createGpuTerrainRadialMeshDescriptor(config);
  const brush = context.brush ?? null;
  const dirtyRegions = brush ? [{
    kind: "brush-dirty-region",
    x: number(brush.x),
    z: number(brush.z ?? brush.y),
    radius: number(brush.radius, 1),
    update: "gpu-paint-texture-subregion"
  }] : [];
  return Object.freeze({
    id: config.id ?? "gpu-terrain-performance-circle-draw-plan",
    version: GPU_TERRAIN_PERFORMANCE_CIRCLE_KIT_VERSION,
    topology: clone(mesh.topology),
    densityPolicy: densityPolicy.snapshot(),
    gpuExecution: {
      cpuSends: ["camera uniform", "player uniform", "brush uniform", "seed/settings uniform", "dirty paint region"],
      gpuOwns: [
        "height sampling",
        "vertex displacement",
        "normal reconstruction",
        "slope/height/biome shading",
        "density debug rendering",
        "paint blend application"
      ],
      forbiddenCpuWork: [
        "terrain vertex generation per frame",
        "terrain normal generation per frame",
        "chunk LOD system",
        "mesh disposal/recreation on camera movement",
        "terrain patch entity iteration",
        "full terrain texture readback"
      ]
    },
    dirtyRegions,
    adapters: {
      first: "webgl-terrain-render-adapter-kit",
      upgrade: "webgpu-terrain-render-adapter-kit",
      nativeFuture: ["wgpu-terrain-render-adapter-kit", "vulkan-terrain-render-adapter-kit"]
    },
    estimates: clone(mesh.estimates),
    performance: {
      cpuGeometryRebuild: false,
      squarePatchLod: false,
      terrainPatchEntities: false,
      stableGpuBuffers: true,
      uniformOnlyCameraMovement: true
    }
  });
}

export function validateGpuTerrainPlan(plan = {}) {
  const errors = [];
  if (plan.performance?.cpuGeometryRebuild !== false) errors.push("CPU geometry rebuild must be disabled");
  if (plan.performance?.squarePatchLod !== false) errors.push("square patch LOD must be disabled");
  if (plan.performance?.terrainPatchEntities !== false) errors.push("terrain patch entities must not be required");
  if (plan.topology?.meshCount !== 1) errors.push("terrain draw topology must describe one mesh");
  if (plan.topology?.strategy !== "fixed-radial-performance-circle") errors.push("topology must be fixed-radial-performance-circle");
  return {
    passed: errors.length === 0,
    errors
  };
}

export function createGpuTerrainPerformanceCircleKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "gpuTerrainPerformanceCircle.state");
  const FrameUpdated = defineEvent(NexusEngine, "gpuTerrainPerformanceCircle.frameUpdated");
  const PolicyChanged = defineEvent(NexusEngine, "gpuTerrainPerformanceCircle.policyChanged");

  function initialState(overrides = {}) {
    const context = {
      player: vec2(overrides.player ?? config.player ?? { x: 0, z: 0 }),
      camera: vec2(overrides.camera ?? config.camera ?? { x: 0, z: 0 }),
      forward: normalizeForward(overrides.forward ?? config.forward ?? { x: 0, z: 1 }),
      brush: overrides.brush ?? config.brush ?? null,
      speed: number(overrides.speed, number(config.speed, 0))
    };
    const policyConfig = { ...config, ...(overrides.policyConfig ?? {}) };
    const drawPlan = createGpuTerrainDrawPlan(policyConfig, context);
    return {
      id: config.id ?? "gpu-terrain-performance-circle",
      version: GPU_TERRAIN_PERFORMANCE_CIRCLE_KIT_VERSION,
      namingRules: clone(GPU_TERRAIN_NAMING_RULES),
      firstBatchKits: [...GPU_TERRAIN_FIRST_BATCH_KITS],
      laterWebGpuBatchKits: [...GPU_TERRAIN_LATER_WEBGPU_BATCH_KITS],
      context,
      policy: createTerrainDensityPolicy(policyConfig).snapshot(),
      drawPlan,
      validation: validateGpuTerrainPlan(drawPlan),
      frame: 0
    };
  }

  function reduceFrame(state, frame = {}) {
    const context = {
      ...state.context,
      ...frame,
      player: vec2(frame.player ?? frame.playerPosition ?? state.context.player),
      camera: vec2(frame.camera ?? frame.cameraPosition ?? state.context.camera),
      forward: normalizeForward(frame.forward ?? frame.cameraForward ?? state.context.forward),
      brush: frame.brush === undefined ? state.context.brush : frame.brush,
      speed: number(frame.speed ?? frame.playerSpeed, state.context.speed)
    };
    const policyConfig = { ...config, ...(frame.policyConfig ?? {}) };
    const drawPlan = createGpuTerrainDrawPlan(policyConfig, context);
    return {
      ...state,
      context,
      policy: createTerrainDensityPolicy(policyConfig).snapshot(),
      drawPlan,
      validation: validateGpuTerrainPlan(drawPlan),
      frame: state.frame + 1
    };
  }

  function system(world) {
    let state = world.getResource(State) ?? initialState();
    for (const event of world.readEvents?.(PolicyChanged) ?? []) state = reduceFrame(state, { policyConfig: event });
    for (const event of world.readEvents?.(FrameUpdated) ?? []) state = reduceFrame(state, event);
    world.setResource(State, state);
  }

  return runtimeKit(NexusEngine, {
    id: config.kitId ?? "gpu-terrain-performance-circle-kit",
    requires: config.requires ?? [],
    provides: [
      "terrain:performance-circle-policy",
      "terrain:density-policy",
      "gpu-terrain:radial-mesh-descriptor",
      "shader-terrain:height-displacement-contract",
      "shader-terrain:density-debug-contract",
      "nexus-terrain:runtime-bridge"
    ],
    resources: { State },
    events: { FrameUpdated, PolicyChanged },
    systems: [{ phase: "simulate", name: "gpuTerrainPerformanceCircleSystem", system }],
    initWorld({ world }) {
      world.setResource(State, initialState());
    },
    install({ engine, world }) {
      const api = {
        events: { FrameUpdated, PolicyChanged },
        getState: () => world.getResource(State),
        getSnapshot: () => clone(world.getResource(State)),
        updateFrame(frame = {}) {
          const state = reduceFrame(world.getResource(State) ?? initialState(), frame);
          world.setResource(State, state);
          return state;
        },
        enqueueFrame(frame = {}) {
          world.emit?.(FrameUpdated, frame);
          return world.getResource(State);
        },
        setPolicy(policyConfig = {}) {
          const state = reduceFrame(world.getResource(State) ?? initialState(), { policyConfig });
          world.setResource(State, state);
          return state;
        },
        scoreAt(point = {}, context = null) {
          const state = world.getResource(State) ?? initialState();
          return createTerrainDensityPolicy({ ...config, bands: state.policy.bands, policy: state.policy.policy }).scoreAt(point, context ?? state.context);
        },
        bandAt(point = {}, context = null) {
          return api.scoreAt(point, context).band;
        },
        getDrawPlan() {
          return world.getResource(State)?.drawPlan ?? createGpuTerrainDrawPlan(config);
        },
        validate() {
          return validateGpuTerrainPlan(api.getDrawPlan());
        },
        runSmoke() {
          const near = api.scoreAt({ x: 8, z: 0 }, { player: { x: 0, z: 0 }, camera: { x: 0, z: 0 }, forward: { x: 1, z: 0 } });
          const far = api.scoreAt({ x: 850, z: 0 }, { player: { x: 0, z: 0 }, camera: { x: 0, z: 0 }, forward: { x: 1, z: 0 } });
          const validation = api.validate();
          return {
            passed: validation.passed && near.score > far.score && api.getDrawPlan().performance.cpuGeometryRebuild === false,
            validation,
            near,
            far
          };
        }
      };
      engine.gpuTerrainPerformanceCircle = api;
      engine.terrainPerformanceCircle ??= api;
      engine.gpuTerrainDrawPlan ??= { getPlan: api.getDrawPlan };
    },
    metadata: {
      version: GPU_TERRAIN_PERFORMANCE_CIRCLE_KIT_VERSION,
      domain: "gpu-terrain-rendering",
      purpose: "GPU-first terrain density and draw-plan kit that replaces square patch LOD with one player-centered performance-circle mesh contract."
    }
  });
}

export default createGpuTerrainPerformanceCircleKit;
