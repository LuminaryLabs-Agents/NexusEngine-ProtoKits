import {
  createThreeTreeRenderAdapter as createLegacyThreeTreeRenderAdapter,
  createThreeTreeRenderAdapterKit as createLegacyThreeTreeRenderAdapterKit
} from "./legacy.js";

export const THREE_TREE_RENDER_ADAPTER_KIT_VERSION = "0.1.2";

const NOOP_SHADER_HOOK = () => {};
const HARD_LOD_CACHE_KEY = () => "nexus-tree-hard-lod-v1";

export function evaluateIndexedFacing(geometry, options = {}) {
  const position = geometry?.getAttribute?.("position");
  const normal = geometry?.getAttribute?.("normal");
  const index = geometry?.getIndex?.();
  const indices = index?.array ?? index;
  const triangleCount = Math.floor((indices?.length ?? 0) / 3);
  const maxSamples = Math.max(1, Math.floor(options.maxSamples ?? 4096));

  if (!position || !normal || !indices || triangleCount === 0) {
    return {
      valid: false,
      triangleCount,
      sampledTriangles: 0,
      outward: 0,
      inward: 0,
      degenerate: 0,
      averageDot: 0,
      reason: "indexed position and normal attributes are required"
    };
  }

  const stride = Math.max(1, Math.floor(triangleCount / maxSamples));
  let sampledTriangles = 0;
  let outward = 0;
  let inward = 0;
  let degenerate = 0;
  let dotTotal = 0;

  for (let triangle = 0; triangle < triangleCount; triangle += stride) {
    const offset = triangle * 3;
    const ia = indices[offset];
    const ib = indices[offset + 1];
    const ic = indices[offset + 2];

    const ax = position.getX(ia);
    const ay = position.getY(ia);
    const az = position.getZ(ia);
    const abx = position.getX(ib) - ax;
    const aby = position.getY(ib) - ay;
    const abz = position.getZ(ib) - az;
    const acx = position.getX(ic) - ax;
    const acy = position.getY(ic) - ay;
    const acz = position.getZ(ic) - az;

    let fx = aby * acz - abz * acy;
    let fy = abz * acx - abx * acz;
    let fz = abx * acy - aby * acx;
    const faceLength = Math.hypot(fx, fy, fz);

    if (faceLength <= 1e-10) {
      degenerate += 1;
      continue;
    }

    fx /= faceLength;
    fy /= faceLength;
    fz /= faceLength;

    let nx = normal.getX(ia) + normal.getX(ib) + normal.getX(ic);
    let ny = normal.getY(ia) + normal.getY(ib) + normal.getY(ic);
    let nz = normal.getZ(ia) + normal.getZ(ib) + normal.getZ(ic);
    const normalLength = Math.hypot(nx, ny, nz) || 1;
    nx /= normalLength;
    ny /= normalLength;
    nz /= normalLength;

    const facingDot = fx * nx + fy * ny + fz * nz;
    dotTotal += facingDot;
    sampledTriangles += 1;

    if (facingDot >= -1e-5) outward += 1;
    else inward += 1;
  }

  const averageDot = sampledTriangles ? dotTotal / sampledTriangles : 0;
  return {
    valid: sampledTriangles > 0 && inward === 0 && averageDot > 0,
    triangleCount,
    sampledTriangles,
    outward,
    inward,
    degenerate,
    averageDot,
    reason: inward
      ? `${inward} sampled triangles face inward`
      : sampledTriangles
        ? null
        : "all sampled triangles were degenerate"
  };
}

function correctedIndex(index) {
  const source = index?.array ?? index;
  if (!source || typeof source.length !== "number") return index;

  const next = ArrayBuffer.isView(source)
    ? new source.constructor(source)
    : Array.from(source);

  for (let offset = 0; offset + 2 < next.length; offset += 3) {
    const second = next[offset + 1];
    next[offset + 1] = next[offset + 2];
    next[offset + 2] = second;
  }

  return next;
}

function buildWithCorrectedBranchWinding(config, build) {
  const prototype = config.THREE.BufferGeometry.prototype;
  const originalSetIndex = prototype.setIndex;

  prototype.setIndex = function setCorrectedTreeIndex(index) {
    const isSweptBranchGeometry = Boolean(
      this.getAttribute?.("normal") &&
      this.getAttribute?.("uv2")
    );

    const result = originalSetIndex.call(
      this,
      isSweptBranchGeometry ? correctedIndex(index) : index
    );

    if (isSweptBranchGeometry) {
      const facing = evaluateIndexedFacing(this);
      this.userData.facing = facing;
      if (!facing.valid) {
        throw new Error(
          `Generated branch geometry has invalid face orientation: ${facing.reason ?? "unknown error"}.`
        );
      }
    }

    return result;
  };

  try {
    return build();
  } finally {
    prototype.setIndex = originalSetIndex;
  }
}

function buildWithoutLegacyShaderInjection(config, build) {
  const prototype = config.THREE.Material.prototype;
  const onBeforeCompileDescriptor = Object.getOwnPropertyDescriptor(
    prototype,
    "onBeforeCompile"
  );
  const cacheKeyDescriptor = Object.getOwnPropertyDescriptor(
    prototype,
    "customProgramCacheKey"
  );

  Object.defineProperty(prototype, "onBeforeCompile", {
    configurable: true,
    get() {
      return NOOP_SHADER_HOOK;
    },
    set() {
      // Ignore the legacy malformed shader hook while the asset and atlas are built.
    }
  });

  Object.defineProperty(prototype, "customProgramCacheKey", {
    configurable: true,
    get() {
      return HARD_LOD_CACHE_KEY;
    },
    set() {
      // Ignore the legacy shader-specific program cache key.
    }
  });

  try {
    return build();
  } finally {
    if (onBeforeCompileDescriptor) {
      Object.defineProperty(
        prototype,
        "onBeforeCompile",
        onBeforeCompileDescriptor
      );
    } else {
      delete prototype.onBeforeCompile;
    }

    if (cacheKeyDescriptor) {
      Object.defineProperty(
        prototype,
        "customProgramCacheKey",
        cacheKeyDescriptor
      );
    } else {
      delete prototype.customProgramCacheKey;
    }
  }
}

function removeLegacyFadeState(asset) {
  asset.root.traverse((object) => {
    const materials = object.material
      ? Array.isArray(object.material)
        ? object.material
        : [object.material]
      : [];

    for (const material of materials) {
      if (Object.prototype.hasOwnProperty.call(material, "onBeforeCompile")) {
        delete material.onBeforeCompile;
      }
      if (Object.prototype.hasOwnProperty.call(material, "customProgramCacheKey")) {
        delete material.customProgramCacheKey;
      }
      if (material.userData?.fadeUniform) {
        delete material.userData.fadeUniform;
      }
      material.needsUpdate = true;
    }
  });

  return asset;
}

function applyHardLod(asset, level) {
  const activeLevel = Math.max(
    0,
    Math.min(asset.levels.length - 1, Number(level) || 0)
  );

  asset.levels.forEach((group, index) => {
    group.visible = index === activeLevel;
  });

  asset.currentLevel = activeLevel;
  return activeLevel;
}

export function createThreeTreeRenderAdapter(config = {}) {
  if (!config.THREE || !config.renderer) {
    throw new TypeError("Three tree adapter requires injected THREE and renderer values.");
  }

  const legacy = createLegacyThreeTreeRenderAdapter(config);

  return Object.freeze({
    ...legacy,
    buildAsset(input = {}) {
      const asset = buildWithoutLegacyShaderInjection(
        config,
        () => buildWithCorrectedBranchWinding(
          config,
          () => legacy.buildAsset(input)
        )
      );

      return removeLegacyFadeState(asset);
    },
    updateAsset(asset, camera, mode = "auto") {
      const state = legacy.updateAsset(asset, camera, mode);
      const activeLevel = applyHardLod(asset, state.activeLevel);
      return {
        ...state,
        activeLevel,
        weights: asset.levels.map((_, index) => index === activeLevel ? 1 : 0)
      };
    }
  });
}

export function createThreeTreeRenderAdapterKit(config = {}) {
  const legacyKit = createLegacyThreeTreeRenderAdapterKit(config);
  return Object.freeze({
    ...legacyKit,
    version: THREE_TREE_RENDER_ADAPTER_KIT_VERSION,
    createApi() {
      return createThreeTreeRenderAdapter(config);
    }
  });
}

export default createThreeTreeRenderAdapterKit;
