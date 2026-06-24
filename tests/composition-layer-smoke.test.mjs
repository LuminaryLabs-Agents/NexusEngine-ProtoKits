import assert from "node:assert/strict";

import { defineDomainBoundary, createDomainBoundaryRegistry } from "../protokits/domain-boundary-kit/index.js";
import { normalizeDeployManifest, validateDeployManifest } from "../protokits/deploy-manifest-kit/index.js";
import { createDeployRegistry } from "../protokits/deploy-registry-kit/index.js";
import { normalizeAssetPackManifest, createAssetPackRegistry } from "../protokits/asset-pack-manifest-kit/index.js";
import { createSceneLifecycleState, enterScene, pauseScene, resumeScene, disposeScene } from "../protokits/scene-lifecycle-kit/index.js";
import { createSceneTransitionState, requestSceneTransition, completeSceneTransition } from "../protokits/scene-transition-kit/index.js";
import { createSceneGraphState, applySceneGraphPatch } from "../protokits/scene-graph-domain-kit/index.js";
import { createSaveDeltaState, recordScenePatch, mergeSceneDelta } from "../protokits/save-delta-kit/index.js";
import { createHostShellDescriptor } from "../protokits/host-shell-contract-kit/index.js";
import { createSessionFacadeState, recordSessionCommand, recordSessionSnapshot, createValidationSnapshot } from "../protokits/session-facade-kit/index.js";
import { createKitRegistry } from "../protokits/kit-registry/index.js";
import { convertAaaBatchGameToDeployManifest } from "../protokits/aaa-batch-deploy-bridge/index.js";
import { convertGalleryAppToDeployManifest } from "../protokits/gallery-registry-bridge/index.js";
import { createGeneratedRouteHostBridge } from "../protokits/generated-route-host-bridge/index.js";

const boundary = defineDomainBoundary({ id: "house", kitId: "house-domain-kit", resources: ["house.state"], methods: ["engine.house.getState"], boundary: "House state." });
assert.equal(boundary.id, "house");
assert.equal(createDomainBoundaryRegistry([boundary]).get("house-domain-kit").id, "house");

const deploy = normalizeDeployManifest({ id: "living-house.entry", title: "Entry", uses: ["house-domain-kit"], assetPacks: ["old-house"] });
assert.equal(validateDeployManifest(deploy).ok, true);
const deployRegistry = createDeployRegistry([deploy]);
assert.deepEqual(deployRegistry.resolveKitStack("living-house.entry"), ["house-domain-kit"]);

const assetPack = normalizeAssetPackManifest({ id: "old-house", assets: ["chair.glb"] });
assert.equal(createAssetPackRegistry([assetPack]).resolve(["old-house"])[0].id, "old-house");

let lifecycle = createSceneLifecycleState();
lifecycle = enterScene(lifecycle, deploy, 12);
assert.equal(lifecycle.status, "active");
lifecycle = pauseScene(lifecycle);
assert.equal(lifecycle.status, "paused");
lifecycle = resumeScene(lifecycle);
assert.equal(lifecycle.status, "active");
lifecycle = disposeScene(lifecycle);
assert.equal(lifecycle.status, "disposed");

let transition = createSceneTransitionState();
transition = requestSceneTransition(transition, { fromSceneId: "a", toSceneId: "b" });
assert.equal(transition.active.id, "transition:a->b");
transition = completeSceneTransition(transition);
assert.equal(transition.active, null);

let graph = createSceneGraphState({ sceneId: "room" });
graph = applySceneGraphPatch(graph, { type: "createObject", object: { id: "door", type: "door" } });
graph = applySceneGraphPatch(graph, { type: "updateObject", objectId: "door", partial: { tags: ["locked"] } });
assert.equal(graph.objects.door.tags[0], "locked");

let save = createSaveDeltaState();
save = recordScenePatch(save, { sceneId: "room", objectId: "door", partial: { open: true } });
assert.equal(mergeSceneDelta({ id: "room", objects: { door: { open: false } } }, save.sceneDeltas.room).objects.door.open, true);

const hostDescriptor = createHostShellDescriptor({ id: "desktop" }, { title: "Demo", status: "ok" });
assert.equal(hostDescriptor.title, "Demo");

let session = createSessionFacadeState({ id: "demo", smokeActions: ["start"] });
session = recordSessionCommand(session, { action: "start" });
session = recordSessionSnapshot(session, { ok: true });
assert.equal(createValidationSnapshot(session).commandCount, 1);

const kitRegistry = createKitRegistry([{ id: "house-domain-kit", provides: ["house-domain"] }, { id: "living-house-deploy", type: "deploy-kit", requires: ["house-domain"] }]);
assert.equal(kitRegistry.findCompatibleKits("living-house-deploy")[0].id, "house-domain-kit");

const aaaDeploy = convertAaaBatchGameToDeployManifest({ id: "ember-rail", title: "Ember Rail", kitStack: ["resource-pressure-kit"], smoke: ["vent"] });
assert.equal(aaaDeploy.uses[0], "resource-pressure-kit");

const galleryDeploy = convertGalleryAppToDeployManifest({ id: "fogline", title: "Fogline", kind: "experiment", route: "./experiments/fogline/" });
assert.equal(galleryDeploy.kind, "experiment-deploy-kit");

const generatedHost = createGeneratedRouteHostBridge({ id: "route" });
assert.equal(generatedHost.describe({ status: "ready" }).status, "ready");

console.log("composition-layer smoke passed");
