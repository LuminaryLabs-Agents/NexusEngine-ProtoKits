export const MODEL_MANIFEST_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`createModelManifestKit requires NexusRealtime.${key}.`);
  }
}

export function normalizeModelManifest(manifest = {}) {
  const id = String(manifest.id ?? manifest.modelId ?? "").trim();
  if (!id) throw new TypeError("Model manifests require id.");
  const files = asArray(manifest.files).map((file) => typeof file === "string" ? { path: file } : { ...file, path: String(file.path ?? file.name ?? "") }).filter((file) => file.path);
  return {
    id,
    label: String(manifest.label ?? id),
    source: String(manifest.source ?? "local"),
    repo: manifest.repo == null ? null : String(manifest.repo),
    revision: String(manifest.revision ?? "main"),
    task: String(manifest.task ?? "unknown"),
    runtime: String(manifest.runtime ?? "unknown"),
    quantization: manifest.quantization == null ? null : String(manifest.quantization),
    files,
    expectedInputs: asArray(manifest.expectedInputs).map(String),
    expectedOutputs: asArray(manifest.expectedOutputs).map(String),
    license: manifest.license == null ? null : String(manifest.license),
    estimatedBytes: Number(manifest.estimatedBytes ?? files.reduce((sum, file) => sum + Number(file.bytes ?? 0), 0)),
    metadata: clone(manifest.metadata ?? {})
  };
}

function initialState(config = {}) {
  const manifests = asArray(config.models ?? config.manifests).map(normalizeModelManifest);
  return {
    version: MODEL_MANIFEST_KIT_VERSION,
    manifests: Object.fromEntries(manifests.map((manifest) => [manifest.id, manifest])),
    registrations: manifests.map((manifest) => manifest.id),
    lastError: null
  };
}

export function createModelManifestKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const ModelManifestState = defineResource(config.resourceName ?? "modelManifest.state");
  const ModelRegistered = defineEvent("modelManifest.registered");
  const ModelRejected = defineEvent("modelManifest.rejected");
  const ModelManifestReset = defineEvent("modelManifest.reset");

  return defineRuntimeKit({
    id: config.kitId ?? "model-manifest-kit",
    provides: ["model:manifest", "model:metadata"],
    resources: { ModelManifestState },
    events: { ModelRegistered, ModelRejected, ModelManifestReset },
    systems: [],
    initWorld({ world }) { world.setResource(ModelManifestState, initialState(config)); },
    install({ engine, world }) {
      engine.modelManifest = {
        resources: { ModelManifestState },
        events: { ModelRegistered, ModelRejected, ModelManifestReset },
        register(manifest) {
          let normalized;
          try { normalized = normalizeModelManifest(manifest); }
          catch (error) {
            const rejection = { reason: error.message, manifest: clone(manifest) };
            const state = { ...(world.getResource(ModelManifestState) ?? initialState(config)), lastError: rejection };
            world.setResource(ModelManifestState, state);
            world.emit(ModelRejected, rejection);
            return clone(rejection);
          }
          const previous = world.getResource(ModelManifestState) ?? initialState(config);
          const state = {
            ...previous,
            manifests: { ...previous.manifests, [normalized.id]: normalized },
            registrations: Array.from(new Set([normalized.id, ...previous.registrations])),
            lastError: null
          };
          world.setResource(ModelManifestState, state);
          world.emit(ModelRegistered, { modelId: normalized.id, manifest: normalized });
          return clone(normalized);
        },
        get(modelId) { return clone(world.getResource(ModelManifestState)?.manifests?.[modelId] ?? null); },
        list() { return clone(Object.values(world.getResource(ModelManifestState)?.manifests ?? {})); },
        getState() { return clone(world.getResource(ModelManifestState)); },
        reset(payload = {}) {
          const state = initialState({ ...config, ...payload });
          world.setResource(ModelManifestState, state);
          world.emit(ModelManifestReset, { count: state.registrations.length });
          return clone(state);
        }
      };
    },
    metadata: { purpose: "Registers pinned model manifests for model loaders, ONNX sessions, tokenizers, and agent harnesses." }
  });
}

export default createModelManifestKit;
