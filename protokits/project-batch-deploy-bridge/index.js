import { asList, clone } from "../protokit-core/index.js";
import { normalizeDeployManifest } from "../deploy-manifest-kit/index.js";

export const PROJECT_BATCH_DEPLOY_BRIDGE_VERSION = "0.1.0";

export function convertProjectBatchItemToDeployManifest(project = {}) {
  const id = String(project.id ?? "").trim();
  if (!id) throw new TypeError("Project batch item requires an id.");
  return normalizeDeployManifest({
    id,
    title: project.title ?? id,
    kind: "app-deploy-kit",
    route: project.route ?? null,
    uses: asList(project.kitStack ?? project.uses).map(String),
    assetPacks: asList(project.assetPacks ?? project.assets ?? [`${id}-visual-pack`]).map(String),
    entities: asList(project.entities),
    sequences: asList(project.sequences ?? []),
    performanceProfile: { targetFps: 60, maxActiveScenes: 1, maxFullSimEntities: 32, maxDescriptors: 900, ...(project.performanceProfile ?? {}) },
    entry: { route: project.route ?? null, verb: project.verb ?? null },
    exits: asList(project.exits),
    metadata: {
      bridge: "project-batch-deploy-bridge",
      bridgeVersion: PROJECT_BATCH_DEPLOY_BRIDGE_VERSION,
      fantasy: project.fantasy ?? "",
      verb: project.verb ?? "",
      pressureLoop: project.pressureLoop ?? "",
      visualIdentity: project.visualIdentity ?? "",
      controls: project.controls ?? "",
      palette: clone(project.palette ?? []),
      sourceSpec: clone(project)
    }
  });
}

export function convertProjectBatchToDeployManifests(projects = []) {
  return asList(projects).map(convertProjectBatchItemToDeployManifest);
}

export function createProjectBatchDeployBridge(projects = []) {
  const manifests = convertProjectBatchToDeployManifests(projects);
  return {
    version: PROJECT_BATCH_DEPLOY_BRIDGE_VERSION,
    manifests,
    get(id) { return clone(manifests.find((manifest) => manifest.id === id) ?? null); },
    list() { return manifests.map(clone); },
    snapshot() { return { version: PROJECT_BATCH_DEPLOY_BRIDGE_VERSION, manifests: this.list() }; }
  };
}

export default createProjectBatchDeployBridge;
