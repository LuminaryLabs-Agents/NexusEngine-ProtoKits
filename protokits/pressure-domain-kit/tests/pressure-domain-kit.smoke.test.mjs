// Smoke signature: NexusRealtime-AAA-domain-spine-batch-01::pressure-domain-kit::2026-06-20
import {
  assert,
  FIVE_SMOKE_ENVIRONMENTS,
  assertKitContract,
  installKit
} from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createPressureDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine, tick } = installKit(createPressureDomainKit, {
    channels: [{ id: "heat", value: 0, max: 10, warningAt: 5, failAt: 9, risePerSecond: 10 }]
  });

  assertKitContract(kit);

  tick(env.dt || 1);
  engine.pressureDomain.adjust("heat", 10, "smoke");

  const state = engine.pressureDomain.getState();
  assert.equal(state.channelsById.heat.status, "failed", `${env.name}: pressure reaches failure threshold`);
}
