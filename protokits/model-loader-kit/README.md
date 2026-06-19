# model-loader-kit

Coordinates model manifests, source plans, cache state, and runtime loaders.

The kit does not run gameplay and does not grant models authority. It only tracks loading state and lets other adapters report ready/rejected state.

Related loader kits:

```txt
model-manifest-kit
huggingface-loader-kit
model-download-cache-kit
tokenizer-loader-kit
onnx-loader-kit
embedding-memory-kit
```

## Engine API

```js
engine.modelLoader.requestLoad(modelId)
engine.modelLoader.markReady(modelId)
engine.modelLoader.reject(modelId, reason)
engine.modelLoader.getLoad(modelId)
engine.modelLoader.getState()
```
