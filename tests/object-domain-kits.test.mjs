import assert from "node:assert/strict";
import { normalizeObjectFamily, queryObjectFamilies } from "../protokits/object-family-kit/index.js";
import { pickObjectVariant } from "../protokits/object-variant-selection-kit/index.js";
import { selectObjectLod } from "../protokits/object-lod-policy-kit/index.js";
import { describeObjectMaterialVariant } from "../protokits/object-material-variant-kit/index.js";
import { describeObjectGroundingProfile } from "../protokits/object-grounding-profile-kit/index.js";
import { normalizeObjectMeshRequest } from "../protokits/object-mesh-request-kit/index.js";
import { summarizeObjectResidency } from "../protokits/object-residency-kit/index.js";

const family = normalizeObjectFamily({ id: "tree_pine_001", kind: "tree", family: "conifer", biomes: ["mixed-forest"], weight: 2 });
assert.equal(family.kind, "tree");
assert.equal(queryObjectFamilies({ families: { [family.id]: family } }, { kind: "tree", biome: "mixed-forest" }).length, 1);

const picked = pickObjectVariant([family], { seed: "test", recent: [], recentLimit: 4 }, { biome: "mixed-forest" }, "seed");
assert.equal(picked.id, "tree_pine_001");

const lod = selectObjectLod({ id: family.id, lods: ["lod0.glb", "lod1.glb", "lod2.glb"] }, { position: { x: 100, z: 0 } }, { position: { x: 0, z: 0 } });
assert.ok(["lod0", "lod1", "lod2", "impostor", "culled"].includes(lod.lod));

const material = describeObjectMaterialVariant(family, { biome: "mixed-forest", scale: 1 });
assert.ok(material.slots);

const grounding = describeObjectGroundingProfile({ kind: "tree" }, { kind: "tree" }, { normal: { x: 0, y: 1, z: 0 } });
assert.equal(grounding.valid, true);

const request = normalizeObjectMeshRequest({ assetId: family.id, lod: lod.lod, url: lod.url });
assert.equal(request.assetId, family.id);

const summary = summarizeObjectResidency({ budgetBytes: 100, entries: { a: { status: "ready", bytes: 10 }, b: { status: "fallback", bytes: 0 } } });
assert.equal(summary.ready, 1);
assert.equal(summary.fallback, 1);

console.log("object-domain-kits ok");
