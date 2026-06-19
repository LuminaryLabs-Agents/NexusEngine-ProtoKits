// Smoke signature: NexusRealtime-AAA-domain-spine-batch-01::scenario-smoke-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createScenarioSmokeDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { engine, tick } = installKit(createScenarioSmokeDomainKit, {
    routeId: env.routeId,
    smokeActions: ["alpha", "beta"]
  });

  engine.scenarioSmokeDomain.run("alpha");
  engine.scenarioSmokeDomain.run("beta");
  tick(env.dt);

  const state = engine.scenarioSmokeDomain.getState();
  assert.equal(state.completed, true, `${env.name}: completed route check`);
  assert.equal(state.signature, "NexusRealtime-AAA-domain-spine-batch-01", `${env.name}: signed`);
}
