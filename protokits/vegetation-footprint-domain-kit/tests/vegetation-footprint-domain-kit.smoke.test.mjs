// Smoke signature: NexusEngine-scoped-domain-rpg-batch-01::vegetation-footprint-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createVegetationFootprintDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine } = installKit(createVegetationFootprintDomainKit, { minSpacing: 0.1 });
  assertKitContract(kit);
  assert.equal(engine.vegetationFootprintDomain.tryPlace({ id: `${env.routeId}-a`, x: 0, z: 0, radius: 2 }).ok, true, `${env.name}: accepts first tree`);
  assert.equal(engine.vegetationFootprintDomain.tryPlace({ id: `${env.routeId}-b`, x: 1, z: 0, radius: 2 }).reason, "footprint-overlap", `${env.name}: rejects overlap`);
  assert.equal(engine.vegetationFootprintDomain.tryPlace({ id: `${env.routeId}-c`, x: 6, z: 0, radius: 2 }).ok, true, `${env.name}: accepts clear placement`);
}
