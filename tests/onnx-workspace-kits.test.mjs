import assert from "node:assert/strict";

import {
  createOnnxWorkspaceKits,
  createChatIoDomainKit,
  createSelfTalkLoopDomainKit,
  createModelOutputDecoderDomainKit,
  createConversationBubbleDomainKit,
  createInferenceTraceDomainKit,
  createWorkspaceEntityDomainKit,
  createWorkspaceLayoutDomainKit,
  createModelCoreVisualDomainKit,
  createAgentAvatarDomainKit,
  createThreeRenderAdapterKit
} from "../protokits/onnx-workspace-kits/index.js";

function createNexusStub() {
  return {
    defineResource(name) { return { kind: "resource", name }; },
    defineEvent(name) { return { kind: "event", name }; },
    defineRuntimeKit(definition) { return definition; }
  };
}

function install(kits) {
  const resources = new Map();
  const events = [];
  const world = {
    __nexusClock: { frame: 1, elapsed: 0, delta: 1 / 60 },
    getResource(resource) { return resources.get(resource); },
    setResource(resource, value) { resources.set(resource, value); },
    emit(event, payload) { events.push({ event: event.name, payload }); },
    readEvents(event) { return events.filter((entry) => entry.event === event.name).map((entry) => entry.payload); }
  };
  const engine = {
    agents: {
      getAgent(agentId) { return { id: agentId, label: "Guide", role: "assistant" }; }
    },
    modelManifest: {
      get(modelId) { return { id: modelId, label: "Qwen 0.5B", runtime: "onnx", task: "text-generation" }; }
    },
    modelLoader: {
      getLoad(modelId) { return { modelId, status: "ready" }; }
    },
    onnx: {
      getSessionState(modelId) { return { modelId, status: "loaded" }; }
    }
  };
  for (const kit of kits) kit.initWorld?.({ world, engine });
  for (const kit of kits) kit.install?.({ world, engine });
  return { engine, world, events };
}

const NexusEngine = createNexusStub();
const kits = createOnnxWorkspaceKits(NexusEngine, {
  selfTalkLoop: { defaultAgentId: "guide", defaultModelId: "onnx-community/Qwen2.5-0.5B-Instruct", maxTurns: 4 },
  promptComposer: { defaultAgentId: "guide", defaultModelId: "onnx-community/Qwen2.5-0.5B-Instruct" }
});

assert.ok(kits.some((kit) => kit.id === "chat-io-domain-kit"));
assert.equal(createChatIoDomainKit(NexusEngine).id, "chat-io-domain-kit");
assert.equal(createSelfTalkLoopDomainKit(NexusEngine).id, "self-talk-loop-domain-kit");
assert.equal(createModelOutputDecoderDomainKit(NexusEngine).id, "model-output-decoder-domain-kit");
assert.equal(createConversationBubbleDomainKit(NexusEngine).id, "conversation-bubble-domain-kit");
assert.equal(createInferenceTraceDomainKit(NexusEngine).id, "inference-trace-domain-kit");
assert.equal(createWorkspaceEntityDomainKit(NexusEngine).id, "workspace-entity-domain-kit");
assert.equal(createWorkspaceLayoutDomainKit(NexusEngine).id, "workspace-layout-domain-kit");
assert.equal(createModelCoreVisualDomainKit(NexusEngine).id, "model-core-visual-domain-kit");
assert.equal(createAgentAvatarDomainKit(NexusEngine).id, "agent-avatar-domain-kit");
assert.equal(createThreeRenderAdapterKit(NexusEngine).id, "three-render-adapter-kit");

const { engine } = install(kits);

engine.workspaceEntities.register({ id: "onnx-core", type: "model-core", label: "ONNX Core", position: { x: 0, y: 1, z: 0 }, affordances: ["inspect", "run"] });
engine.workspaceLayout.setAnchor({ id: "core-anchor", position: { x: 0, y: 2, z: 0 } });
engine.workspaceLayout.place("onnx-core", "core-anchor");
assert.equal(engine.workspaceEntities.get("onnx-core").transform.position.y, 2);

const core = engine.modelCoreVisual.registerCore("onnx-community/Qwen2.5-0.5B-Instruct");
assert.equal(core.status, "loaded");
engine.modelCoreVisual.pulse("onnx-community/Qwen2.5-0.5B-Instruct", "run");

const avatar = engine.agentAvatars.register("guide", { position: { x: -2, y: 1, z: 0 } });
assert.equal(avatar.pose, "idle");
engine.agentAvatars.setPose("guide", "thinking");
assert.equal(engine.agentAvatars.getState().avatars.guide.pose, "thinking");

const loop = engine.selfTalkLoop.start({ inputText: "Explain the ONNX workspace.", agentId: "guide" });
assert.equal(loop.status, "running");

let afterObserve = engine.selfTalkLoop.runStep(loop.id, {
  output: JSON.stringify({ phase: "observe", message: "I see a request to explain the workspace.", done: false, next_phase: "think", confidence: 0.6 })
});
assert.equal(afterObserve.currentPhase, "think");
assert.equal(engine.conversationBubbles.getState().order.length, 1);

let done = engine.selfTalkLoop.runStep(loop.id, {
  output: JSON.stringify({ phase: "reply", message: "Final: every object has input, inference, output, and trace.", done: true, confidence: 0.95 })
});
assert.equal(done.status, "done");
assert.match(done.finalReply, /every object/i);

const trace = engine.inferenceTrace.getTrace(done.traceId);
assert.equal(trace.status, "complete");
assert.equal(trace.steps.length, 2);

const plan = engine.threeRenderAdapter.createPlan();
assert.equal(plan.backend, "three");
assert.ok(plan.descriptors.bubbles.length >= 2);
assert.ok(plan.descriptors.modelCores.length >= 1);
assert.ok(plan.descriptors.avatars.length >= 1);

console.log("onnx-workspace-kits.test.mjs passed");
