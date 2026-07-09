// Smoke signature: NexusEngine-AAA-domain-spine-batch-01::objective-flow-domain-kit::2026-06-20
import {
  assert,
  FIVE_SMOKE_ENVIRONMENTS,
  assertKitContract,
  installKit
} from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createObjectiveFlowDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine } = installKit(createObjectiveFlowDomainKit, {
    steps: [{ id: "one", target: 1 }, { id: "two", target: 1 }]
  });

  assertKitContract(kit);

  engine.objectiveFlowDomain.advance(1, { routeId: env.routeId });
  assert.equal(engine.objectiveFlowDomain.getState().currentStepIndex, 1, `${env.name}: advances to second step`);

  engine.objectiveFlowDomain.advance(1, { routeId: env.routeId });
  assert.equal(engine.objectiveFlowDomain.getState().completed, true, `${env.name}: completes objective flow`);
}
