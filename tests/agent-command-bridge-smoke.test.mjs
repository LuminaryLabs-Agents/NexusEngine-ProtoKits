import { assert, createMockNexusEngine, createSmokeWorld } from "./aaa-domain-spine-smoke-harness.mjs";
import { createAgentPolicyValidationKit } from "../protokits/agent-policy-validation-kit/index.js";
import { createAgentCommandBridgeKit } from "../protokits/agent-command-bridge-kit/index.js";

const NexusEngine = createMockNexusEngine();
const world = createSmokeWorld();
const engine = {};
const policyKit = createAgentPolicyValidationKit(NexusEngine, { allowedIntents: ["open"], allowedActionTypes: ["command"], knownTargets: ["gate"] });
const bridgeKit = createAgentCommandBridgeKit(NexusEngine, { routes: [{ intent: "open", commandType: "gate.open.request" }] });

for (const kit of [policyKit, bridgeKit]) kit.initWorld?.({ world, engine });
for (const kit of [policyKit, bridgeKit]) kit.install?.({ world, engine });

const proposal = { id: "proposal-1", agentId: "guide", intent: "open", targetId: "gate", confidence: 1, actions: [{ type: "command", targetId: "gate" }] };
const preview = engine.agentCommandBridge.preview(proposal);
assert.equal(preview.accepted, true, "accepted policy proposal previews command");
assert.equal(preview.preview.command.type, "gate.open.request", "route maps intent to command type");

const commit = engine.agentCommandBridge.commit(proposal.id);
assert.equal(commit.accepted, true, "previewed command commits");
assert.equal(world.getEvents(bridgeKit.events.CommandCommitted).length, 1, "commit emits trace event");

const rejected = engine.agentCommandBridge.preview({ id: "bad", agentId: "guide", intent: "close", targetId: "gate" });
assert.equal(rejected.accepted, false, "unknown intent is rejected");
