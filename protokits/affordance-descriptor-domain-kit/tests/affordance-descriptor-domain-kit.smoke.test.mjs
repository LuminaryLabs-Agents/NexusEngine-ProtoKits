// Smoke signature: NexusRealtime-AAA-domain-spine-batch-01::affordance-descriptor-domain-kit::2026-06-20
import {
  assert,
  FIVE_SMOKE_ENVIRONMENTS,
  assertKitContract,
  installKit
} from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createAffordanceDescriptorDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine } = installKit(createAffordanceDescriptorDomainKit, {
    affordances: [{ targetId: "node", actions: ["interact", "repair"] }]
  });

  assertKitContract(kit);

  assert.equal(
    engine.affordanceDescriptorDomain.resolve("node", "repair", { routeId: env.routeId }).ok,
    true,
    `${env.name}: resolves supported affordance`
  );

  assert.equal(
    engine.affordanceDescriptorDomain.resolve("node", "attack", { routeId: env.routeId }).reason,
    "action-not-supported",
    `${env.name}: rejects unsupported action`
  );
}
