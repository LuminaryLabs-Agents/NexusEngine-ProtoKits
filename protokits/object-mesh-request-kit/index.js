import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const OBJECT_MESH_REQUEST_KIT_VERSION = "0.1.0";

export function createObjectMeshRequestState(options = {}) {
  return { version: OBJECT_MESH_REQUEST_KIT_VERSION, requests: {}, maxActive: Math.max(1, number(options.maxActive, 6)), history: [] };
}

export function normalizeObjectMeshRequest(input = {}, index = 0) {
  const assetId = String(input.assetId ?? input.asset?.id ?? `asset-${index + 1}`);
  const lod = input.lod ?? input.selection?.lod ?? "lod0";
  const id = String(input.id ?? `${assetId}:${lod}`);
  return { id, assetId, lod, url: input.url ?? input.selection?.url ?? null, instanceId: input.instanceId ?? input.instance?.id ?? null, priority: number(input.priority, 0), status: input.status ?? "queued", requestedAt: number(input.requestedAt, 0), metadata: clone(input.metadata ?? {}) };
}

export function createObjectMeshRequestKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "objectMeshRequest.state");
  const Updated = event("objectMeshRequest.updated");
  const Requested = event("objectMeshRequest.requested");
  const initial = () => createObjectMeshRequestState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "object-mesh-request-kit",
    resources: { State },
    events: { Updated, Requested },
    requires: ["object:lod-policy", "object:variant-selection"],
    provides: ["object:mesh-requests", "asset:semantic-mesh-requests"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const publish = (next, evt = null) => { next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 96) : next.history; world.setResource(State, next); world.emit?.(Updated, { state: clone(next), event: clone(evt) }); return clone(next); };
      const api = {
        getState: state,
        requestForInstance(instance = {}, lodSelection = {}) { const next = state(); const request = normalizeObjectMeshRequest({ instance, instanceId: instance.id, assetId: lodSelection.assetId ?? instance.assetId, lod: lodSelection.lod, url: lodSelection.url, priority: lodSelection.renderMode === "mesh" ? 10 : 1, metadata: { renderMode: lodSelection.renderMode } }, Object.keys(next.requests).length); next.requests[request.id] = request; engine.objaverseMeshRequest?.requestMesh?.({ assetId: request.assetId, lod: request.lod, url: request.url, priority: request.priority, metadata: request.metadata }); world.emit?.(Requested, { request: clone(request) }); return publish(next, { type: "requested", id: request.id }); },
        requestMany(instances = [], viewer = {}) { return asList(instances).map((instance) => { const asset = engine.objaverseCatalog?.get?.(instance.assetId) ?? instance; const selection = engine.objectLodPolicy?.select?.(asset, viewer, { position: instance.position }) ?? { assetId: instance.assetId, lod: "lod0", url: asset.mesh ?? asset.url ?? null, renderMode: "mesh" }; return this.requestForInstance(instance, selection); }); },
        claimNext(filter = {}) { const request = Object.values(state().requests).filter((item) => item.status === "queued").filter((item) => !filter.assetId || item.assetId === filter.assetId).sort((a, b) => b.priority - a.priority)[0]; if (!request) return null; const next = state(); next.requests[request.id] = { ...request, status: "running" }; publish(next, { type: "claimed", id: request.id }); return clone(next.requests[request.id]); },
        markDone(id, payload = {}) { const next = state(); if (next.requests[id]) next.requests[id] = { ...next.requests[id], status: "done", metadata: { ...next.requests[id].metadata, ...payload } }; return publish(next, { type: "done", id }); },
        snapshot: () => clone(state())
      };
      engine.objectMeshRequest = api;
      engine.n ??= {};
      engine.n.objectMeshRequest = api;
    },
    metadata: { version: OBJECT_MESH_REQUEST_KIT_VERSION, purpose: "Semantic LOD-aware object mesh requests for renderer adapters and Objaverse cache kits." }
  });
}

export default createObjectMeshRequestKit;
