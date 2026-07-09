// Smoke signature: NexusEngine-scoped-domain-rpg-batch-01::scan-affordance-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createScanAffordanceDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine, tick } = installKit(createScanAffordanceDomainKit, { targets: [{ id: "relay" }], scanAmount: 1 });
  assertKitContract(kit);
  engine.scanAffordanceDomain.scan("relay", { routeId: env.routeId });
  tick(env.dt);
  assert.equal(engine.scanAffordanceDomain.getState().targets.relay.scanned, true, `${env.name}: scans target`);
  engine.scanAffordanceDomain.scan("missing", { routeId: env.routeId });
  tick(env.dt);
  assert.equal(engine.scanAffordanceDomain.getState().lastResult.reason, "missing-scan-target", `${env.name}: rejects missing target`);
}
