# model-download-cache-kit

Tracks model download plans, progress, cached file records, and failures.

The current implementation is deterministic and dry-run friendly. Browser or Node storage backends can be added later as adapters.

```js
engine.modelCache.download(plan)
engine.modelCache.progress(modelId, patch)
engine.modelCache.markCached(modelId)
engine.modelCache.hasModel(modelId)
```
