import { asList, clone } from "../protokit-core/index.js";
import { normalizeDeployManifest } from "../deploy-manifest-kit/index.js";

export const AAA_BATCH_DEPLOY_BRIDGE_VERSION = "0.1.0";

export function convertAaaBatchGameToDeployManifest(game = {}) {
  const id = String(game.id ?? "").trim();
  if (!id) throw new TypeError("AAA batch game spec requires an id.");
  return normalizeDeployManifest({
    id,
    title: game.title ?? id,
    kind: "app-deploy-kit",
    route: game.route ?? null,
    uses: asList(game.kitStack).map(String),
    assetPacks: asList(game.assetPacks ?? [`${id}-visual-pack`]).map(String),
    entities: asList(game.entities),
    sequences: asList(game.sequences ?? [{ id: `${id}.smoke`, actions: asList(game.smoke ?? game.smokeActions).map(String) }]),
    performanceProfile: { targetFps: 60, maxActiveScenes: 1, maxFullSimEntities: 32, maxDescriptors: 900, ...(game.performanceProfile ?? {}) },
    entry: { route: game.route ?? null, verb: game.verb ?? null },
    exits: asList(game.exits),
    metadata: {
      bridge: "aaa-batch-deploy-bridge",
      bridgeVersion: AAA_BATCH_DEPLOY_BRIDGE_VERSION,
      fantasy: game.fantasy ?? "",
      verb: game.verb ?? "",
      pressureLoop: game.pressureLoop ?? "",
      visualIdentity: game.visualIdentity ?? "",
      controls: game.controls ?? "",
      palette: clone(game.palette ?? []),
      smoke: asList(game.smoke ?? game.smokeActions).map(String),
      sourceSpec: clone(game)
    }
  });
}

export function convertAaaBatchGamesToDeployManifests(games = []) {
  return asList(games).map(convertAaaBatchGameToDeployManifest);
}

export function createAaaBatchDeployBridge(games = []) {
  const manifests = convertAaaBatchGamesToDeployManifests(games);
  return {
    version: AAA_BATCH_DEPLOY_BRIDGE_VERSION,
    manifests,
    get(id) { return clone(manifests.find((manifest) => manifest.id === id) ?? null); },
    list() { return manifests.map(clone); },
    snapshot() { return { version: AAA_BATCH_DEPLOY_BRIDGE_VERSION, manifests: this.list() }; }
  };
}

export default createAaaBatchDeployBridge;
