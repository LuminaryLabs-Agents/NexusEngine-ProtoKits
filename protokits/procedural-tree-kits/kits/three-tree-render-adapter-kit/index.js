import {
  createThreeTreeRenderAdapter as createContractLegacyThreeTreeRenderAdapter,
  createThreeTreeRenderAdapterKit as createContractLegacyThreeTreeRenderAdapterKit,
  evaluateIndexedFacing
} from "./contract-legacy.js";
import {
  selectImpostorFrame,
  weightsAtDistance
} from "../tree-lod-domain-kit/index.js";

export { evaluateIndexedFacing };

export const THREE_TREE_RENDER_ADAPTER_KIT_VERSION = "0.2.0";

function activeLevelFromWeights(weights) {
  let level = 0;
  for (let index = 1; index < weights.length; index += 1) {
    if (weights[index] > weights[level]) level = index;
  }
  return level;
}

function applyHardLod(asset, activeLevel) {
  const level = Math.max(0, Math.min(asset.levels.length - 1, Number(activeLevel) || 0));
  asset.levels.forEach((group, index) => {
    group.visible = index === level;
  });
  asset.currentLevel = level;
  return level;
}

function objectPivotWorld(THREE, asset) {
  const pivot = asset.objectDescriptor?.pivot ?? [0, 0, 0];
  asset.root.updateMatrixWorld(true);
  return new THREE.Vector3(...pivot).applyMatrix4(asset.root.matrixWorld);
}

export function createThreeTreeRenderAdapter(config = {}) {
  const { THREE, renderer } = config;
  if (!THREE || !renderer) {
    throw new TypeError("Three tree adapter requires injected THREE and renderer values.");
  }

  const legacy = createContractLegacyThreeTreeRenderAdapter(config);

  return Object.freeze({
    ...legacy,
    buildAsset(input = {}) {
      const objectDescriptor = input.objectDescriptor ?? input.treeDescriptor?.objectDescriptor ?? null;
      const asset = legacy.buildAsset(input);
      asset.objectDescriptor = objectDescriptor;
      asset.captureProfile = input.captureProfile ?? null;
      asset.capturePivot = objectDescriptor?.pivot ?? asset.atlas?.center?.toArray?.() ?? [0, 0, 0];
      asset.groundAnchor = objectDescriptor?.groundAnchor ?? [0, 0, 0];

      if (objectDescriptor && asset.billboard) {
        const bounds = objectDescriptor.bounds;
        const height = Math.max(0.001, bounds.max[1] - bounds.min[1]);
        asset.billboard.position.set(
          objectDescriptor.pivot[0],
          objectDescriptor.groundAnchor[1] + height * 0.5,
          objectDescriptor.pivot[2]
        );
      }

      return asset;
    },
    updateAsset(asset, camera, mode = "auto") {
      const pivotWorld = objectPivotWorld(THREE, asset);
      const viewVector = camera.position.clone().sub(pivotWorld);
      const distance = viewVector.length();
      const automaticWeights = weightsAtDistance(asset.lodDescriptor, distance);
      const requestedLevel = mode === "auto" ? activeLevelFromWeights(automaticWeights) : Number(mode);
      const activeLevel = applyHardLod(asset, requestedLevel);
      const frame = selectImpostorFrame(
        asset.lodDescriptor,
        [viewVector.x, viewVector.y, viewVector.z]
      );
      const impostor = asset.lodDescriptor.impostor;

      asset.atlas.texture.offset.set(
        frame.column / impostor.columns,
        (impostor.rows - 1 - frame.row) / impostor.rows
      );
      asset.billboard.quaternion.copy(camera.quaternion);

      return {
        distance,
        weights: asset.levels.map((_, index) => index === activeLevel ? 1 : 0),
        activeLevel,
        frameIndex: frame.frameIndex,
        capturePivot: [...(asset.objectDescriptor?.pivot ?? asset.capturePivot)]
      };
    }
  });
}

export function createThreeTreeRenderAdapterKit(config = {}) {
  const legacyKit = createContractLegacyThreeTreeRenderAdapterKit(config);
  return Object.freeze({
    ...legacyKit,
    version: THREE_TREE_RENDER_ADAPTER_KIT_VERSION,
    createApi() {
      return createThreeTreeRenderAdapter(config);
    }
  });
}

export default createThreeTreeRenderAdapterKit;
