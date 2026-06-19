# tokenizer-loader-kit

Loads tokenizer descriptors and provides deterministic dry-run tokenization.

This is enough for agent and ONNX loader experiments before a real tokenizer backend is added.

```js
engine.tokenizers.load(modelId)
engine.tokenizers.encode(modelId, text)
engine.tokenizers.batchEncode(modelId, texts)
```
