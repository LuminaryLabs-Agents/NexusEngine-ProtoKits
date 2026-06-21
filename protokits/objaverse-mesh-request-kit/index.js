import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const OBJAVERSE_MESH_REQUEST_KIT_VERSION = "0.1.0";

function clock(world) { return number(world?.__nexusClock?.elapsed, 0); }
function clean(value, fallback) { return String(value ?? fallback).trim() || fallback; }
function clamp01(value) { return Math.max(0, Math.min(1, number(value, 0))); }

export function normalizeMeshRequest(request = {}, index = 0) {
  const assetId = clean(request.assetId ?? request.id, `mesh-asset-${index + 1}`);
  const lod = request.lod ?? request.lodId ?? "default";
  const id = clean(request.requestId ?? `${assetId}:${lod}`, `mesh-request-${index + 1}`);
  return {
    id,
    assetId,
    lod,
    url: request.url ?? request.mesh ?? null,
    status: request.status ?? "queued",
    priority: number(request.priority, 0),
    progress: clamp01(request.progress),
    bytesLoaded: number(request.bytesLoaded, 0),
    bytesTotal: number(request.bytesTotal ?? request.sizeBytes, 0),
    queuedAt: number(request.queuedAt, 0),
    startedAt: request.startedAt ?? null,
    endedAt: request.endedAt ?? null,
    error: request.error ?? null,
    descriptor: clone(request.descriptor ?? {}),
    metadata: clone(request.metadata ?? {})
  };
}

export function createObjaverseMeshRequestState(options = {}) {
  const requests = asList(options.requests).map(normalizeMeshRequest);
  return { version: OBJAVERSE_MESH_REQUEST_KIT_VERSION, maxActive: Math.max(1, number(options.maxActive, 4)), requests: Object.fromEntries(requests.map((request) => [request.id, request])), history: [] };
}

export function summarizeMeshRequests(state = {}) {
  const requests = Object.values(state.requests ?? {});
  return { total: requests.length, queued: requests.filter((r) => r.status === "queued").length, running: requests.filter((r) => r.status === "running").length, done: requests.filter((r) => r.status === "done").length, failed: requests.filter((r) => r.status === "failed").length, progress: requests.length ? requests.reduce((sum, r) => sum + (r.status === "done" ? 1 : r.status === "failed" ? 0 : clamp01(r.progress)), 0) / requests.length : 1 };
}

export function createObjaverseMeshRequestKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "objaverseMeshRequest.state");
  const Updated = event("objaverseMeshRequest.updated");
  const initial = () => createObjaverseMeshRequestState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "objaverse-mesh-request-kit",
    resources: { State },
    events: { Updated },
    provides: ["objaverse:mesh-requests", "mesh:load-requests", "mesh:request-metrics"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const publish = (next, evt) => { next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 96) : next.history; world.setResource(State, next); world.emit?.(Updated, { event: clone(evt), summary: summarizeMeshRequests(next), state: clone(next) }); return clone(next); };
      const api = {
        getState: state,
        snapshot: () => clone(state()),
        summarize: () => summarizeMeshRequests(state()),
        requestMesh(request = {}) {
          const next = state();
          const normalized = normalizeMeshRequest({ ...request, status: "queued", queuedAt: clock(world) }, Object.keys(next.requests).length);
          next.requests[normalized.id] = normalized;
          return publish(next, { at: clock(world), type: "queued", requestId: normalized.id, assetId: normalized.assetId, lod: normalized.lod });
        },
        requestMany(requests = []) { return asList(requests).map((request) => this.requestMesh(request)); },
        claimNext(filter = {}) {
          const next = state();
          const running = Object.values(next.requests).filter((request) => request.status === "running").length;
          if (running >= next.maxActive) return null;
          const request = Object.values(next.requests).filter((entry) => entry.status === "queued").filter((entry) => !filter.assetId || entry.assetId === filter.assetId).sort((a, b) => number(b.priority, 0) - number(a.priority, 0))[0];
          return request ? this.start(request.id).requests[request.id] : null;
        },
        start(id) {
          const next = state();
          const request = next.requests[id];
          if (!request) throw new Error(`Unknown mesh request: ${id}`);
          next.requests[id] = { ...request, status: "running", startedAt: clock(world), error: null };
          return publish(next, { at: clock(world), type: "started", requestId: id });
        },
        progress(id, payload = {}) {
          const next = state();
          const request = next.requests[id];
          if (!request) throw new Error(`Unknown mesh request: ${id}`);
          next.requests[id] = { ...request, status: request.status === "queued" ? "running" : request.status, progress: clamp01(payload.progress ?? request.progress), bytesLoaded: number(payload.bytesLoaded, request.bytesLoaded), bytesTotal: number(payload.bytesTotal, request.bytesTotal), metadata: { ...request.metadata, ...(payload.metadata ?? {}) } };
          return publish(next, { at: clock(world), type: "progress", requestId: id, progress: next.requests[id].progress });
        },
        complete(id, descriptor = {}, payload = {}) {
          const next = state();
          const request = next.requests[id];
          if (!request) throw new Error(`Unknown mesh request: ${id}`);
          next.requests[id] = { ...request, status: "done", progress: 1, endedAt: clock(world), descriptor: clone(descriptor), bytesLoaded: number(payload.bytesLoaded, request.bytesTotal || request.bytesLoaded) };
          return publish(next, { at: clock(world), type: "done", requestId: id });
        },
        fail(id, error) {
          const next = state();
          const request = next.requests[id];
          if (!request) throw new Error(`Unknown mesh request: ${id}`);
          next.requests[id] = { ...request, status: "failed", endedAt: clock(world), error: String(error?.message ?? error) };
          return publish(next, { at: clock(world), type: "failed", requestId: id, error: next.requests[id].error });
        },
        list(filter = {}) { return Object.values(state().requests ?? {}).filter((request) => (!filter.status || request.status === filter.status) && (!filter.assetId || request.assetId === filter.assetId)).map(clone); },
        reset() { world.setResource(State, initial()); return this.snapshot(); }
      };
      engine.objaverseMeshRequest = api;
      engine.n ??= {};
      engine.n.objaverseMeshRequest = api;
    },
    metadata: { version: OBJAVERSE_MESH_REQUEST_KIT_VERSION, purpose: "Mesh request queue state for Objaverse-derived asset LODs; host adapters perform parsing and upload." }
  });
}

export default createObjaverseMeshRequestKit;
