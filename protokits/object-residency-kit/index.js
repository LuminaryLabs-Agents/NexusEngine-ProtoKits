import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const OBJECT_RESIDENCY_KIT_VERSION = "0.1.0";

function key(assetId, lod = "lod0") { return `${assetId}:${lod}`; }

export function createObjectResidencyState(options = {}) {
  return { version: OBJECT_RESIDENCY_KIT_VERSION, budgetBytes: number(options.budgetBytes, 128 * 1024 * 1024), entries: {}, history: [] };
}

export function summarizeObjectResidency(state = {}) {
  const entries = Object.values(state.entries ?? {});
  const bytes = entries.reduce((sum, entry) => sum + number(entry.bytes, 0), 0);
  return { total: entries.length, ready: entries.filter((entry) => entry.status === "ready").length, loading: entries.filter((entry) => entry.status === "loading").length, failed: entries.filter((entry) => entry.status === "failed").length, fallback: entries.filter((entry) => entry.status === "fallback").length, bytes, budgetBytes: number(state.budgetBytes, 0), budgetUsed: state.budgetBytes ? bytes / state.budgetBytes : 0 };
}

export function createObjectResidencyKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "objectResidency.state");
  const Updated = event("objectResidency.updated");
  const Ready = event("objectResidency.ready");
  const initial = () => createObjectResidencyState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "object-residency-kit",
    resources: { State },
    events: { Updated, Ready },
    requires: ["asset:object-cache-state"],
    provides: ["object:residency", "asset:object-cache-state"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const publish = (next, evt = null) => { next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 96) : next.history; world.setResource(State, next); world.emit?.(Updated, { state: clone(next), summary: summarizeObjectResidency(next), event: clone(evt) }); return clone(next); };
      const api = {
        getState: state,
        summarize: () => summarizeObjectResidency(state()),
        markLoading(assetId, lod = "lod0", payload = {}) { const next = state(); next.entries[key(assetId, lod)] = { id: key(assetId, lod), assetId, lod, status: "loading", bytes: number(payload.bytes, 0), touchedAt: number(payload.touchedAt, 0), descriptor: clone(payload.descriptor ?? null) }; return publish(next, { type: "loading", assetId, lod }); },
        markReady(assetId, lod = "lod0", descriptor = {}, payload = {}) { const next = state(); next.entries[key(assetId, lod)] = { id: key(assetId, lod), assetId, lod, status: "ready", bytes: number(payload.bytes, payload.sizeBytes ?? 0), touchedAt: number(payload.touchedAt, 0), descriptor: clone(descriptor), metadata: clone(payload.metadata ?? {}) }; engine.objaverseMeshCache?.markReady?.({ assetId, lod, descriptor, bytes: payload.bytes }); world.emit?.(Ready, { assetId, lod, descriptor: clone(descriptor) }); return publish(next, { type: "ready", assetId, lod }); },
        markFallback(assetId, lod = "lod0", reason = "fallback") { const next = state(); next.entries[key(assetId, lod)] = { id: key(assetId, lod), assetId, lod, status: "fallback", reason, bytes: 0, descriptor: null }; return publish(next, { type: "fallback", assetId, lod, reason }); },
        markFailed(assetId, lod = "lod0", error = "failed") { const next = state(); next.entries[key(assetId, lod)] = { id: key(assetId, lod), assetId, lod, status: "failed", error: String(error), bytes: 0, descriptor: null }; return publish(next, { type: "failed", assetId, lod }); },
        isReady(assetId, lod = "lod0") { return state().entries?.[key(assetId, lod)]?.status === "ready" || Boolean(engine.objaverseMeshCache?.get?.(assetId, lod)); },
        get(assetId, lod = "lod0") { return clone(state().entries?.[key(assetId, lod)] ?? engine.objaverseMeshCache?.get?.(assetId, lod) ?? null); },
        releaseCold(limit = state().budgetBytes) { const next = state(); while (summarizeObjectResidency(next).bytes > limit) { const oldest = Object.values(next.entries).sort((a, b) => number(a.touchedAt, 0) - number(b.touchedAt, 0))[0]; if (!oldest) break; delete next.entries[oldest.id]; } return publish(next, { type: "releaseCold" }); },
        snapshot: () => clone(state())
      };
      engine.objectResidency = api;
      engine.n ??= {};
      engine.n.objectResidency = api;
    },
    metadata: { version: OBJECT_RESIDENCY_KIT_VERSION, purpose: "Object mesh readiness, fallback, failure, and cache budget state." }
  });
}

export default createObjectResidencyKit;
