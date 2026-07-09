import { clamp, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const BANDED_INFINITE_TERRAIN_KIT_VERSION = "0.1.0";

export const DEFAULT_BANDED_TERRAIN_BANDS = Object.freeze([
  { id: "focus", radius: 96, spacing: 2, density: 1 },
  { id: "safety", radius: 280, spacing: 6, density: 0.58 },
  { id: "peripheral", radius: 720, spacing: 18, density: 0.28 },
  { id: "horizon", radius: 1400, spacing: 52, density: 0.08 }
]);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function defineResource(NexusEngine, name) {
  return typeof NexusEngine.defineResource === "function" ? NexusEngine.defineResource(name) : `resource:${name}`;
}

function vec2(value = {}, fallback = {}) {
  return {
    x: number(value.x, number(fallback.x, 0)),
    z: number(value.z, number(fallback.z, 0))
  };
}

function normalize2(value = {}, fallback = { x: 0, z: 1 }) {
  const x = number(value.x, 0);
  const z = number(value.z, 0);
  const length = Math.hypot(x, z);
  return length > 0.000001 ? { x: x / length, z: z / length } : { ...fallback };
}

function snapValue(value, snapSize) {
  return Math.floor(number(value) / Math.max(0.0001, snapSize)) * Math.max(0.0001, snapSize);
}

export function createBandedTerrainState(options = {}) {
  const bands = (options.bands ?? DEFAULT_BANDED_TERRAIN_BANDS).map((band) => ({ ...band }));
  const snapSize = number(options.snapSize, bands[0]?.spacing ?? 2);
  const camera = vec2(options.camera, { x: 0, z: 0 });
  const snapped = { x: snapValue(camera.x, snapSize), z: snapValue(camera.z, snapSize) };
  return {
    id: options.id ?? "banded-infinite-terrain",
    version: BANDED_INFINITE_TERRAIN_KIT_VERSION,
    frame: 0,
    bands,
    origin: {
      snapSize,
      exactCamera: camera,
      smoothedCamera: camera,
      exactForward: normalize2(options.cameraForward),
      smoothedForward: normalize2(options.cameraForward),
      snapped,
      previous: snapped,
      fractionalOffset: { x: camera.x - snapped.x, z: camera.z - snapped.z },
      rebaseCount: 0,
      changed: false
    },
    topology: {
      kind: "single-fixed-radial-surface",
      rings: number(options.rings, 112),
      segments: number(options.segments, 224),
      radialPower: number(options.radialPower, 2.25),
      maxRadius: number(options.maxRadius, bands.at(-1)?.radius ?? 1400),
      stableBuffers: true,
      noSquarePatchLod: true,
      noCameraMoveRebuild: true
    },
    shaderField: {
      sampleSpace: "snapped-world-origin",
      displacement: "shader-owned",
      density: "banded-distance-view-policy",
      normalEpsilon: number(options.normalEpsilon, Math.max(4, snapSize * 2))
    },
    validation: {
      oneRenderContract: true,
      terrainIsField: true,
      noPatchEntities: true,
      noRawCameraFloatSampling: true,
      noCpuGeometryRebuildOnCameraMove: true,
      shaderOwnsDisplacement: true
    }
  };
}

export function advanceBandedTerrainState(state, input = {}) {
  const dt = clamp(number(input.dt, 1 / 60), 0, 1);
  const snapSize = number(input.snapSize, state.origin.snapSize);
  const camera = vec2(input.camera, state.origin.exactCamera);
  const forward = normalize2(input.cameraForward, state.origin.exactForward);
  const snapped = { x: snapValue(camera.x, snapSize), z: snapValue(camera.z, snapSize) };
  const changed = snapped.x !== state.origin.snapped.x || snapped.z !== state.origin.snapped.z;
  const poseAlpha = 1 - Math.exp(-number(input.poseRate, 7.5) * dt);
  const forwardAlpha = 1 - Math.exp(-number(input.forwardRate, 7) * dt);
  const smoothCamera = {
    x: state.origin.smoothedCamera.x + (camera.x - state.origin.smoothedCamera.x) * poseAlpha,
    z: state.origin.smoothedCamera.z + (camera.z - state.origin.smoothedCamera.z) * poseAlpha
  };
  const smoothForward = normalize2({
    x: state.origin.smoothedForward.x + (forward.x - state.origin.smoothedForward.x) * forwardAlpha,
    z: state.origin.smoothedForward.z + (forward.z - state.origin.smoothedForward.z) * forwardAlpha
  }, forward);
  return {
    ...state,
    frame: state.frame + 1,
    origin: {
      ...state.origin,
      snapSize,
      exactCamera: camera,
      exactForward: forward,
      smoothedCamera: smoothCamera,
      smoothedForward: smoothForward,
      previous: changed ? state.origin.snapped : state.origin.previous,
      snapped,
      fractionalOffset: { x: camera.x - snapped.x, z: camera.z - snapped.z },
      rebaseCount: state.origin.rebaseCount + (changed ? 1 : 0),
      changed
    }
  };
}

export function sampleBandedTerrainDensity(state, point = {}) {
  const p = vec2(point, { x: 0, z: 0 });
  const camera = state.origin.smoothedCamera;
  const forward = normalize2(state.origin.smoothedForward);
  const dx = p.x - camera.x;
  const dz = p.z - camera.z;
  const distance = Math.hypot(dx, dz);
  const direction = normalize2({ x: dx, z: dz });
  const viewDot = direction.x * forward.x + direction.z * forward.z;
  const selected = state.bands.find((band) => distance <= number(band.radius, 0)) ?? state.bands.at(-1);
  const farRadius = number(state.bands.at(-1)?.radius, 1);
  return {
    point: p,
    distance,
    viewDot,
    band: selected?.id ?? "horizon",
    spacing: selected?.spacing ?? 64,
    density: clamp(number(selected?.density, 0) + clamp((viewDot + 0.25) / 1.25, 0, 1) * 0.18, 0, 1),
    distanceScore: 1 - clamp(distance / farRadius, 0, 1)
  };
}

export function createBandedTerrainRenderContract(state) {
  return {
    id: "banded-infinite-terrain.renderContract",
    version: BANDED_INFINITE_TERRAIN_KIT_VERSION,
    topology: clone(state.topology),
    uniforms: {
      terrainOriginSnapped: clone(state.origin.snapped),
      terrainOriginPrevious: clone(state.origin.previous),
      cameraExact: clone(state.origin.exactCamera),
      cameraSmoothed: clone(state.origin.smoothedCamera),
      cameraForwardSmoothed: clone(state.origin.smoothedForward),
      fractionalCameraOffset: clone(state.origin.fractionalOffset),
      snapSize: state.origin.snapSize,
      normalEpsilon: state.shaderField.normalEpsilon
    },
    bands: clone(state.bands),
    shaderField: clone(state.shaderField),
    constraints: clone(state.validation)
  };
}

export function validateBandedTerrainContract(contract = {}) {
  const failures = [];
  if (contract.topology?.kind !== "single-fixed-radial-surface") failures.push("expected one fixed radial surface");
  if (contract.topology?.noSquarePatchLod !== true) failures.push("square patch LOD must stay disabled");
  if (contract.topology?.noCameraMoveRebuild !== true) failures.push("camera movement must not rebuild CPU geometry");
  if (contract.constraints?.noRawCameraFloatSampling !== true) failures.push("terrain sampling must use snapped origin, not raw camera floats");
  if (contract.constraints?.shaderOwnsDisplacement !== true) failures.push("shader must own displacement");
  if (number(contract.uniforms?.snapSize, 0) <= 0) failures.push("snapSize must be positive");
  return { passed: failures.length === 0, failures };
}

export function createBandedInfiniteTerrainKit(NexusEngine = {}, options = {}) {
  const State = defineResource(NexusEngine, options.resourceName ?? "bandedInfiniteTerrain.state");
  return defineInjectedRuntimeKit(NexusEngine, {
    id: options.kitId ?? "banded-infinite-terrain-kit",
    provides: ["terrain:banded-infinite-terrain", "terrain:stable-origin", "terrain:radial-topology", "terrain:render-contract"],
    resources: { State },
    systems: [],
    initWorld({ world }) {
      world.setResource(State, createBandedTerrainState(options));
    },
    install({ engine, world }) {
      engine.bandedInfiniteTerrain = {
        getState: () => world.getResource(State),
        getSnapshot: () => clone(world.getResource(State)),
        updateCamera(camera = {}, dt = 1 / 60) {
          const next = advanceBandedTerrainState(world.getResource(State), { camera, cameraForward: camera.forward ?? camera.cameraForward, dt });
          world.setResource(State, next);
          return next;
        },
        setBands(bands = []) {
          const next = { ...world.getResource(State), bands: bands.map((band) => ({ ...band })) };
          world.setResource(State, next);
          return next;
        },
        sampleDensity: (point = {}) => sampleBandedTerrainDensity(world.getResource(State), point),
        getRenderContract: () => createBandedTerrainRenderContract(world.getResource(State)),
        validate() { return validateBandedTerrainContract(this.getRenderContract()); },
        reset() {
          const next = createBandedTerrainState(options);
          world.setResource(State, next);
          return next;
        }
      };
      engine.genericInfiniteTerrain ??= engine.bandedInfiniteTerrain;
    },
    metadata: {
      version: BANDED_INFINITE_TERRAIN_KIT_VERSION,
      domain: "banded-infinite-terrain",
      purpose: "Top-level banded infinite terrain bundle with stable origin rebasing and shader-owned displacement contracts."
    }
  });
}

export const createBandedInfiniteTerrainBundleKit = createBandedInfiniteTerrainKit;
export default createBandedInfiniteTerrainKit;
