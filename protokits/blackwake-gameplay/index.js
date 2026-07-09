export {
  BLACKWAKE_GAMEPLAY_VERSION,
  createBlackwakeHealthReport,
  createBlackwakePlayableGame
} from "./runtime.js";

export { createBlackwakeState, updateBlackwakeState } from "./simulation.js";
export { createBlackwakeWorld } from "./world.js";
export { createBlackwakeRenderer } from "./renderer.js";
export { createInput } from "./input.js";

import { createBlackwakePlayableGame } from "./runtime.js";
import { createBlackwakeProtoKit } from "../blackwake-kit-registry/index.js";

export function createBlackwakeIslesGame(NexusEngine, options = {}) {
  return createBlackwakePlayableGame(NexusEngine, "blackwake-game-isles", options);
}

export function createStormlineRescueGame(NexusEngine, options = {}) {
  return createBlackwakePlayableGame(NexusEngine, "blackwake-game-stormline-rescue", {
    seed: "stormline-rescue-vertical-slice",
    ...options
  });
}

export function createBlackwakeIslesProtoKit(NexusEngine, options = {}) {
  return createBlackwakeProtoKit(NexusEngine, "blackwake-game-isles", { status: "playable", ...options });
}

export function createStormlineRescueProtoKit(NexusEngine, options = {}) {
  return createBlackwakeProtoKit(NexusEngine, "blackwake-game-stormline-rescue", { status: "playable", ...options });
}
