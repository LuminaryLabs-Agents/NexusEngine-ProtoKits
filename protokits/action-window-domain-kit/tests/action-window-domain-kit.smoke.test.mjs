// Smoke signature: NexusEngine-AAA-domain-spine-batch-01::action-window-domain-kit::2026-06-20
import {
  assert,
  FIVE_SMOKE_ENVIRONMENTS,
  assertKitContract,
  installKit
} from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createActionWindowDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine, tick } = installKit(createActionWindowDomainKit, {
    windows: [{ id: "beat", opensAt: 0, closesAt: 2 }]
  });

  assertKitContract(kit);

  engine.actionWindowDomain.attempt("beat", { routeId: env.routeId, action: "pulse" });
  tick(env.dt);

  const state = engine.actionWindowDomain.getState();
  assert.equal(state.windowsById.beat.completed, true, `${env.name}: completes open timing window`);

  engine.actionWindowDomain.attempt("missing", { routeId: env.routeId });
  tick(env.dt);

  assert.equal(engine.actionWindowDomain.getState().lastResult.reason, "missing-window", `${env.name}: rejects missing window`);
}
