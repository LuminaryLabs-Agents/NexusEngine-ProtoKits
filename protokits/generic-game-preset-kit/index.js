import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_GAME_PRESET_KIT_VERSION = "0.1.0";
export const GENERIC_GAME_PRESET_KIT_DEFINITION = Object.freeze({ id: "generic-game-preset-kit", camelName: "genericGamePresetKit", engineKey: "genericGamePreset", category: "preset-game", tier: "preset", provides: ["game:preset"], requires: [], purpose: "Generic preset resource for configuring reusable kits without forking them." });
export function createGenericGamePresetKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_GAME_PRESET_KIT_DEFINITION, config); }
export default createGenericGamePresetKit;
