import { assert, createMockNexusEngine, createSmokeWorld } from "./aaa-domain-spine-smoke-harness.mjs";
import { createGuidedKitAuthoringKit } from "../protokits/guided-kit-authoring-kit/index.js";
import { createKitManifestDomainKit } from "../protokits/kit-manifest-domain-kit/index.js";
import { createKitBoundaryLintKit } from "../protokits/kit-boundary-lint-kit/index.js";

const NexusEngine = createMockNexusEngine();
const world = createSmokeWorld();
const engine = {};
const kits = [
  createGuidedKitAuthoringKit(NexusEngine),
  createKitManifestDomainKit(NexusEngine),
  createKitBoundaryLintKit(NexusEngine)
];
for (const kit of kits) kit.initWorld?.({ world, engine });
for (const kit of kits) kit.install?.({ world, engine });

const spec = engine.guidedKitAuthoring.createSpec({
  id: "sample-domain-kit",
  domain: "sample",
  purpose: "Test guided authoring.",
  doesOwn: ["state"],
  doesNotOwn: ["renderer"],
  resources: ["sample.state"],
  events: ["sample.changed"],
  publicApi: { getState: true },
  provides: ["sample:state"],
  tests: ["tests/sample.test.mjs"],
  docs: ["protokits/sample-domain-kit/README.md"],
  promotionCriteria: ["headless tests"]
});

const validation = engine.guidedKitAuthoring.validateSpec(spec.id);
assert.equal(validation.ok, true, "guided kit spec validates");
assert.equal(engine.guidedKitAuthoring.planFiles(spec.id).files[0], "protokits/sample-domain-kit/index.js", "file plan is deterministic");

const manifest = engine.kitManifest.registerManifest({ id: "sample-domain-kit", domain: "sample", provides: ["sample:state"], exportPath: "./sample-domain-kit", sourcePath: "protokits/sample-domain-kit/index.js", status: "experimental" });
assert.equal(engine.kitManifest.validateManifest(manifest.id).ok, true, "kit manifest validates");
assert.equal(engine.kitManifest.listByProvides("sample:state").length, 1, "manifest can be queried by provide token");

const clean = engine.kitBoundaryLint.scanText("sample.js", "export const ok = true;");
assert.equal(clean.ok, true, "clean source passes lint");
const dirty = engine.kitBoundaryLint.scanText("sample.js", "const now = Date.now();");
assert.equal(dirty.ok, false, "wall-clock usage is flagged");
