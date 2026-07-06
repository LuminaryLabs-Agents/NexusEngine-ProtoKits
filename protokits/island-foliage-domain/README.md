# island-foliage-domain

## Status

protokit

## Purpose

Generate a foliage-heavy 200 meter island object graph with a central grove, walkable path clearance, understory, groundcover, palms, coconuts, rocks, driftwood, and reefs.

This domain produces runtime object records and render descriptors. It does not create Three.js objects or own the renderer.

## Owns

- dense cozy 200m island preset
- path network through the central grove
- path clearance field
- foliage density field
- procedural spawn requests
- central grove object group
- coastal band object group
- understory and groundcover groups
- nested object graph through island-object-library-domain
- foliage render contract

## Does Not Own

- landform mesh generation
- ocean renderer
- Three.js meshes
- DOM, Canvas, WebGL, or asset loading
- inventory or player controller implementation

## Main API

```js
import {
  createDenseCozyIslandObjectGraph,
  createDenseCozyIslandRenderContract,
  createDenseIslandSpawnRequests,
  createIslandPathNetwork
} from "@luminarylabs/nexusrealtime-protokits/island-foliage-domain";
```

## Runtime shape

```txt
island:cozy-001
├─ path-network:cozy-island
├─ grove:central-001
│  ├─ broadleaf-tree objects
│  ├─ palm-tree objects
│  ├─ coconut child objects
│  ├─ fern objects
│  └─ bush objects
├─ coastal-band:cozy-001
└─ water-interface:cozy-001
```
