import assert from "node:assert/strict";
import { validateObjaverseManifest, resolveObjaverseAssetUrl } from "../protokits/objaverse-manifest-kit/index.js";
import { normalizeObjectInstance } from "../protokits/object-instance-stream-kit/index.js";
import { buildObjectStaticBatches } from "../protokits/object-static-batch-kit/index.js";
import { describeObjectImportTransform } from "../protokits/object-import-transform-kit/index.js";
import { describeObjaverseScaleNormalization } from "../protokits/objaverse-scale-normalization-kit/index.js";
import { describeObjectBounds } from "../protokits/object-bounds-descriptor-kit/index.js";
import { describeObjectPivotAnchor } from "../protokits/object-pivot-anchor-kit/index.js";
import { summarizeMeshChunkStream } from "../protokits/mesh-chunk-stream-kit/index.js";
import { buildObjectStreamPlan } from "../protokits/object-stream-plan-kit/index.js";

const manifest = { version: 1, assetBaseUrl: "https://assets.example/vegetation", assets: [{ id: "tree_pine_001", kind: "tree", lods: ["trees/pine/lod0.glb"] }] };
assert.equal(validateObjaverseManifest(manifest).ok, true);
assert.equal(resolveObjaverseAssetUrl(manifest, manifest.assets[0], "trees/pine/lod0.glb"), "https://assets.example/vegetation/trees/pine/lod0.glb");

const instance = normalizeObjectInstance({ id: "a", assetId: "tree_pine_001", patchKey: "0,0", position: { x: 1, y: 0, z: 2 } });
assert.equal(instance.assetId, "tree_pine_001");

const batches = buildObjectStaticBatches([instance]);
assert.equal(batches.length, 1);
assert.equal(batches[0].instances.length, 1);

const transform = describeObjectImportTransform({ id: "tree_pine_001", heightRange: [5, 12] }, { scalePolicy: { defaultHeight: 10 } });
assert.equal(transform.assetId, "tree_pine_001");

const scale = describeObjaverseScaleNormalization({ id: "tree_pine_001", heightRange: [5, 12] });
assert.equal(scale.targetHeight, 12);

const bounds = describeObjectBounds({ id: "tree_pine_001", heightRange: [5, 12], radiusRange: [1, 3] }, transform);
assert.equal(bounds.assetId, "tree_pine_001");
assert.ok(describeObjectPivotAnchor({ id: "tree_pine_001" }, bounds).groundAnchor);

const streamSummary = summarizeMeshChunkStream({ streams: { mesh: { status: "complete", bytesReceived: 32 } } });
assert.equal(streamSummary.complete, 1);

const plan = buildObjectStreamPlan([instance], { position: { x: 0, z: 0 } }, { objaverseCatalog: { get: () => ({ id: "tree_pine_001", lods: ["lod0.glb"] }) }, objectLodPolicy: { select: () => ({ assetId: "tree_pine_001", lod: "lod0", url: "lod0.glb", renderMode: "mesh" }) }, objectResidency: { isReady: () => false } });
assert.equal(plan.length, 1);

console.log("objaverse-streaming-static-batch-kits ok");
