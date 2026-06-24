# scene-lifecycle-kit

## Domain

Scene lifecycle state.

## Purpose

This kit tracks scene entry, pause, resume, exit, and disposal without making a scene into an engine or a host route.

## Kit type

Composition kit.

## Factory

```js
createSceneLifecycleKit(NexusRealtime, options)
```

## Requires

- `deploy-manifest`

## Provides

- `scene-lifecycle`
- `scene-enter-exit`
- `scene-state-snapshot`

## Resources

- `sceneLifecycle.state`

## Events

- `sceneLifecycle.entered`
- `sceneLifecycle.paused`
- `sceneLifecycle.resumed`
- `sceneLifecycle.exited`
- `sceneLifecycle.disposed`

## Public API

- `engine.sceneLifecycle.enter(sceneManifest)`
- `engine.sceneLifecycle.pause(reason)`
- `engine.sceneLifecycle.resume(reason)`
- `engine.sceneLifecycle.exit(reason)`
- `engine.sceneLifecycle.dispose(reason)`
- `engine.sceneLifecycle.snapshot()`

## Renderer boundary

No renderer ownership. Renderers may react to lifecycle state but this kit does not draw or load assets.

## Performance contract

Scales with lifecycle history length, which is bounded.

## Snapshot/reset behavior

Supports snapshot. Reset/loadSnapshot are not implemented in this initial pass.

## Compatible kits

- `deploy-manifest-kit`
- `deploy-registry-kit`
- `scene-transition-kit`
- `save-delta-kit`

## Promotion status

Experimental additive composition ProtoKit.
