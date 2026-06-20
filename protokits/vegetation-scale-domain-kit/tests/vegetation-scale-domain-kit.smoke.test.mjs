// Smoke signature: NexusRealtime-scoped-domain-rpg-batch-01::vegetation-scale-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createVegetationScaleDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine } = installKit(createVegetationScaleDomainKit, {});
  assertKitContract(kit);
  const descriptor = engine.vegetationScaleDomain.describe({ id: env.routeId, speciesId: "giant-pine", scale: 10 });
  assert.equal(descriptor.totalHeight > 20, true, `${env.name}: large trees become physically large`);
  assert.equal(descriptor.clearRadius > 4, true, `${env.name}: large trees reserve large footprint`);
}
