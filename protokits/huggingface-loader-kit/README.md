# huggingface-loader-kit

Builds pinned Hugging Face download plans from `model-manifest-kit` entries.

It resolves repo, revision, allowlisted files, URLs, estimated byte counts, and license notes. It does not download files and does not run inference.

```js
engine.huggingFaceLoader.createDownloadPlan(modelId)
engine.huggingFaceLoader.getPlan(modelId)
```
