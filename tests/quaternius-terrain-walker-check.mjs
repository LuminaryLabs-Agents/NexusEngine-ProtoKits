import {
  QUATERNIUS_TERRAIN_WALKER_KIT_GRAPH,
  createQuaterniusTerrainWalkerState,
  stepQuaterniusTerrainWalker,
  validateQuaterniusTerrainWalkerState,
  createQuaterniusTerrainWalkerKitSuite
} from "../protokits/quaternius-terrain-walker-kit/index.js";

function must(condition, message) {
  if (!condition) throw new Error(message);
}

must(QUATERNIUS_TERRAIN_WALKER_KIT_GRAPH.length >= 39, "expected full Quaternius terrain walker kit graph");

const state = createQuaterniusTerrainWalkerState();
state.manifests.sources.push({ id: "quaternius-universal-animation-library", kind: "quaternius-pack", license: "CC0" });
state.animation.available.idle = { id: "idle", semantic: "idle" };
state.animation.available.walk = { id: "walk", semantic: "walk" };
state.animation.available.run = { id: "run", semantic: "run" };

const moved = stepQuaterniusTerrainWalker(state, { moveZ: 1, sprint: true }, 1 / 10);
must(moved.actor.position.z > state.actor.position.z, "actor should move forward");
must(moved.actor.grounded === true, "actor should remain grounded");
must(moved.actor.locomotion === "run", "actor should select run locomotion");
must(validateQuaterniusTerrainWalkerState(moved).ok === true, "state should validate after source and clips are present");
JSON.stringify(moved);

const suite = createQuaterniusTerrainWalkerKitSuite({}, {});
must(suite.some((kit) => kit.id === "terrain-sampler-kit"), "suite should compose existing terrain sampler kit");
must(suite.some((kit) => kit.id === "quaternius-terrain-walker-kit"), "suite should include composite walker kit");

console.log("quaternius terrain walker check passed");
