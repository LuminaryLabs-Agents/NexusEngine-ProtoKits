import { assert, createMockNexusRealtime, createSmokeWorld } from "./aaa-domain-spine-smoke-harness.mjs";
import { createDomainManifestRegistryDomainKit } from "../protokits/domain-manifest-registry-domain-kit/index.js";
import { createDomainTaxonomyDomainKit } from "../protokits/domain-taxonomy-domain-kit/index.js";
import { createDomainInventoryDomainKit } from "../protokits/domain-inventory-domain-kit/index.js";

const NexusRealtime = createMockNexusRealtime();
const world = createSmokeWorld();
const engine = {};
const kits = [
  createDomainManifestRegistryDomainKit(NexusRealtime),
  createDomainTaxonomyDomainKit(NexusRealtime),
  createDomainInventoryDomainKit(NexusRealtime)
];

for (const kit of kits) kit.initWorld?.({ world, engine });
for (const kit of kits) kit.install?.({ world, engine });

const heatManifest = engine.domainManifestRegistry.registerManifest({
  id: "heat-pressure-domain-kit",
  domain: "heat-pressure",
  parentDomain: "pressure",
  scope: "atomic-domain",
  extendsBase: "DomainServiceKit",
  requires: ["n:runtime.engine"],
  provides: ["n:pressure.heat"],
  exportPath: "./heat-pressure-domain-kit",
  sourcePath: "protokits/heat-pressure-domain-kit/index.js",
  status: "experimental"
});

assert.equal(engine.domainManifestRegistry.validateManifest(heatManifest.id).ok, true, "manifest validates");
assert.equal(engine.domainManifestRegistry.listByProvides("n:pressure.heat").length, 1, "manifest indexes provides token");
assert.equal(engine.domainManifestRegistry.listByDomain("pressure").length, 1, "manifest indexes parent domain");

const classification = engine.domainTaxonomy.classify(heatManifest);
assert.equal(classification.kind, "service-domain", "taxonomy classifies domain-kit as service domain");
assert.equal(classification.boundaryReady, true, "taxonomy sees boundary evidence");
assert.equal(engine.domainTaxonomy.validateName("heat-pressure-domain-kit").ok, true, "domain name passes policy");

engine.domainInventory.registerEntry({
  id: "heat-pressure-domain-kit",
  path: "protokits/heat-pressure-domain-kit",
  hasIndex: true,
  hasReadme: false,
  hasManifest: true,
  factories: ["createHeatPressureDomainKit"],
  versionConstants: ["HEAT_PRESSURE_DOMAIN_KIT_VERSION"]
});

const summary = engine.domainInventory.summarize();
assert.equal(summary.total, 1, "inventory tracks one entry");
assert.equal(summary.missingReadme, 1, "inventory reports missing README");
assert.deepEqual(engine.domainInventory.listMissing("readme"), ["heat-pressure-domain-kit"], "inventory lists missing README by field");
