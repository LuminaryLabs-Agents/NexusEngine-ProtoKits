# grass-object-domain

Renderer-agnostic grass patch object domain.

## Owns

- grass patch object descriptors
- grass patch placement over grass-safe masks
- path/tree/object clearance rules
- blade/triangle budget metadata
- batch keys, material keys, and geometry template keys
- static batch/instancing descriptors

## Does not own

- Three.js meshes
- InstancedMesh creation
- shader code
- DOM or Canvas

Renderer hosts convert grass patch objects into generated blade meshes, merged static batches, or `InstancedMesh` groups.
