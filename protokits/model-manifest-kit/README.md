# model-manifest-kit

Registers pinned model metadata for agent and loader workflows.

It stores model ids, Hugging Face repos, revisions, file lists, runtime type, task type, expected inputs/outputs, estimated sizes, and license notes.

```js
engine.modelManifest.register(manifest)
engine.modelManifest.get(modelId)
engine.modelManifest.list()
```
