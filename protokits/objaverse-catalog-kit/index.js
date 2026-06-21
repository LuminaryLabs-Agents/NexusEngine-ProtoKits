import { asList, clone, createDefinitionFactory, createSeededRandom, defineInjectedRuntimeKit, ensureResource, number, weightedChoice } from "../protokit-core/index.js";

export const OBJAVERSE_CATALOG_KIT_VERSION = "0.1.0";

function list(value) { return asList(value).map(String).filter(Boolean); }

export function normalizeObjaverseAsset(asset = {}, index = 0) {
  const id = String(asset.id ?? asset.uid ?? asset.objectId ?? `objaverse-asset-${index + 1}`);
  return {
    id,
    kind: String(asset.kind ?? asset.type ?? "object"),
    label: String(asset.label ?? asset.name ?? id),
    species: asset.species ?? asset.category ?? null,
    biomes: list(asset.biomes ?? asset.biome ?? asset.tags),
    tags: list(asset.tags),
    weight: number(asset.weight, 1),
    urls: clone(asset.urls ?? {}),
    mesh: asset.mesh ?? asset.url ?? asset.urls?.mesh ?? null,
    lods: asList(asset.lods ?? asset.urls?.lods),
    impostor: asset.impostor ?? asset.urls?.impostor ?? null,
    preview: asset.preview ?? asset.thumbnail ?? asset.urls?.preview ?? null,
    metrics: clone(asset.metrics ?? {}),
    materialSlots: clone(asset.materialSlots ?? asset.materials ?? {}),
    license: clone(asset.license ?? {}),
    metadata: clone(asset.metadata ?? {})
  };
}

export function createObjaverseCatalogState(options = {}) {
  const assets = asList(options.assets ?? options.catalog).map(normalizeObjaverseAsset);
  return {
    version: OBJAVERSE_CATALOG_KIT_VERSION,
    assetBaseUrl: options.assetBaseUrl ?? "",
    assets: Object.fromEntries(assets.map((asset) => [asset.id, asset])),
    history: []
  };
}

export function queryObjaverseCatalog(state = {}, filter = {}) {
  return Object.values(state.assets ?? {}).filter((asset) => {
    if (filter.id && asset.id !== filter.id) return false;
    if (filter.kind && asset.kind !== filter.kind) return false;
    if (filter.species && asset.species !== filter.species) return false;
    if (filter.biome && !asset.biomes.includes(filter.biome)) return false;
    if (filter.tag && !asset.tags.includes(filter.tag)) return false;
    return true;
  }).map(clone);
}

export function createObjaverseCatalogKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "objaverseCatalog.state");
  const Updated = event("objaverseCatalog.updated");
  const AssetRegistered = event("objaverseCatalog.assetRegistered");
  const initial = () => createObjaverseCatalogState(options);

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "objaverse-catalog-kit",
    resources: { State },
    events: { Updated, AssetRegistered },
    provides: ["objaverse:catalog", "asset:catalog", "objaverse:asset-query", "asset:index-descriptors"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const publish = (next, eventRecord) => { next.history = eventRecord ? [eventRecord, ...(next.history ?? [])].slice(0, 64) : next.history; world.setResource(State, next); world.emit?.(Updated, { state: clone(next), event: clone(eventRecord) }); return clone(next); };
      const api = {
        getState: state,
        snapshot: () => clone(state()),
        register(asset = {}) {
          const next = state();
          const normalized = normalizeObjaverseAsset(asset, Object.keys(next.assets).length);
          next.assets[normalized.id] = normalized;
          const evt = { type: "registered", assetId: normalized.id };
          world.emit?.(AssetRegistered, { asset: clone(normalized) });
          return publish(next, evt);
        },
        registerMany(assets = []) { return asList(assets).map((asset) => this.register(asset)); },
        get(id, fallback = null) { return clone(state().assets?.[id] ?? fallback); },
        query(filter = {}) { return queryObjaverseCatalog(state(), filter); },
        pickWeighted(filter = {}, seedOrRandom = "objaverse-catalog") {
          const rng = typeof seedOrRandom?.next === "function" ? seedOrRandom : createSeededRandom(String(seedOrRandom));
          return clone(weightedChoice(this.query(filter), rng) ?? null);
        },
        listKinds() { return [...new Set(Object.values(state().assets ?? {}).map((asset) => asset.kind))]; },
        listBiomes() { return [...new Set(Object.values(state().assets ?? {}).flatMap((asset) => asset.biomes))]; },
        reset() { world.setResource(State, initial()); return this.snapshot(); }
      };
      engine.objaverseCatalog = api;
      engine.n ??= {};
      engine.n.objaverseCatalog = api;
    },
    metadata: { version: OBJAVERSE_CATALOG_KIT_VERSION, purpose: "Renderer-agnostic Objaverse-derived asset catalog and query service without browser IO." }
  });
}

export default createObjaverseCatalogKit;
