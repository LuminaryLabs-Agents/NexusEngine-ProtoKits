# island-object-library-domain

## Status

protokit

## Purpose

Resolve procedural island object spawn requests into nested object graphs.

This domain does not render trees, fruits, rocks, or reefs. It creates JSON-safe object records with parent/child relationships, state, affordances, collision descriptors, and render descriptors. Renderer hosts decide how to draw the records.

## Owns

- palm tree object graphs
- broadleaf tree object graphs
- coconut clusters and coconut child objects
- simple island object records for bushes, ferns, grass clumps, rocks, driftwood, reefs, and coral
- object parent/child IDs
- object state descriptors
- object render descriptors
- harvest/pickup/inspect affordance descriptors

## Does Not Own

- Three.js meshes
- DOM, Canvas, or WebGL
- asset loading
- final rendering
- player input
- inventory implementation

## Example

```js
const graph = resolveIslandObjectGraph([
  {
    objectType: "palm-tree",
    parentId: "island:cozy-001",
    position: { x: 12, y: 4, z: -8 },
    scale: 1,
    coconutCount: 3
  }
]);
```

The palm tree object will contain trunk, fronds, coconut-cluster, and coconut child objects.
