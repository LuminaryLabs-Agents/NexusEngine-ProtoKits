// Smoke signature: NexusEngine-AAA-domain-spine-batch-01::timed-pressure-domain-kit::2026-06-20
import {
  assert,
  FIVE_SMOKE_ENVIRONMENTS,
  assertKitContract,
  installKit
} from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createTimedPressureDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine, tick } = installKit(createTimedPressureDomainKit, { duration: 0.5 });

  assertKitContract(kit);

  engine.timedPressureDomain.extend(0.25);
  tick(1);

  assert.equal(engine.timedPressureDomain.getState().expired, true, `${env.name}: timer expires deterministically`);
}
