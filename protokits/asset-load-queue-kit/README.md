# Asset Load Queue Kit

Bounded asset-loading request state for manifests, metadata, meshes, textures, impostors, and renderer-upload readiness.

This kit does not fetch files or parse meshes. A browser/deploy adapter claims requests, performs IO, and reports progress back into the kit.

## Services

```js
engine.assetLoadQueue.request({ assetId, stage, url })
engine.assetLoadQueue.claimNext({ stage })
engine.assetLoadQueue.progress(id, payload)
engine.assetLoadQueue.complete(id, result)
engine.assetLoadQueue.fail(id, error)
engine.assetLoadQueue.summarize()
engine.assetLoadQueue.snapshot()
```

## Stages

```txt
manifest
metadata
mesh
texture
impostor
upload
```

## Provides

```txt
asset-load-queue
asset-load-requests
asset-load-metrics
asset-readiness
```
