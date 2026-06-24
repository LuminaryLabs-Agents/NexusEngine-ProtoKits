import { assert, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import { createAgentKit } from "../protokits/agent-kit/index.js";

const { kit, engine, world } = installKit(createAgentKit, {
  agents: [{ id: "guide", goals: ["help-player"] }],
  allowedIntents: ["warn", "observe"],
  knownTargets: ["player"],
  fakeHarness: {
    decisions: {
      guide: [{ intent: "warn", targetId: "player", confidence: 0.9, actions: [{ type: "say", text: "Careful." }] }]
    }
  }
});

assert.equal(kit.id, "agent-kit", "agent kit installs with canonical id");
const result = engine.agents.requestDecision("guide", "market-check");
assert.equal(result.accepted, true, "fake harness proposal is accepted");
assert.equal(result.proposal.validation.ok, true, "proposal validation passes");
assert.equal(engine.agents.getAgent("guide").currentIntent.intent, "warn", "current intent is committed on agent state");
assert.equal(world.getEvents(kit.events.AgentProposalAccepted).length, 1, "accepted proposal emits event");

const rejected = engine.agents.submitProposal("guide", { intent: "dance", targetId: "player", actions: [{ type: "say" }] });
assert.equal(rejected.accepted, false, "intent outside allow-list is rejected");
assert.equal(rejected.reason, "intent-not-allowed", "rejection reason is stable");
