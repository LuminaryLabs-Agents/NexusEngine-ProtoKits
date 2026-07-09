// Smoke signature: NexusEngine-scoped-domain-rpg-batch-01::terrain-height-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createTerrainHeightDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine } = installKit(createTerrainHeightDomainKit, {
    heightAt: (x, z) => x * 0.5 + z * 0.25
  });

  assertKitContract(kit);
  assert.equal(engine.terrainHeightDomain.heightAt(4, 8), 4, `${env.name}: samples terrain height`);
  assert.equal(engine.terrainHeightDomain.getState().sampleCount, 1, `${env.name}: records sample count`);
}
