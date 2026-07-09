import assert from "node:assert/strict";

import { createAgentKit, createFakeAgentHarness } from "../protokits/agent-kit/index.js";
import { createModelManifestKit } from "../protokits/model-manifest-kit/index.js";
import { createHuggingFaceLoaderKit } from "../protokits/huggingface-loader-kit/index.js";
import { createModelDownloadCacheKit } from "../protokits/model-download-cache-kit/index.js";
import { createModelLoaderKit } from "../protokits/model-loader-kit/index.js";
import { createTokenizerLoaderKit } from "../protokits/tokenizer-loader-kit/index.js";
import { createOnnxLoaderKit } from "../protokits/onnx-loader-kit/index.js";
import { createEmbeddingMemoryKit } from "../protokits/embedding-memory-kit/index.js";

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
    __nexusClock: { frame: 0, elapsed: 0, delta: 1 / 60 },
    getResource(resource) { return resources.get(resource); },
    setResource(resource, value) { resources.set(resource, value); },
    emit(event, payload) { events.push({ event: event.name, payload }); },
    readEvents(event) { return events.filter((entry) => entry.event === event.name).map((entry) => entry.payload); }
  };
  const engine = {};
  for (const kit of kits) kit.initWorld?.({ world, engine });
  for (const kit of kits) kit.install?.({ world, engine });
  return { engine, world, events };
}

const NexusEngine = createNexusStub();

const manifestKit = createModelManifestKit(NexusEngine, {
  models: [{
    id: "tone-ranker",
    source: "huggingface",
    repo: "luminary/tone-ranker",
    revision: "abc123",
    runtime: "onnx",
    task: "intent-ranking",
    files: ["onnx/model.onnx", "tokenizer.json"],
    expectedInputs: ["input_ids", "attention_mask"],
    expectedOutputs: ["logits"]
  }]
});

const { engine } = install([
  manifestKit,
  createHuggingFaceLoaderKit(NexusEngine),
  createModelDownloadCacheKit(NexusEngine),
  createModelLoaderKit(NexusEngine),
  createTokenizerLoaderKit(NexusEngine),
  createOnnxLoaderKit(NexusEngine, { mockOutputs: { "tone-ranker": { logits: [0.2, 0.8], labels: ["calm", "suspicious"] } } }),
  createEmbeddingMemoryKit(NexusEngine),
  createAgentKit(NexusEngine, {
    agents: [{ id: "guard_01", role: "guard", goals: ["protect-village"] }],
    knownTargets: ["player", "gate_01"],
    allowedIntents: ["observe", "warn", "accuse"],
    harness: createFakeAgentHarness({ decisions: { guard_01: [{ intent: "accuse", targetId: "player", requiredMemory: "player.stole.apple", actions: [{ type: "dialogue.intent", act: "accuse" }] }] } })
  })
]);

assert.equal(engine.modelManifest.get("tone-ranker").runtime, "onnx");
const plan = engine.huggingFaceLoader.createDownloadPlan("tone-ranker");
assert.equal(plan.files.length, 2);
assert.ok(plan.files[0].url.includes("huggingface.co"));

const queued = engine.modelCache.download(plan);
assert.equal(queued.modelId, "tone-ranker");
engine.modelCache.markCached("tone-ranker");
assert.equal(engine.modelCache.hasModel("tone-ranker"), true);

const load = engine.modelLoader.requestLoad("tone-ranker", { autoCache: true });
assert.equal(load.runtime, "onnx");
engine.modelLoader.markReady("tone-ranker");
assert.equal(engine.modelLoader.getLoad("tone-ranker").status, "ready");

const encoded = engine.tokenizers.encode("tone-ranker", "the guard is suspicious", { maxLength: 8 });
assert.equal(encoded.inputIds.length, 8);
const run = engine.onnx.run("tone-ranker", { input_ids: encoded.inputIds, attention_mask: encoded.attentionMask });
assert.deepEqual(run.output.labels, ["calm", "suspicious"]);

engine.embeddingMemory.add("guard_01", "m1", [1, 0, 0], { text: "stolen apple" });
engine.embeddingMemory.add("guard_01", "m2", [0, 1, 0], { text: "quiet gate" });
assert.equal(engine.embeddingMemory.search("guard_01", [0.9, 0.1, 0], { topK: 1 })[0].memoryId, "m1");

engine.agents.remember("guard_01", "player.stole.apple");
const result = engine.agents.requestDecision("guard_01", "saw theft");
assert.equal(result.accepted, true);
assert.equal(result.proposal.validation.ok, true);
assert.equal(engine.agents.getAgent("guard_01").currentIntent.intent, "accuse");

const rejected = engine.agents.submitProposal("guard_01", { intent: "teleport", targetId: "player" });
assert.equal(rejected.accepted, false);
assert.equal(rejected.reason, "intent-not-allowed");

console.log("agent-loader-kits.test.mjs passed");
