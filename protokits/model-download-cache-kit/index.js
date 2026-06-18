export const MODEL_DOWNLOAD_CACHE_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`createModelDownloadCacheKit requires NexusRealtime.${key}.`);
  }
}

function initialState() {
  return { version: MODEL_DOWNLOAD_CACHE_KIT_VERSION, queue: [], cache: {}, progress: {}, failures: [], offline: false };
}

function normalizePlan(plan = {}) {
  const modelId = String(plan.modelId ?? plan.id ?? "").trim();
  if (!modelId) throw new TypeError("Download plans require modelId.");
  const files = asArray(plan.files).map((file) => ({ path: String(file.path ?? file.name ?? ""), url: file.url == null ? null : String(file.url), bytes: Number(file.bytes ?? 0), sha256: file.sha256 ?? null })).filter((file) => file.path);
  return { ...clone(plan), modelId, files, estimatedBytes: Number(plan.estimatedBytes ?? files.reduce((sum, file) => sum + file.bytes, 0)) };
}

export function createModelDownloadCacheKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const ModelCacheState = defineResource(config.resourceName ?? "modelCache.state");
  const ModelDownloadQueued = defineEvent("modelCache.downloadQueued");
  const ModelDownloadProgressed = defineEvent("modelCache.downloadProgressed");
  const ModelCached = defineEvent("modelCache.cached");
  const ModelDownloadFailed = defineEvent("modelCache.downloadFailed");
  const ModelCacheCleared = defineEvent("modelCache.cleared");

  return defineRuntimeKit({
    id: config.kitId ?? "model-download-cache-kit",
    provides: ["model:download-cache", "model:download-progress"],
    resources: { ModelCacheState },
    events: { ModelDownloadQueued, ModelDownloadProgressed, ModelCached, ModelDownloadFailed, ModelCacheCleared },
    systems: [],
    initWorld({ world }) { world.setResource(ModelCacheState, initialState()); },
    install({ engine, world }) {
      engine.modelCache = {
        resources: { ModelCacheState },
        events: { ModelDownloadQueued, ModelDownloadProgressed, ModelCached, ModelDownloadFailed, ModelCacheCleared },
        download(planOrModelId, options = {}) {
          const plan = typeof planOrModelId === "string"
            ? (engine.huggingFaceLoader?.createDownloadPlan?.(planOrModelId, options) ?? { modelId: planOrModelId, files: [] })
            : planOrModelId;
          const normalized = normalizePlan(plan);
          const previous = world.getResource(ModelCacheState) ?? initialState();
          const entry = { id: `download-${previous.queue.length + 1}`, modelId: normalized.modelId, plan: normalized, status: options.dryRun === false ? "queued" : "planned", createdAtTick: world.__nexusClock?.frame ?? 0 };
          const progress = { modelId: normalized.modelId, status: entry.status, loadedBytes: 0, totalBytes: normalized.estimatedBytes, filesDone: 0, filesTotal: normalized.files.length };
          world.setResource(ModelCacheState, { ...previous, queue: [entry, ...previous.queue].slice(0, 32), progress: { ...previous.progress, [normalized.modelId]: progress } });
          world.emit(ModelDownloadQueued, { modelId: normalized.modelId, entry });
          return clone(entry);
        },
        progress(modelId, patch = {}) {
          const previous = world.getResource(ModelCacheState) ?? initialState();
          const current = previous.progress[modelId] ?? { modelId, status: "unknown", loadedBytes: 0, totalBytes: 0, filesDone: 0, filesTotal: 0 };
          const next = { ...current, ...clone(patch) };
          world.setResource(ModelCacheState, { ...previous, progress: { ...previous.progress, [modelId]: next } });
          world.emit(ModelDownloadProgressed, { modelId, progress: next });
          return clone(next);
        },
        markCached(modelId, files = null) {
          const previous = world.getResource(ModelCacheState) ?? initialState();
          const progress = { ...(previous.progress[modelId] ?? { modelId }), status: "cached", loadedBytes: previous.progress[modelId]?.totalBytes ?? 0 };
          const cacheEntry = { modelId, files: files ? clone(files) : previous.queue.find((entry) => entry.modelId === modelId)?.plan?.files ?? [], cachedAtTick: world.__nexusClock?.frame ?? 0 };
          world.setResource(ModelCacheState, { ...previous, cache: { ...previous.cache, [modelId]: cacheEntry }, progress: { ...previous.progress, [modelId]: progress } });
          world.emit(ModelCached, { modelId, cacheEntry });
          return clone(cacheEntry);
        },
        fail(modelId, reason = "download-failed") {
          const previous = world.getResource(ModelCacheState) ?? initialState();
          const failure = { modelId, reason: String(reason) };
          world.setResource(ModelCacheState, { ...previous, failures: [failure, ...previous.failures].slice(0, 16), progress: { ...previous.progress, [modelId]: { ...(previous.progress[modelId] ?? { modelId }), status: "failed", reason } } });
          world.emit(ModelDownloadFailed, failure);
          return clone(failure);
        },
        hasModel(modelId) { return Boolean(world.getResource(ModelCacheState)?.cache?.[modelId]); },
        getFile(modelId, path) { return clone(world.getResource(ModelCacheState)?.cache?.[modelId]?.files?.find((file) => file.path === path) ?? null); },
        getProgress(modelId) { return clone(world.getResource(ModelCacheState)?.progress?.[modelId] ?? null); },
        clearModel(modelId) {
          const previous = world.getResource(ModelCacheState) ?? initialState();
          const cache = { ...previous.cache };
          delete cache[modelId];
          world.setResource(ModelCacheState, { ...previous, cache });
          world.emit(ModelCacheCleared, { modelId });
          return true;
        },
        getState() { return clone(world.getResource(ModelCacheState)); }
      };
    },
    metadata: { purpose: "Tracks model download plans, progress, dry-run cache state, cache hits, failures, and clear operations." }
  });
}

export default createModelDownloadCacheKit;
