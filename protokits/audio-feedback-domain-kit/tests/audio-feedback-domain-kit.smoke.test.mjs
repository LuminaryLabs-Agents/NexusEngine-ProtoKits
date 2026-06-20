// Smoke signature: NexusRealtime-scoped-domain-rpg-batch-01::audio-feedback-domain-kit::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { createAudioFeedbackDomainKit } from "../index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  const { kit, engine, tick } = installKit(createAudioFeedbackDomainKit, {});
  assertKitContract(kit);
  engine.audioFeedbackDomain.request("spell-release", { intensity: 0.75, tags: [env.routeId] });
  tick(env.dt);
  const state = engine.audioFeedbackDomain.getState();
  assert.equal(state.lastDescriptor.cue, "spell-release", `${env.name}: emits audio descriptor`);
  assert.equal(state.lastDescriptor.intensity, 0.75, `${env.name}: preserves intensity`);
}
