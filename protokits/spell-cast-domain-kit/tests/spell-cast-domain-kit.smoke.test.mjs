// Smoke signature: NexusRealtime-scoped-domain-rpg-batch-01::spell-cast-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createSpellCastDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine, tick } = installKit(createSpellCastDomainKit, { mana: 20, maxMana: 20 });
  assertKitContract(kit);
  engine.spellCastDomain.cast("arc-bolt", { cost: 5, actorId: env.routeId });
  tick(env.dt);
  assert.equal(engine.spellCastDomain.getState().lastCast.spellId, "arc-bolt", `${env.name}: releases valid spell`);
  engine.spellCastDomain.cast("nova", { cost: 999 });
  tick(env.dt);
  assert.equal(engine.spellCastDomain.getState().lastRejection.reason, "not-enough-mana", `${env.name}: rejects expensive spell`);
}
