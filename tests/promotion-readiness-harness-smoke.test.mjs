import { assert, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import { createPromotionReadinessHarness } from "../protokits/promotion-readiness-harness/index.js";

const { engine, world, kit } = installKit(createPromotionReadinessHarness);
engine.promotionReadiness.registerKit({
  id: "sample-domain-kit",
  exportPath: "./sample-domain-kit",
  readmePath: "protokits/sample-domain-kit/README.md",
  versionConstant: "SAMPLE_DOMAIN_KIT_VERSION",
  factoryExport: "createSampleDomainKit",
  resources: ["sample.state"],
  events: ["sample.changed"],
  systems: ["sampleSystem"],
  provides: ["sample:state"],
  reset: "reset()",
  snapshot: "getState()",
  promotionCriteria: ["headless tests", "multi config"]
});
engine.promotionReadiness.attachTestResult("sample-domain-kit", { ok: true, kind: "headless" });
engine.promotionReadiness.attachTestResult("sample-domain-kit", { ok: true, kind: "boundary-lint" });
engine.promotionReadiness.attachExperimentProof("sample-domain-kit", { ok: true, configCount: 2 });
const report = engine.promotionReadiness.evaluate("sample-domain-kit");

assert.equal(report.ok, true, "complete readiness packet passes");
assert.equal(engine.promotionReadiness.latestReport("sample-domain-kit").status, "ready", "latest report is stored");
assert.equal(world.getEvents(kit.events.ReadinessEvaluated).length, 1, "readiness evaluation emits event");
