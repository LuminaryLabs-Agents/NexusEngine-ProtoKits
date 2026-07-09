import assert from "node:assert/strict";
import { createMiniNexusRuntime } from "../../../tests/helpers/mini-nexus-runtime.mjs";
import { createActionInputKit } from "../index.js";

const NexusEngine = createMiniNexusRuntime();
const engine = NexusEngine.createRealtimeGame({
  kits: [createActionInputKit(NexusEngine, { context: "test" })]
});

engine.actionInput.key("a", true);
engine.tick(1 / 60);
let state = engine.actionInput.getState();
assert.equal(state.held.left, true);
assert.equal(state.axis.x, -1);
assert.equal(state.edges[0].action, "left");

engine.actionInput.key("d", true);
engine.tick(1 / 60);
state = engine.actionInput.getState();
assert.equal(state.held.right, true);
assert.equal(state.axis.x, 0);

engine.actionInput.key("a", false);
engine.tick(1 / 60);
state = engine.actionInput.getState();
assert.equal(state.held.left, false);
assert.equal(state.axis.x, 1);

engine.actionInput.aim(10, 0);
engine.tick(1 / 60);
state = engine.actionInput.getState();
assert.equal(Math.round(state.aim.x), 1);
assert.equal(Math.round(state.aim.y), 0);

engine.actionInput.clear({ source: "test" });
engine.tick(1 / 60);
state = engine.actionInput.getState();
assert.equal(state.axis.x, 0);
assert.equal(state.held.right, false);

console.log("action-input-kit tests passed");
