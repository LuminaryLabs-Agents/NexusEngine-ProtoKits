export const TOKENIZER_LOADER_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createTokenizerLoaderKit requires NexusEngine.${key}.`);
  }
}

function hashToken(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % 30000 + 100;
}

function simpleEncode(text, options = {}) {
  const maxLength = Number(options.maxLength ?? 64);
  const tokens = String(text ?? "").toLowerCase().match(/[a-z0-9_'-]+|[^\s]/g) ?? [];
  const inputIds = tokens.slice(0, maxLength).map(hashToken);
  while (options.padding && inputIds.length < maxLength) inputIds.push(0);
  return { inputIds, attentionMask: inputIds.map((id) => id === 0 ? 0 : 1), tokens: tokens.slice(0, maxLength), truncated: tokens.length > maxLength };
}

function initialState() { return { version: TOKENIZER_LOADER_KIT_VERSION, tokenizers: {}, encodes: [] }; }

export function createTokenizerLoaderKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const TokenizerState = defineResource(config.resourceName ?? "tokenizerLoader.state");
  const TokenizerLoaded = defineEvent("tokenizer.loaded");
  const TextEncoded = defineEvent("tokenizer.textEncoded");
  const TokenizerRejected = defineEvent("tokenizer.rejected");

  return defineRuntimeKit({
    id: config.kitId ?? "tokenizer-loader-kit",
    provides: ["model:tokenizer", "text:tokenization"],
    resources: { TokenizerState },
    events: { TokenizerLoaded, TextEncoded, TokenizerRejected },
    systems: [],
    initWorld({ world }) { world.setResource(TokenizerState, initialState()); },
    install({ engine, world }) {
      engine.tokenizers = {
        resources: { TokenizerState },
        events: { TokenizerLoaded, TextEncoded, TokenizerRejected },
        load(modelId, tokenizer = {}) {
          const previous = world.getResource(TokenizerState) ?? initialState();
          const entry = { modelId, type: tokenizer.type ?? "simple-word-hash", maxLength: Number(tokenizer.maxLength ?? config.maxLength ?? 64), loadedAtTick: world.__nexusClock?.frame ?? 0, metadata: clone(tokenizer.metadata ?? {}) };
          world.setResource(TokenizerState, { ...previous, tokenizers: { ...previous.tokenizers, [modelId]: entry } });
          world.emit(TokenizerLoaded, { modelId, tokenizer: entry });
          return clone(entry);
        },
        encode(modelId, text, options = {}) {
          const previous = world.getResource(TokenizerState) ?? initialState();
          const tokenizer = previous.tokenizers[modelId] ?? this.load(modelId, options.tokenizer ?? {});
          const encoded = simpleEncode(text, { maxLength: options.maxLength ?? tokenizer.maxLength, padding: options.padding ?? true });
          const record = { modelId, text: String(text ?? ""), encoded };
          const state = world.getResource(TokenizerState) ?? previous;
          world.setResource(TokenizerState, { ...state, encodes: [record, ...state.encodes].slice(0, 24) });
          world.emit(TextEncoded, record);
          return clone(encoded);
        },
        batchEncode(modelId, texts, options = {}) { return asArray(texts).map((text) => this.encode(modelId, text, options)); },
        getTokenizer(modelId) { return clone(world.getResource(TokenizerState)?.tokenizers?.[modelId] ?? null); },
        getState() { return clone(world.getResource(TokenizerState)); }
      };
    },
    metadata: { purpose: "Loads tokenizer descriptors and provides deterministic dry-run tokenization for ONNX/model loader experiments." }
  });
}

export default createTokenizerLoaderKit;
