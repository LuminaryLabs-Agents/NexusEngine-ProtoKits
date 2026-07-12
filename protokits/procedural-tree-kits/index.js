export {
  DEFAULT_TREE_PRESET,
  PROCEDURAL_TREE_DOMAIN_KIT_VERSION,
  createProceduralTreeApi,
  createProceduralTreeDomainKit,
  createTreeObjectDescriptor,
  generateTreeDescriptor,
  normalizeTreePreset,
  validateTreeDescriptor
} from "./kits/procedural-tree-domain-kit/index.js";
export {
  PROCEDURAL_TREE_PBR_FIELD_KIT_VERSION,
  createProceduralTreePbrFieldApi,
  createProceduralTreePbrFieldKit,
  generateProceduralTreePbrFields,
  validatePbrFieldSet
} from "./kits/procedural-tree-pbr-field-kit/index.js";
export {
  DEFAULT_IMPOSTOR_DESCRIPTOR,
  DEFAULT_TREE_LOD_RECIPES,
  TREE_LOD_DOMAIN_KIT_VERSION,
  createTreeLodApi,
  createTreeLodDescriptor,
  createTreeLodDomainKit,
  estimateTreeLodTriangles,
  selectImpostorFrame,
  validateTreeLodDescriptor,
  weightsAtDistance
} from "./kits/tree-lod-domain-kit/index.js";
export {
  TREE_ASSET_SNAPSHOT_KIT_VERSION,
  createTreeAssetSnapshot,
  createTreeAssetSnapshotApi,
  createTreeAssetSnapshotKit,
  validateTreeAssetSnapshot
} from "./kits/tree-asset-snapshot-kit/index.js";
export {
  THREE_TREE_RENDER_ADAPTER_KIT_VERSION,
  createThreeTreeRenderAdapter,
  createThreeTreeRenderAdapterKit
} from "./kits/three-tree-render-adapter-kit/index.js";

import {
  createProceduralTreeApi,
  createProceduralTreeDomainKit
} from "./kits/procedural-tree-domain-kit/index.js";
import {
  createProceduralTreePbrFieldApi,
  createProceduralTreePbrFieldKit
} from "./kits/procedural-tree-pbr-field-kit/index.js";
import {
  createTreeLodApi,
  createTreeLodDomainKit
} from "./kits/tree-lod-domain-kit/index.js";
import {
  createTreeAssetSnapshotApi,
  createTreeAssetSnapshotKit
} from "./kits/tree-asset-snapshot-kit/index.js";
import {
  createThreeTreeRenderAdapter
} from "./kits/three-tree-render-adapter-kit/index.js";

export const PROCEDURAL_TREE_KITS_VERSION = "0.2.0";

export function createProceduralTreeSuite(config = {}) {
  const tree = createProceduralTreeApi(config.tree);
  const pbr = createProceduralTreePbrFieldApi(config.pbr);
  const lod = createTreeLodApi(config.lod);
  const snapshots = createTreeAssetSnapshotApi();
  const render = config.three ? createThreeTreeRenderAdapter(config.three) : null;

  return Object.freeze({
    tree,
    pbr,
    lod,
    snapshots,
    render,
    buildDescriptors(input = {}) {
      const treeDescriptor = tree.generate(input);
      const pbrFields = pbr.generate(treeDescriptor, input.pbr);
      const lodDescriptor = lod.register(treeDescriptor, input.lod);
      const objectDescriptor = treeDescriptor.objectDescriptor;
      return {
        treeDescriptor,
        objectDescriptor,
        pbrFields,
        lodDescriptor,
        assetSnapshot: snapshots.package({
          id: input.assetId ?? treeDescriptor.id,
          treeDescriptor,
          pbrFields,
          lodDescriptor,
          render: { objectDescriptor }
        })
      };
    },
    buildThreeAsset(input = {}) {
      if (!render) {
        throw new TypeError("createProceduralTreeSuite requires config.three to build renderer assets.");
      }
      const descriptors = this.buildDescriptors(input);
      const renderAsset = render.buildAsset({
        id: input.assetId ?? descriptors.treeDescriptor.id,
        ...descriptors,
        ...input.render
      });
      return { ...descriptors, renderAsset };
    },
    reset() {
      render?.reset?.();
      snapshots.reset();
      lod.reset();
      pbr.reset();
      tree.reset();
    }
  });
}

export function createProceduralTreeKits(NexusEngine = {}, config = {}) {
  const runtime = typeof NexusEngine?.defineDomainServiceKit === "function" ? NexusEngine : {};
  const options = runtime === NexusEngine ? config : NexusEngine;
  return [
    createProceduralTreeDomainKit(runtime, options.tree ?? {}),
    createProceduralTreePbrFieldKit(runtime, options.pbr ?? {}),
    createTreeLodDomainKit(runtime, options.lod ?? {}),
    createTreeAssetSnapshotKit(runtime)
  ];
}

export default createProceduralTreeKits;
