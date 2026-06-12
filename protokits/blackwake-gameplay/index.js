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

export function createBlackwakeIslesGame(NexusRealtime, options = {}) {
  return createBlackwakePlayableGame(NexusRealtime, "blackwake-game-isles", options);
}

export function createStormlineRescueGame(NexusRealtime, options = {}) {
  return createBlackwakePlayableGame(NexusRealtime, "blackwake-game-stormline-rescue", {
    seed: "stormline-rescue-vertical-slice",
    ...options
  });
}

export function createBlackwakeIslesProtoKit(NexusRealtime, options = {}) {
  return createBlackwakeProtoKit(NexusRealtime, "blackwake-game-isles", { status: "playable", ...options });
}

export function createStormlineRescueProtoKit(NexusRealtime, options = {}) {
  return createBlackwakeProtoKit(NexusRealtime, "blackwake-game-stormline-rescue", { status: "playable", ...options });
}
