# deploy-manifest-kit

## Domain

Deploy manifest normalization and validation.

## Purpose

This kit defines a JSON-safe shape for app and scene deploy manifests. It lets scenes configure existing domain kits through data instead of becoming custom engines.

## Kit type

Composition kit.

## Factory

```js
createDeployManifestKit(NexusEngine, options)
```

## Provides

- `deploy-manifest`
- `deploy-manifest-validation`

## Resources

- `deployManifest.state`

## Events

- `deployManifest.registered`
- `deployManifest.rejected`

## Public API

- `engine.deployManifests.register(input)`
- `engine.deployManifests.validate(input)`
- `engine.deployManifests.get(id)`
- `engine.deployManifests.list()`
- `engine.deployManifests.snapshot()`

## Data contract

A manifest requires `id` and may include `title`, `kind`, `route`, `uses`, `assetPacks`, `entities`, `sequences`, `performanceProfile`, `saveScope`, `entry`, `exits`, and `metadata`.

## Renderer boundary

No DOM, Canvas, WebGL, Three.js, audio, or asset loading ownership.

## Performance contract

Scales with manifest count. Manifest validation should remain cheap and JSON-only.

## Snapshot/reset behavior

Supports `snapshot()` of registered manifests. Reset/loadSnapshot are not implemented in this initial pass.

## Compatible kits

- `deploy-registry-kit`
- `scene-lifecycle-kit`
- `asset-pack-manifest-kit`
- `session-facade-kit`

## Known limitations

Schema is intentionally lightweight and may need stricter validation once real deploy consumers depend on it.

## Promotion status

Experimental additive composition ProtoKit.
