import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const OBJAVERSE_MESH_CACHE_KIT_VERSION = "0.1.0";

const cacheKey = (assetId, lod = "default") => `${assetId}:${lod}`;
const clock = (world) => number(world?.__nexusClock?.elapsed, 0);

export function normalizeObjaverseMeshCacheEntry(entry = {}) {
  const assetId = String(entry.assetId ?? entry.id ?? "asset");
  const lod = entry.lod ?? "default";
  return {
    id: entry.id ?? cacheKey(assetId, lod),
    assetId,
    lod,
    status: entry.status ?? "ready",
    descriptor: clone(entry.descriptor ?? {}),
    bytes: number(entry.bytes ?? entry.sizeBytes, 0),
    instanceCount: number(entry.instanceCount, 0),
    touchedAt: number(entry.touchedAt, 0),
    metadata: clone(entry.metadata ?? {})
  };
}

export function createObjaverseMeshCacheState(options = {}) {
  const entries = asList(options.entries ?? options.cached).map(normalizeObjaverseMeshCacheEntry);
  return { version: OBJAVERSE_MESH_CACHE_KIT_VERSION, budgetBytes: number(options.budgetBytes, 96 * 1024 * 1024), entries: Object.fromEntries(entries.map((entry) => [entry.id, entry])), history: [] };
}

export function summarizeObjaverseMeshCache(state = {}) {
  const entries = Object.values(state.entries ?? {});
  const bytes = entries.reduce((sum, entry) => sum + number(entry.bytes, 0), 0);
  return { total: entries.length, bytes, budgetBytes: number(state.budgetBytes, 0), budgetUsed: state.budgetBytes ? bytes / state.budgetBytes : 0, instanceCount: entries.reduce((sum, entry) => sum + number(entry.instanceCount, 0), 0) };
}

export function createObjaverseMeshCacheKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "objaverseMeshCache.state");
  const Updated = event("objaverseMeshCache.updated");
  const initial = () => createObjaverseMeshCacheState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "objaverse-mesh-cache-kit",
    resources: { State },
    events: { Updated },
    provides: ["objaverse:mesh-cache", "mesh:cache-state", "mesh:budget-metrics"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const publish = (next, evt) => { next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 96) : next.history; world.setResource(State, next); world.emit?.(Updated, { event: clone(evt), summary: summarizeObjaverseMeshCache(next), state: clone(next) }); return clone(next); };
      const api = {
        getState: state,
        snapshot: () => clone(state()),
        summarize: () => summarizeObjaverseMeshCache(state()),
        markReady(entry = {}) {
          const next = state();
          const normalized = normalizeObjaverseMeshCacheEntry({ ...entry, touchedAt: clock(world) });
          next.entries[normalized.id] = normalized;
          return publish(next, { at: clock(world), type: "ready", id: normalized.id });
        },
        touch(assetId, lod = "default", payload = {}) {
          const next = state();
          const id = cacheKey(assetId, lod);
          if (!next.entries[id]) return null;
          next.entries[id] = { ...next.entries[id], touchedAt: clock(world), instanceCount: number(payload.instanceCount, next.entries[id].instanceCount), metadata: { ...next.entries[id].metadata, ...(payload.metadata ?? {}) } };
          publish(next, { at: clock(world), type: "touch", id });
          return clone(next.entries[id]);
        },
        release(assetId, lod = "default") {
          const next = state();
          const id = cacheKey(assetId, lod);
          delete next.entries[id];
          return publish(next, { at: clock(world), type: "release", id });
        },
        trimToBudget() {
          const next = state();
          const released = [];
          while (summarizeObjaverseMeshCache(next).bytes > next.budgetBytes) {
            const oldest = Object.values(next.entries).sort((a, b) => number(a.touchedAt, 0) - number(b.touchedAt, 0))[0];
            if (!oldest) break;
            delete next.entries[oldest.id];
            released.push(oldest.id);
          }
          return publish(next, { at: clock(world), type: "trim", released });
        },
        get(assetId, lod = "default") { return clone(state().entries?.[cacheKey(assetId, lod)] ?? null); },
        list(filter = {}) { return Object.values(state().entries ?? {}).filter((entry) => (!filter.assetId || entry.assetId === filter.assetId) && (!filter.lod || entry.lod === filter.lod)).map(clone); },
        reset() { world.setResource(State, initial()); return this.snapshot(); }
      };
      engine.objaverseMeshCache = api;
      engine.n ??= {};
      engine.n.objaverseMeshCache = api;
    },
    metadata: { version: OBJAVERSE_MESH_CACHE_KIT_VERSION, purpose: "Tracks mesh descriptor availability and budget metrics without owning renderer objects." }
  });
}

export default createObjaverseMeshCacheKit;
