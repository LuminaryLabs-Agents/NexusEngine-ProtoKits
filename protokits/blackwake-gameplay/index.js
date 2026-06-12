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

export function createBlackwakeIslesGame(NexusRealtime, options = {}) {
  return createBlackwakePlayableGame(NexusRealtime, "blackwake-game-isles", options);
}

export function createStormlineRescueGame(NexusRealtime, options = {}) {
  return createBlackwakePlayableGame(NexusRealtime, "blackwake-game-stormline-rescue", {
    seed: "stormline-rescue-vertical-slice",
    ...options
  });
}
