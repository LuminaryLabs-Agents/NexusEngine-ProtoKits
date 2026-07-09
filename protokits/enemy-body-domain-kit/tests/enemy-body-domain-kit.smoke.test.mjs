// Smoke signature: NexusEngine-scoped-domain-rpg-batch-01::enemy-body-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createEnemyBodyDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine } = installKit(createEnemyBodyDomainKit, {});
  assertKitContract(kit);
  const body = engine.enemyBodyDomain.describe({ id: env.routeId, archetype: "wraith", height: 2.4, radius: 0.5 });
  assert.equal(body.hitCapsule.height > 2, true, `${env.name}: creates enemy hit capsule`);
  assert.equal(Boolean(body.parts.head), true, `${env.name}: gives enemy a head/body part descriptor`);
}
