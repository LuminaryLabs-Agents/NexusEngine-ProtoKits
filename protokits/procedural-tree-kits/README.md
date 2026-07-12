# Procedural Tree Kits

A composed ProtoKit family for deterministic tree creation, universal object descriptors, procedural PBR fields, LOD policy, asset snapshots, and a separate Three.js/WebGL renderer adapter.

## Kit graph

```txt
procedural-tree-kits
├─ procedural-tree-domain-kit
│  └─ emits nexus-object-descriptor/1
├─ procedural-tree-pbr-field-kit
├─ tree-lod-domain-kit
├─ tree-asset-snapshot-kit
└─ three-tree-render-adapter-kit
```

The first four kits are headless and serializable. The Three.js adapter is explicitly renderer-owned.

The tree domain owns branch, root, leaf, species, and seed meaning. It maps that result into the promoted `core-object-kit` contract so object identity, bounds, pivot, ground anchor, LOD references, capture references, hashing, and lifecycle language stay consistent with procedural creatures and future rocks/buildings.

```js
const suite = createProceduralTreeSuite();
const result = suite.buildDescriptors({ id: "oak-1737", seed: 1737 });

result.treeDescriptor;
result.objectDescriptor;
```

For rendering:

```js
const suite = createProceduralTreeSuite({ three: { THREE, renderer } });
const { renderAsset } = suite.buildThreeAsset({ id: "oak-1737", seed: 1737 });
scene.add(renderAsset.root);
suite.render.updateAsset(renderAsset, camera);
```

The renderer consumes the object descriptor pivot for runtime impostor view selection. GPU capture and atlas generation remain adapter responsibilities.
