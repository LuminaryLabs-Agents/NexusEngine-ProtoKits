import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const OBJAVERSE_METADATA_INDEX_KIT_VERSION = "0.1.0";

export function normalizeObjaverseMetadata(record = {}, index = 0) {
  const assetId = String(record.assetId ?? record.id ?? `objaverse-meta-${index + 1}`);
  return {
    assetId,
    source: record.source ?? "objaverse",
    status: record.status ?? "indexed",
    tags: asList(record.tags).map(String),
    categories: asList(record.categories ?? record.category).map(String),
    metrics: clone(record.metrics ?? {}),
    bounds: clone(record.bounds ?? {}),
    refs: clone(record.refs ?? record.urls ?? {}),
    metadata: clone(record.metadata ?? {})
  };
}

export function createObjaverseMetadataIndexState(options = {}) {
  const records = asList(options.records ?? options.metadata).map(normalizeObjaverseMetadata);
  return { version: OBJAVERSE_METADATA_INDEX_KIT_VERSION, records: Object.fromEntries(records.map((record) => [record.assetId, record])), history: [] };
}

export function createObjaverseMetadataIndexKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "objaverseMetadataIndex.state");
  const Updated = event("objaverseMetadataIndex.updated");
  const Registered = event("objaverseMetadataIndex.registered");
  const initial = () => createObjaverseMetadataIndexState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "objaverse-metadata-index-kit",
    resources: { State },
    events: { Updated, Registered },
    provides: ["objaverse:metadata-index", "asset:metadata-index", "asset:metrics-index"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const publish = (next, eventRecord) => { next.history = eventRecord ? [eventRecord, ...(next.history ?? [])].slice(0, 64) : next.history; world.setResource(State, next); world.emit?.(Updated, { state: clone(next), event: clone(eventRecord) }); return clone(next); };
      const api = {
        getState: state,
        snapshot: () => clone(state()),
        register(record = {}) {
          const next = state();
          const normalized = normalizeObjaverseMetadata(record, Object.keys(next.records).length);
          next.records[normalized.assetId] = normalized;
          const eventRecord = { type: "registered", assetId: normalized.assetId };
          world.emit?.(Registered, { record: clone(normalized) });
          return publish(next, eventRecord);
        },
        registerMany(records = []) { return asList(records).map((record) => this.register(record)); },
        get(assetId, fallback = null) { return clone(state().records?.[assetId] ?? fallback); },
        query(filter = {}) { return Object.values(state().records ?? {}).filter((record) => (!filter.status || record.status === filter.status) && (!filter.source || record.source === filter.source) && (!filter.tag || record.tags.includes(filter.tag)) && (!filter.category || record.categories.includes(filter.category))).map(clone); },
        reset() { world.setResource(State, initial()); return this.snapshot(); }
      };
      engine.objaverseMetadataIndex = api;
      engine.n ??= {};
      engine.n.objaverseMetadataIndex = api;
    },
    metadata: { version: OBJAVERSE_METADATA_INDEX_KIT_VERSION, purpose: "Objaverse metadata, bounds, references, and budget metrics index." }
  });
}

export default createObjaverseMetadataIndexKit;
