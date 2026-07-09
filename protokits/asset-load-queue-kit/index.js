import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const ASSET_LOAD_QUEUE_KIT_VERSION = "0.1.0";

const STAGES = Object.freeze(["manifest", "metadata", "mesh", "texture", "impostor", "upload"]);

function t(world) { return number(world?.__nexusClock?.elapsed, 0); }
function key(value, fallback) { return String(value ?? fallback).trim() || fallback; }
function clamp01(value) { return Math.max(0, Math.min(1, number(value, 0))); }

export function normalizeAssetLoadRequest(request = {}, index = 0) {
  const assetId = key(request.assetId ?? request.id, `asset-${index + 1}`);
  const stage = STAGES.includes(request.stage) ? request.stage : key(request.stage ?? request.kind, "mesh");
  const id = key(request.requestId ?? request.id ?? `${stage}:${assetId}:${request.lod ?? "default"}`, `${stage}:${assetId}`);
  return {
    id,
    assetId,
    stage,
    url: request.url ?? null,
    lod: request.lod ?? null,
    priority: number(request.priority, 0),
    status: request.status ?? "queued",
    progress: clamp01(request.progress),
    bytesLoaded: number(request.bytesLoaded, 0),
    bytesTotal: number(request.bytesTotal ?? request.sizeBytes, 0),
    queuedAt: number(request.queuedAt, 0),
    startedAt: request.startedAt ?? null,
    endedAt: request.endedAt ?? null,
    error: request.error ?? null,
    result: clone(request.result ?? null),
    metadata: clone(request.metadata ?? {})
  };
}

export function createAssetLoadQueueState(options = {}) {
  const requests = asList(options.requests).map(normalizeAssetLoadRequest);
  return {
    version: ASSET_LOAD_QUEUE_KIT_VERSION,
    maxActive: Math.max(1, number(options.maxActive, 6)),
    requests: Object.fromEntries(requests.map((request) => [request.id, request])),
    history: []
  };
}

export function summarizeAssetLoadQueue(state = {}) {
  const requests = Object.values(state.requests ?? {});
  return {
    total: requests.length,
    queued: requests.filter((request) => request.status === "queued").length,
    running: requests.filter((request) => request.status === "running").length,
    done: requests.filter((request) => request.status === "done").length,
    failed: requests.filter((request) => request.status === "failed").length,
    byStage: Object.fromEntries(STAGES.map((stage) => [stage, requests.filter((request) => request.stage === stage).length])),
    progress: requests.length ? requests.reduce((sum, request) => sum + (request.status === "done" ? 1 : request.status === "failed" ? 0 : clamp01(request.progress)), 0) / requests.length : 1,
    bytesLoaded: requests.reduce((sum, request) => sum + number(request.bytesLoaded, 0), 0),
    bytesTotal: requests.reduce((sum, request) => sum + number(request.bytesTotal, 0), 0)
  };
}

function publish(world, State, Updated, next, evt) {
  next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 96) : next.history;
  world.setResource(State, next);
  world.emit?.(Updated, { event: clone(evt), summary: summarizeAssetLoadQueue(next), state: clone(next) });
  return clone(next);
}

export function createAssetLoadQueueKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "assetLoadQueue.state");
  const Updated = event("assetLoadQueue.updated");
  const RequestQueued = event("assetLoadQueue.requestQueued");
  const RequestStarted = event("assetLoadQueue.requestStarted");
  const RequestProgressed = event("assetLoadQueue.requestProgressed");
  const RequestCompleted = event("assetLoadQueue.requestCompleted");
  const RequestFailed = event("assetLoadQueue.requestFailed");
  const initial = () => createAssetLoadQueueState(options);

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "asset-load-queue-kit",
    resources: { State },
    events: { Updated, RequestQueued, RequestStarted, RequestProgressed, RequestCompleted, RequestFailed },
    provides: ["asset-load-queue", "asset-load-requests", "asset-load-metrics", "asset-readiness"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const api = {
        getState: state,
        snapshot: () => clone(state()),
        summarize: () => summarizeAssetLoadQueue(state()),
        request(request = {}) {
          const next = state();
          const normalized = normalizeAssetLoadRequest({ ...request, status: "queued", queuedAt: t(world) }, Object.keys(next.requests).length);
          next.requests[normalized.id] = normalized;
          const evt = { at: t(world), type: "queued", requestId: normalized.id, assetId: normalized.assetId, stage: normalized.stage };
          world.emit?.(RequestQueued, { request: clone(normalized) });
          return publish(world, State, Updated, next, evt);
        },
        requestMany(requests = []) { return asList(requests).map((request) => this.request(request)); },
        claimNext(filter = {}) {
          const next = state();
          const running = Object.values(next.requests).filter((request) => request.status === "running").length;
          if (running >= next.maxActive) return null;
          const request = Object.values(next.requests).filter((entry) => entry.status === "queued").filter((entry) => !filter.stage || entry.stage === filter.stage).filter((entry) => !filter.assetId || entry.assetId === filter.assetId).sort((a, b) => number(b.priority, 0) - number(a.priority, 0))[0];
          return request ? this.start(request.id).requests[request.id] : null;
        },
        start(id) {
          const next = state();
          const request = next.requests[id];
          if (!request) throw new Error(`Unknown asset request: ${id}`);
          next.requests[id] = { ...request, status: "running", startedAt: t(world), error: null };
          const evt = { at: t(world), type: "started", requestId: id };
          world.emit?.(RequestStarted, { request: clone(next.requests[id]) });
          return publish(world, State, Updated, next, evt);
        },
        progress(id, payload = {}) {
          const next = state();
          const request = next.requests[id];
          if (!request) throw new Error(`Unknown asset request: ${id}`);
          next.requests[id] = { ...request, status: request.status === "queued" ? "running" : request.status, progress: clamp01(payload.progress ?? request.progress), bytesLoaded: number(payload.bytesLoaded, request.bytesLoaded), bytesTotal: number(payload.bytesTotal, request.bytesTotal), metadata: { ...request.metadata, ...(payload.metadata ?? {}) } };
          const evt = { at: t(world), type: "progress", requestId: id, progress: next.requests[id].progress };
          world.emit?.(RequestProgressed, { request: clone(next.requests[id]), payload: clone(payload) });
          return publish(world, State, Updated, next, evt);
        },
        complete(id, result = null, payload = {}) {
          const next = state();
          const request = next.requests[id];
          if (!request) throw new Error(`Unknown asset request: ${id}`);
          next.requests[id] = { ...request, status: "done", progress: 1, endedAt: t(world), result: clone(result), bytesLoaded: number(payload.bytesLoaded, request.bytesTotal || request.bytesLoaded) };
          const evt = { at: t(world), type: "done", requestId: id };
          world.emit?.(RequestCompleted, { request: clone(next.requests[id]), result: clone(result) });
          return publish(world, State, Updated, next, evt);
        },
        fail(id, error) {
          const next = state();
          const request = next.requests[id];
          if (!request) throw new Error(`Unknown asset request: ${id}`);
          next.requests[id] = { ...request, status: "failed", endedAt: t(world), error: String(error?.message ?? error) };
          const evt = { at: t(world), type: "failed", requestId: id, error: next.requests[id].error };
          world.emit?.(RequestFailed, { request: clone(next.requests[id]), error: next.requests[id].error });
          return publish(world, State, Updated, next, evt);
        },
        list(filter = {}) { return Object.values(state().requests ?? {}).filter((request) => (!filter.stage || request.stage === filter.stage) && (!filter.status || request.status === filter.status) && (!filter.assetId || request.assetId === filter.assetId)).map(clone); },
        reset() { world.setResource(State, initial()); return this.snapshot(); }
      };
      engine.assetLoadQueue = api;
      engine.n ??= {};
      engine.n.assetLoadQueue = api;
    },
    metadata: { version: ASSET_LOAD_QUEUE_KIT_VERSION, purpose: "Bounded asset request queue for manifests, metadata, meshes, textures, impostors, and upload readiness." }
  });
}

export default createAssetLoadQueueKit;
