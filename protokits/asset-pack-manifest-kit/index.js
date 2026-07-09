import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const ASSET_PACK_MANIFEST_KIT_VERSION = "0.1.0";

export function normalizeAssetPackManifest(input = {}) {
  const id = String(input.id ?? "").trim();
  if (!id) throw new TypeError("Asset pack manifest requires an id.");
  return {
    version: input.version ?? ASSET_PACK_MANIFEST_KIT_VERSION,
    id,
    title: String(input.title ?? id),
    kind: String(input.kind ?? "asset-pack"),
    assets: asList(input.assets).map((asset) => typeof asset === "string" ? { id: asset, uri: asset } : clone(asset)),
    tags: asList(input.tags).map(String),
    dependencies: asList(input.dependencies).map(String),
    budgets: clone(input.budgets ?? {}),
    metadata: clone(input.metadata ?? {})
  };
}

export function validateAssetPackManifest(input = {}) {
  const errors = [];
  let manifest = null;
  try { manifest = normalizeAssetPackManifest(input); } catch (error) { errors.push(error.message); }
  if (manifest) {
    if (!Array.isArray(manifest.assets)) errors.push("assets must be an array");
    for (const asset of manifest.assets) if (!asset.id && !asset.uri) errors.push("asset entries need id or uri");
  }
  return { ok: errors.length === 0, errors, manifest };
}

export function createAssetPackRegistry(manifests = []) {
  const byId = new Map();
  return {
    register(input = {}) {
      const result = validateAssetPackManifest(input);
      if (!result.ok) return result;
      byId.set(result.manifest.id, result.manifest);
      return { ok: true, manifest: clone(result.manifest) };
    },
    get(id) { return clone(byId.get(id) ?? null); },
    list() { return [...byId.values()].map(clone); },
    resolve(ids = []) { return asList(ids).map((id) => byId.get(String(id))).filter(Boolean).map(clone); },
    snapshot() { return { version: ASSET_PACK_MANIFEST_KIT_VERSION, assetPacks: this.list() }; },
    seed() { for (const manifest of asList(manifests)) this.register(manifest); return this; }
  }.seed();
}

export function createAssetPackManifestKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const AssetPackState = resource(options.resourceName ?? "assetPackManifest.state");
  const AssetPackRegistered = event("assetPackManifest.registered");
  const createState = () => ({
    version: ASSET_PACK_MANIFEST_KIT_VERSION,
    assetPacks: Object.fromEntries(asList(options.assetPacks).map((entry) => {
      const manifest = normalizeAssetPackManifest(entry);
      return [manifest.id, manifest];
    }))
  });
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "asset-pack-manifest-kit",
    resources: { AssetPackState },
    events: { AssetPackRegistered },
    provides: ["asset-pack-manifest", "lazy-asset-pack-registry"],
    initWorld({ world }) { ensureResource(world, AssetPackState, createState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, AssetPackState, createState);
      engine.assetPacks = {
        register(input = {}) {
          const result = validateAssetPackManifest(input);
          if (!result.ok) return result;
          const next = state();
          next.assetPacks[result.manifest.id] = result.manifest;
          world.setResource(AssetPackState, next);
          world.emit(AssetPackRegistered, { assetPack: clone(result.manifest) });
          return { ok: true, manifest: clone(result.manifest) };
        },
        get(id) { return clone(state().assetPacks?.[id] ?? null); },
        list() { return Object.values(state().assetPacks ?? {}).map(clone); },
        resolve(ids = []) { return asList(ids).map((id) => state().assetPacks?.[String(id)]).filter(Boolean).map(clone); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: ASSET_PACK_MANIFEST_KIT_VERSION, purpose: "JSON-safe asset pack manifest registry for deploy manifests and lazy host loading." }
  });
}

export default createAssetPackManifestKit;
