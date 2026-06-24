# scene-graph-domain-kit

## Domain

General scene object graph.

## Purpose

This kit generalizes scene graph state outside the XR/hand-authoring stack. It owns JSON-safe scene objects, transforms, capabilities, dirty IDs, patches, and snapshots.

## Kit type

Atomic Domain Service Kit.

## Factory

```js
createSceneGraphDomainKit(NexusRealtime, options)
```

## Provides

- `scene-graph`
- `scene-objects`
- `scene-patches`
- `scene-dirty-set`

## Resources

- `sceneGraph.state`

## Events

- `sceneGraph.patched`

## Public API

- `engine.sceneGraph.createObject(object)`
- `engine.sceneGraph.updateObject(objectId, partial)`
- `engine.sceneGraph.removeObject(objectId)`
- `engine.sceneGraph.applyPatch(patch)`
- `engine.sceneGraph.getObject(id)`
- `engine.sceneGraph.listObjects()`
- `engine.sceneGraph.snapshot()`

## Renderer boundary

Outputs JSON-safe scene object and descriptor data. Does not own DOM, Canvas, WebGL, Three.js, or asset loading.

## Performance contract

Scales with object count, patch count, and dirty object count. Future compaction/sleeping can reduce patch and object churn.

## Snapshot/reset behavior

Supports snapshot. Reset/loadSnapshot are not implemented in this initial pass.

## Compatible kits

- `save-delta-kit`
- `scene-lifecycle-kit`
- `deploy-manifest-kit`

## Promotion status

Experimental additive domain ProtoKit.
