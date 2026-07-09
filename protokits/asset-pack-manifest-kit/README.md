# asset-pack-manifest-kit

## Domain

Asset pack manifest registry.

## Purpose

This kit describes lazy-loadable asset groups for deploy manifests and hosts. It records asset references and budgets, but it does not load assets.

## Kit type

Composition kit.

## Factory

```js
createAssetPackManifestKit(NexusEngine, options)
```

## Provides

- `asset-pack-manifest`
- `lazy-asset-pack-registry`

## Resources

- `assetPackManifest.state`

## Events

- `assetPackManifest.registered`

## Public API

- `engine.assetPacks.register(input)`
- `engine.assetPacks.get(id)`
- `engine.assetPacks.list()`
- `engine.assetPacks.resolve(ids)`
- `engine.assetPacks.snapshot()`

## Renderer boundary

No asset loading, DOM, Canvas, WebGL, or Three.js ownership. Hosts/loaders consume the manifest data.

## Performance contract

Scales with asset pack count and asset reference count. Optional packs may be deferred by hosts.

## Snapshot/reset behavior

Supports snapshot. Reset/loadSnapshot are not implemented in this initial pass.

## Compatible kits

- `deploy-registry-kit`
- `scene-transition-kit`
- `host-shell-contract-kit`

## Promotion status

Experimental additive composition ProtoKit.
