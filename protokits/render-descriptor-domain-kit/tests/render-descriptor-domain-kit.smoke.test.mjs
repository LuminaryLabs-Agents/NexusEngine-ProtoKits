// Smoke signature: NexusRealtime-scoped-domain-rpg-batch-01::render-descriptor-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createRenderDescriptorDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine } = installKit(createRenderDescriptorDomainKit, {});
  assertKitContract(kit);
  const descriptor = engine.renderDescriptorDomain.register({ id: env.routeId, kind: "enemy-body", layer: "character" });
  assert.equal(descriptor.kind, "enemy-body", `${env.name}: registers render descriptor`);
  assert.equal(engine.renderDescriptorDomain.getState().descriptorsById[env.routeId].layer, "character", `${env.name}: stores descriptor by id`);
}
