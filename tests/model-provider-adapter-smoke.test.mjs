import { assert, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import { createModelProviderAdapterKit } from "../protokits/model-provider-adapter-kit/index.js";

const { engine, world, kit } = installKit(createModelProviderAdapterKit, {
  providers: [{ id: "fake", mode: "manual", modelIds: ["tiny"] }],
  defaultProviderId: "fake"
});

const request = engine.modelProvider.request({ agentId: "guide", modelId: "tiny", prompt: "choose" });
assert.equal(request.status, "pending", "request is queued");
assert.equal(engine.modelProvider.getPendingRequests().length, 1, "pending request is visible");

const response = engine.modelProvider.submitResponse(request.id, { text: "observe" });
assert.equal(response.requestId, request.id, "response links to request");
assert.equal(engine.modelProvider.getPendingRequests().length, 0, "response clears pending request");
assert.equal(world.getEvents(kit.events.ResponseSubmitted).length, 1, "response emits event");

const failed = engine.modelProvider.request({ id: "will-fail", prompt: "bad" });
const failure = engine.modelProvider.failRequest(failed.id, "fixture-failure");
assert.equal(failure.reason, "fixture-failure", "failure reason is stable");
