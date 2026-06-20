// Smoke signature: NexusRealtime-scoped-domain-rpg-batch-01::quest-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createQuestDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine } = installKit(createQuestDomainKit, { quests: [{ id: "restore", steps: [{ id: "scan", target: 1 }, { id: "gate", target: 1 }] }] });
  assertKitContract(kit);
  engine.questDomain.advance("restore", 1, { routeId: env.routeId });
  assert.equal(engine.questDomain.getState().questsById.restore.currentStepIndex, 1, `${env.name}: advances quest step`);
  engine.questDomain.advance("restore", 1, { routeId: env.routeId });
  assert.equal(engine.questDomain.getState().questsById.restore.completed, true, `${env.name}: completes quest`);
}
