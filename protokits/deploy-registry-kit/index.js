import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";
import { normalizeDeployManifest, validateDeployManifest } from "../deploy-manifest-kit/index.js";

export const DEPLOY_REGISTRY_KIT_VERSION = "0.1.0";

export function createDeployRegistry(manifests = []) {
  const byId = new Map();
  const register = (input) => {
    const result = validateDeployManifest(input);
    if (!result.ok) return result;
    byId.set(result.manifest.id, result.manifest);
    return { ok: true, manifest: clone(result.manifest) };
  };
  for (const manifest of asList(manifests)) register(manifest);
  return {
    register,
    get(id) { return clone(byId.get(id) ?? null); },
    list(filter = {}) {
      let values = [...byId.values()];
      if (filter.kind) values = values.filter((manifest) => manifest.kind === filter.kind);
      if (filter.uses) values = values.filter((manifest) => manifest.uses.includes(filter.uses));
      return values.map(clone);
    },
    resolveKitStack(id) {
      const manifest = byId.get(id);
      return manifest ? [...new Set(manifest.uses ?? [])] : [];
    },
    listScenes() { return this.list().filter((manifest) => /scene/i.test(manifest.kind)); },
    listApps() { return this.list().filter((manifest) => /app|game/i.test(manifest.kind)); },
    listAssetPacks() { return [...new Set(this.list().flatMap((manifest) => manifest.assetPacks ?? []))]; },
    snapshot() { return { version: DEPLOY_REGISTRY_KIT_VERSION, manifests: this.list() }; }
  };
}

export function createDeployRegistryKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const DeployRegistryState = resource(options.resourceName ?? "deployRegistry.state");
  const DeployRegistered = event("deployRegistry.registered");
  const DeployRejected = event("deployRegistry.rejected");
  const createState = () => ({
    version: DEPLOY_REGISTRY_KIT_VERSION,
    manifests: Object.fromEntries(asList(options.manifests).map((manifest) => {
      const normalized = normalizeDeployManifest(manifest);
      return [normalized.id, normalized];
    }))
  });
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "deploy-registry-kit",
    resources: { DeployRegistryState },
    events: { DeployRegistered, DeployRejected },
    provides: ["deploy-registry", "scene-registry", "deploy-kit-stack-resolution"],
    initWorld({ world }) { ensureResource(world, DeployRegistryState, createState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, DeployRegistryState, createState);
      const values = () => Object.values(state().manifests ?? {});
      engine.deployRegistry = {
        register(input = {}) {
          const result = validateDeployManifest(input);
          if (!result.ok) {
            world.emit(DeployRejected, { input: clone(input), errors: result.errors });
            return result;
          }
          const next = state();
          next.manifests[result.manifest.id] = result.manifest;
          world.setResource(DeployRegistryState, next);
          world.emit(DeployRegistered, { manifest: clone(result.manifest) });
          return { ok: true, manifest: clone(result.manifest) };
        },
        get(id) { return clone(state().manifests?.[id] ?? null); },
        list(filter = {}) {
          let entries = values();
          if (filter.kind) entries = entries.filter((manifest) => manifest.kind === filter.kind);
          if (filter.uses) entries = entries.filter((manifest) => manifest.uses.includes(filter.uses));
          return entries.map(clone);
        },
        resolveKitStack(id) { return [...new Set((state().manifests?.[id]?.uses ?? []).map(String))]; },
        listScenes() { return values().filter((manifest) => /scene/i.test(manifest.kind)).map(clone); },
        listApps() { return values().filter((manifest) => /app|game/i.test(manifest.kind)).map(clone); },
        listAssetPacks() { return [...new Set(values().flatMap((manifest) => manifest.assetPacks ?? []))]; },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: DEPLOY_REGISTRY_KIT_VERSION, purpose: "Registry and resolver for deploy manifests, scenes, apps, asset packs, and kit stacks." }
  });
}

export default createDeployRegistryKit;
