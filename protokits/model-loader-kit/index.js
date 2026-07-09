export const MODEL_LOADER_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createModelLoaderKit requires NexusEngine.${key}.`);
  }
}

function initialState() {
  return { version: MODEL_LOADER_KIT_VERSION, loads: {}, order: [], rejections: [] };
}

export function createModelLoaderKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const ModelLoaderState = defineResource(config.resourceName ?? "modelLoader.state");
  const ModelLoadRequested = defineEvent("modelLoader.loadRequested");
  const ModelLoadReady = defineEvent("modelLoader.ready");
  const ModelLoadRejected = defineEvent("modelLoader.rejected");

  return defineRuntimeKit({
    id: config.kitId ?? "model-loader-kit",
    requires: ["model:manifest"],
    provides: ["model:loader", "model:load-state"],
    resources: { ModelLoaderState },
    events: { ModelLoadRequested, ModelLoadReady, ModelLoadRejected },
    systems: [],
    initWorld({ world }) { world.setResource(ModelLoaderState, initialState()); },
    install({ engine, world }) {
      engine.modelLoader = {
        resources: { ModelLoaderState },
        events: { ModelLoadRequested, ModelLoadReady, ModelLoadRejected },
        requestLoad(modelId, options = {}) {
          const manifest = options.manifest ?? engine.modelManifest?.get?.(modelId);
          if (!manifest) {
            const rejection = { modelId, reason: "missing-manifest" };
            const previous = world.getResource(ModelLoaderState) ?? initialState();
            world.setResource(ModelLoaderState, { ...previous, rejections: [rejection, ...previous.rejections].slice(0, 16) });
            world.emit(ModelLoadRejected, rejection);
            return clone(rejection);
          }
          const previous = world.getResource(ModelLoaderState) ?? initialState();
          const load = {
            modelId,
            status: "requested",
            runtime: manifest.runtime,
            task: manifest.task,
            manifest: clone(manifest),
            downloadPlan: options.download === false ? null : engine.huggingFaceLoader?.createDownloadPlan?.(modelId, options),
            requestedAtTick: world.__nexusClock?.frame ?? 0
          };
          world.setResource(ModelLoaderState, { ...previous, loads: { ...previous.loads, [modelId]: load }, order: [modelId, ...previous.order.filter((id) => id !== modelId)].slice(0, 32) });
          world.emit(ModelLoadRequested, { modelId, load });
          if (options.autoCache && engine.modelCache && load.downloadPlan?.files) engine.modelCache.download(load.downloadPlan, { dryRun: true });
          return clone(load);
        },
        markReady(modelId, payload = {}) {
          const previous = world.getResource(ModelLoaderState) ?? initialState();
          const current = previous.loads[modelId] ?? { modelId };
          const load = { ...current, ...clone(payload), status: "ready", readyAtTick: world.__nexusClock?.frame ?? 0 };
          world.setResource(ModelLoaderState, { ...previous, loads: { ...previous.loads, [modelId]: load } });
          world.emit(ModelLoadReady, { modelId, load });
          return clone(load);
        },
        reject(modelId, reason = "load-rejected") {
          const previous = world.getResource(ModelLoaderState) ?? initialState();
          const rejection = { modelId, reason: String(reason) };
          world.setResource(ModelLoaderState, { ...previous, rejections: [rejection, ...previous.rejections].slice(0, 16), loads: { ...previous.loads, [modelId]: { ...(previous.loads[modelId] ?? { modelId }), status: "rejected", reason } } });
          world.emit(ModelLoadRejected, rejection);
          return clone(rejection);
        },
        getLoad(modelId) { return clone(world.getResource(ModelLoaderState)?.loads?.[modelId] ?? null); },
        getState() { return clone(world.getResource(ModelLoaderState)); }
      };
    },
    metadata: { purpose: "Coordinates model manifests, source plans, cache state, and runtime loaders without letting models directly mutate gameplay." }
  });
}

export default createModelLoaderKit;
