import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const DEPLOY_MANIFEST_KIT_VERSION = "0.1.0";
export const DEFAULT_DEPLOY_PERFORMANCE_PROFILE = Object.freeze({
  targetFps: 60,
  maxActiveScenes: 1,
  maxActiveRooms: 4,
  maxDynamicLights: 8,
  maxFullSimEntities: 32,
  maxDescriptors: 1000,
  maxMemoryMb: 1024
});

const list = (value) => asList(value).filter((entry) => entry != null).map((entry) => typeof entry === "string" ? entry : clone(entry));

export function normalizeDeployManifest(input = {}) {
  const id = String(input.id ?? "").trim();
  if (!id) throw new TypeError("Deploy manifest requires an id.");
  return {
    version: input.version ?? DEPLOY_MANIFEST_KIT_VERSION,
    id,
    title: String(input.title ?? id),
    kind: String(input.kind ?? input.type ?? "scene-deploy-kit"),
    route: input.route ? String(input.route) : null,
    uses: list(input.uses ?? input.kitStack),
    assetPacks: list(input.assetPacks ?? input.assets),
    entities: list(input.entities),
    sequences: list(input.sequences),
    performanceProfile: { ...DEFAULT_DEPLOY_PERFORMANCE_PROFILE, ...(input.performanceProfile ?? input.performance ?? {}) },
    saveScope: { profile: false, world: true, scene: true, deltaOnly: true, ...(input.saveScope ?? {}) },
    entry: clone(input.entry ?? {}),
    exits: list(input.exits),
    metadata: clone(input.metadata ?? {})
  };
}

export function validateDeployManifest(manifestInput = {}) {
  const errors = [];
  let manifest = null;
  try { manifest = normalizeDeployManifest(manifestInput); } catch (error) { errors.push(error.message); }
  if (manifest) {
    if (!manifest.kind.includes("deploy")) errors.push("kind should describe a deploy kit or deploy scene");
    if (!Array.isArray(manifest.uses)) errors.push("uses must be an array");
    if (!Array.isArray(manifest.assetPacks)) errors.push("assetPacks must be an array");
    if (!manifest.performanceProfile || typeof manifest.performanceProfile !== "object") errors.push("missing performanceProfile");
  }
  return { ok: errors.length === 0, errors, manifest };
}

export function createDeployManifestKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const DeployManifestState = resource(options.resourceName ?? "deployManifest.state");
  const DeployManifestRegistered = event("deployManifest.registered");
  const DeployManifestRejected = event("deployManifest.rejected");
  const createState = () => ({ version: DEPLOY_MANIFEST_KIT_VERSION, manifests: {} });
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "deploy-manifest-kit",
    resources: { DeployManifestState },
    events: { DeployManifestRegistered, DeployManifestRejected },
    provides: ["deploy-manifest", "deploy-manifest-validation"],
    initWorld({ world }) { ensureResource(world, DeployManifestState, createState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, DeployManifestState, createState);
      engine.deployManifests = {
        register(input = {}) {
          const result = validateDeployManifest(input);
          if (!result.ok) {
            world.emit(DeployManifestRejected, { input: clone(input), errors: result.errors });
            return result;
          }
          const next = state();
          next.manifests[result.manifest.id] = result.manifest;
          world.setResource(DeployManifestState, next);
          world.emit(DeployManifestRegistered, { manifest: clone(result.manifest) });
          return { ok: true, manifest: clone(result.manifest) };
        },
        validate: validateDeployManifest,
        get(id) { return clone(state().manifests?.[id] ?? null); },
        list() { return Object.values(state().manifests ?? {}).map(clone); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: DEPLOY_MANIFEST_KIT_VERSION, purpose: "Renderer-agnostic deploy and scene manifest normalization and validation." }
  });
}

export default createDeployManifestKit;
