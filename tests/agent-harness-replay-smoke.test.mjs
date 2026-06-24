import { assert } from "./aaa-domain-spine-smoke-harness.mjs";
import { createReplayAgentHarness } from "../protokits/agent-kit/index.js";

const harness = createReplayAgentHarness({ recording: [{ proposal: { agentId: "guide", intent: "observe" } }] });
const first = harness.decide({ context: { agentId: "guide" } });
const second = harness.decide({ context: { agentId: "guide" } });

assert.equal(first.intent, "observe", "replay harness returns expected intent");
assert.equal(second.intent, "observe", "replay harness repeats final proposal");
