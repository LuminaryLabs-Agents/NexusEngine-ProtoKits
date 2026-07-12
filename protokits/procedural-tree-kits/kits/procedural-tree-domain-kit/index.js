import { createObjectDescriptor } from "nexusengine";
import {
  DEFAULT_TREE_PRESET,
  PROCEDURAL_TREE_DOMAIN_KIT_VERSION as LEGACY_PROCEDURAL_TREE_DOMAIN_KIT_VERSION,
  createProceduralTreeApi as createLegacyProceduralTreeApi,
  createProceduralTreeDomainKit as createLegacyProceduralTreeDomainKit,
  generateTreeDescriptor as generateLegacyTreeDescriptor,
  normalizeTreePreset,
  validateTreeDescriptor as validateLegacyTreeDescriptor
} from "./legacy.js";

export {
  DEFAULT_TREE_PRESET,
  normalizeTreePreset
};

export const PROCEDURAL_TREE_DOMAIN_KIT_VERSION = "0.2.0";
const clone = (value) => value === undefined ? undefined : structuredClone(value);

export function createTreeObjectDescriptor(treeDescriptor) {
  if (!treeDescriptor || treeDescriptor.schema !== "nexus-tree-descriptor/1") {
    throw new TypeError("Tree object conversion requires nexus-tree-descriptor/1.");
  }
  const bounds = treeDescriptor.bounds;
  const parts = [
    {
      id: "trunk",
      kind: "tree-trunk",
      geometry: {
        provider: "procedural-tree-domain-kit",
        descriptorId: `${treeDescriptor.id}:branches`
      }
    },
    {
      id: "crown",
      parentId: "trunk",
      kind: "tree-crown",
      geometry: {
        provider: "procedural-tree-domain-kit",
        descriptorId: `${treeDescriptor.id}:leaves`
      }
    }
  ];
  return createObjectDescriptor({
    id: treeDescriptor.id,
    objectType: "procedural-tree",
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      scale: [1, 1, 1]
    },
    parts,
    bounds: {
      min: bounds.min,
      max: bounds.max
    },
    pivot: bounds.center,
    groundAnchor: [0, bounds.min[1], 0],
    geometry: {
      provider: "procedural-tree-domain-kit",
      descriptorId: `${treeDescriptor.id}:geometry`,
      contentHash: treeDescriptor.hash,
      metadata: {
        branchCount: treeDescriptor.stats.branchCount,
        leafCount: treeDescriptor.stats.leafCount,
        pointCount: treeDescriptor.stats.pointCount
      }
    },
    material: {
      provider: "procedural-object-material-kit",
      descriptorId: `${treeDescriptor.id}:material`
    },
    collision: {
      provider: "tree-collision-adapter",
      descriptorId: `${treeDescriptor.id}:collision`
    },
    lod: {
      provider: "procedural-object-lod-kit",
      descriptorId: `${treeDescriptor.id}:lod`
    },
    capture: {
      provider: "procedural-object-capture-profile-kit",
      descriptorId: `${treeDescriptor.id}:capture`
    },
    metadata: {
      sourceDomain: "procedural-tree",
      species: treeDescriptor.species,
      seed: treeDescriptor.seed,
      sourceDescriptorSchema: treeDescriptor.schema,
      legacyVersion: LEGACY_PROCEDURAL_TREE_DOMAIN_KIT_VERSION
    }
  });
}

function decorateTreeDescriptor(value) {
  if (!value) return value;
  if (value.objectDescriptor?.schema === "nexus-object-descriptor/1") return clone(value);
  return {
    ...clone(value),
    objectDescriptor: createTreeObjectDescriptor(value)
  };
}

export function generateTreeDescriptor(input = {}, options = {}) {
  return decorateTreeDescriptor(generateLegacyTreeDescriptor(input, options));
}

export function validateTreeDescriptor(value) {
  const legacy = validateLegacyTreeDescriptor(value);
  const errors = [...legacy.errors];
  if (value?.objectDescriptor) {
    if (value.objectDescriptor.schema !== "nexus-object-descriptor/1") {
      errors.push("objectDescriptor must use nexus-object-descriptor/1");
    }
    if (value.objectDescriptor.id !== value.id) {
      errors.push("objectDescriptor id must match tree id");
    }
  }
  return { valid: errors.length === 0, errors };
}

export function createProceduralTreeApi(config = {}) {
  const legacy = createLegacyProceduralTreeApi(config);
  return Object.freeze({
    ...legacy,
    generate(input = {}) {
      return decorateTreeDescriptor(legacy.generate(input));
    },
    get(id) {
      return decorateTreeDescriptor(legacy.get(id));
    },
    list() {
      return legacy.list().map(decorateTreeDescriptor);
    },
    getObjectDescriptor(id) {
      return decorateTreeDescriptor(legacy.get(id))?.objectDescriptor ?? null;
    },
    validate: validateTreeDescriptor
  });
}

export function createProceduralTreeDomainKit(NexusEngine = {}, config = {}) {
  const runtime = typeof NexusEngine?.defineDomainServiceKit === "function" ? NexusEngine : {};
  const options = runtime === NexusEngine ? config : NexusEngine;
  const legacy = createLegacyProceduralTreeDomainKit(runtime, options);
  return Object.freeze({
    ...legacy,
    version: PROCEDURAL_TREE_DOMAIN_KIT_VERSION,
    provides: [
      ...(legacy.provides ?? []),
      "object:descriptor"
    ],
    createApi() {
      return createProceduralTreeApi(options);
    },
    metadata: {
      ...(legacy.metadata ?? {}),
      objectContract: "nexus-object-descriptor/1",
      objectContractProvider: "core-object-kit",
      boundary: "Owns deterministic tree morphology and emits the universal object contract. Renderer objects, GPU capture, placement, and physics remain adapters or separate domains."
    }
  });
}

export default createProceduralTreeDomainKit;
