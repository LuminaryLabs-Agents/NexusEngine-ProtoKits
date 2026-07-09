# save-delta-kit

## Domain

Delta-only scene persistence.

## Purpose

This kit records scene changes as patches so apps can persist what changed without saving full scene blobs.

## Kit type

Composition kit.

## Factory

```js
createSaveDeltaKit(NexusEngine, options)
```

## Provides

- `save-delta`
- `scene-delta`
- `delta-only-save`

## Resources

- `saveDelta.state`

## Events

- `saveDelta.patched`
- `saveDelta.reset`

## Public API

- `engine.saveDelta.patch(patchInput)`
- `engine.saveDelta.merge(baseScene, sceneId)`
- `engine.saveDelta.resetScene(sceneId)`
- `engine.saveDelta.snapshot()`

## Data contract

Patches require `sceneId` and may include `objectId`, `type`, `path`, `value`, `partial`, and metadata.

## Renderer boundary

No renderer ownership. Save deltas operate on JSON-safe scene data.

## Performance contract

Scales with patch count and changed object count. Future compaction can reduce history size.

## Snapshot/reset behavior

Supports snapshot and per-scene reset. loadSnapshot is not implemented in this initial pass.

## Compatible kits

- `scene-graph-domain-kit`
- `scene-lifecycle-kit`
- `deploy-manifest-kit`

## Promotion status

Experimental additive composition ProtoKit.
