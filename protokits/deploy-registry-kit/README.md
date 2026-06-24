# deploy-registry-kit

## Domain

Deploy and scene registry.

## Purpose

This kit registers deploy manifests, lists scenes/apps, resolves kit stacks, and collects asset-pack references for hosts or tools.

## Kit type

Composition kit.

## Factory

```js
createDeployRegistryKit(NexusRealtime, options)
```

## Requires

- `deploy-manifest`

## Provides

- `deploy-registry`
- `scene-registry`
- `deploy-kit-stack-resolution`

## Resources

- `deployRegistry.state`

## Events

- `deployRegistry.registered`
- `deployRegistry.rejected`

## Public API

- `engine.deployRegistry.register(input)`
- `engine.deployRegistry.get(id)`
- `engine.deployRegistry.list(filter)`
- `engine.deployRegistry.resolveKitStack(id)`
- `engine.deployRegistry.listScenes()`
- `engine.deployRegistry.listApps()`
- `engine.deployRegistry.listAssetPacks()`
- `engine.deployRegistry.snapshot()`

## Renderer boundary

No renderer ownership. Hosts use registry data to decide what to load or enter.

## Performance contract

Scales with registered manifest count and asset-pack references.

## Snapshot/reset behavior

Supports snapshot. Reset/loadSnapshot are not implemented in this initial pass.

## Compatible kits

- `deploy-manifest-kit`
- `scene-lifecycle-kit`
- `asset-pack-manifest-kit`
- `aaa-batch-deploy-bridge`
- `gallery-registry-bridge`

## Promotion status

Experimental additive composition ProtoKit.
