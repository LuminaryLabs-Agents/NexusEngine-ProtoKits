# scene-transition-kit

## Domain

Scene transition requests and preload intent.

## Purpose

This kit records transition requests, completion, cancellation, and preload intent so hosts can coordinate scene changes without owning scene logic.

## Kit type

Composition kit.

## Factory

```js
createSceneTransitionKit(NexusEngine, options)
```

## Requires

- `scene-lifecycle`

## Provides

- `scene-transition`
- `transition-preload-contract`

## Resources

- `sceneTransition.state`

## Events

- `sceneTransition.requested`
- `sceneTransition.completed`
- `sceneTransition.cancelled`

## Public API

- `engine.sceneTransition.request(input)`
- `engine.sceneTransition.complete(payload)`
- `engine.sceneTransition.cancel(reason)`
- `engine.sceneTransition.snapshot()`

## Renderer boundary

No renderer ownership. Hosts and renderers may use transition state to preload or animate, but this kit does not draw.

## Performance contract

Scales with bounded transition history length.

## Snapshot/reset behavior

Supports snapshot. Reset/loadSnapshot are not implemented in this initial pass.

## Compatible kits

- `scene-lifecycle-kit`
- `deploy-registry-kit`
- `asset-pack-manifest-kit`
- `host-shell-contract-kit`

## Promotion status

Experimental additive composition ProtoKit.
