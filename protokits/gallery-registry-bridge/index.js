import { asList, clone } from "../protokit-core/index.js";
import { normalizeDeployManifest } from "../deploy-manifest-kit/index.js";

export const GALLERY_REGISTRY_BRIDGE_VERSION = "0.1.0";

export function convertGalleryAppToDeployManifest(app = {}) {
  const id = String(app.id ?? "").trim();
  if (!id) throw new TypeError("Gallery app entry requires an id.");
  return normalizeDeployManifest({
    id,
    title: app.displayTitle ?? app.title ?? id,
    kind: app.kind === "experiment" ? "experiment-deploy-kit" : "app-deploy-kit",
    route: app.route ?? null,
    uses: asList(app.kitStack).map(String),
    assetPacks: asList(app.assetPacks),
    performanceProfile: app.performanceProfile ?? { targetFps: 60, maxActiveScenes: 1 },
    entry: { route: app.route ?? null, tab: app.tab ?? null },
    metadata: {
      bridge: "gallery-registry-bridge",
      bridgeVersion: GALLERY_REGISTRY_BRIDGE_VERSION,
      source: app.source ?? null,
      description: app.description ?? app.shortDescription ?? "",
      controls: app.controls ?? "",
      tags: clone(app.tags ?? []),
      smokeActions: asList(app.smokeActions).map(String),
      searchText: app.searchText ?? "",
      sourceApp: clone(app)
    }
  });
}

export function convertGalleryAppsToDeployManifests(apps = []) {
  return asList(apps).map(convertGalleryAppToDeployManifest);
}

export function createGalleryRegistryBridge(apps = []) {
  const manifests = convertGalleryAppsToDeployManifests(apps);
  return {
    version: GALLERY_REGISTRY_BRIDGE_VERSION,
    manifests,
    get(id) { return clone(manifests.find((manifest) => manifest.id === id) ?? null); },
    list() { return manifests.map(clone); },
    snapshot() { return { version: GALLERY_REGISTRY_BRIDGE_VERSION, manifests: this.list() }; }
  };
}

export default createGalleryRegistryBridge;
