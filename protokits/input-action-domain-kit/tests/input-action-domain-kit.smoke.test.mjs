// Smoke signature: NexusRealtime-AAA-domain-spine-batch-01::input-action-domain-kit::2026-06-20
import {
  assert,
  FIVE_SMOKE_ENVIRONMENTS,
  assertKitContract,
  installKit
} from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createInputActionDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine, tick } = installKit(createInputActionDomainKit, {
    routeId: env.routeId,
    allowedActions: ["move", "jump", "interact", "vent"]
  });

  assertKitContract(kit);

  engine.inputActionDomain.request("interact", { routeId: env.routeId });
  tick(env.dt);

  const state = engine.inputActionDomain.getState();
  assert.equal(state.accepted.length, 1, `${env.name}: accepts valid action`);

  engine.inputActionDomain.request("forbidden", { routeId: env.routeId });
  tick(env.dt);

  assert.equal(
    engine.inputActionDomain.getState().lastRejectionReason,
    "action-not-allowed",
    `${env.name}: rejects invalid action`
  );
}
