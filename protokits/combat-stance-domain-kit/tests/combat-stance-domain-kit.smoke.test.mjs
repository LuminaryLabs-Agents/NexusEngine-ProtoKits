// Smoke signature: NexusRealtime-scoped-domain-rpg-batch-01::combat-stance-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createCombatStanceDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine, tick } = installKit(createCombatStanceDomainKit, { actorId: env.routeId });
  assertKitContract(kit);
  engine.combatStanceDomain.request("neutral");
  tick(env.dt);
  engine.combatStanceDomain.request("guard");
  tick(env.dt);
  assert.equal(engine.combatStanceDomain.getState().stance, "guard", `${env.name}: enters guard stance`);
  engine.combatStanceDomain.request("combo");
  tick(env.dt);
  assert.equal(engine.combatStanceDomain.getState().lastRejection.reason, "illegal-stance-transition", `${env.name}: rejects illegal transition`);
}
