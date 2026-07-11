# Procedural Tree Kits

A composed ProtoKit family for deterministic tree creation, procedural PBR fields, LOD policy, asset snapshots, and a separate Three.js/WebGL renderer adapter.

## Kit graph

```txt
procedural-tree-kits
├─ procedural-tree-domain-kit
├─ procedural-tree-pbr-field-kit
├─ tree-lod-domain-kit
├─ tree-asset-snapshot-kit
└─ three-tree-render-adapter-kit
```

The first four kits are headless and serializable. The Three.js adapter is explicitly renderer-owned.

## Headless use

```js
import { createProceduralTreeSuite } from "./index.js";
const suite = createProceduralTreeSuite();
const result = suite.buildDescriptors({ id: "oak-1737", seed: 1737 });
```

## Three.js use

```js
const suite = createProceduralTreeSuite({ three: { THREE, renderer } });
const { renderAsset } = suite.buildThreeAsset({ id: "oak-1737", seed: 1737 });
scene.add(renderAsset.root);
suite.render.updateAsset(renderAsset, camera);
```

`createProceduralTreeKits(NexusEngine, config)` returns renderer-neutral Domain Service Kits. The Three.js adapter is separate because it requires host-owned renderer objects.