# Objaverse Mesh Request Kit

Tracks mesh load requests for curated Objaverse-derived assets and LODs.

This kit owns request state only. Browser, renderer, or deploy adapters claim requests, load/parse the mesh, and report progress or completion.

## Services

- `engine.objaverseMeshRequest.requestMesh({ assetId, lod, url })`
- `engine.objaverseMeshRequest.claimNext(filter)`
- `engine.objaverseMeshRequest.progress(id, payload)`
- `engine.objaverseMeshRequest.complete(id, descriptor)`
- `engine.objaverseMeshRequest.fail(id, error)`
- `engine.objaverseMeshRequest.summarize()`
- `engine.objaverseMeshRequest.snapshot()`

## Provides

- `objaverse:mesh-requests`
- `mesh:load-requests`
- `mesh:request-metrics`
