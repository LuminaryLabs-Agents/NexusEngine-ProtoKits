import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const BLACKWAKE_PRESET_KIT_VERSION = "0.1.0";
export const BLACKWAKE_PRESET_KIT_DEFINITION = Object.freeze({ id: "blackwake-preset-kit", camelName: "blackwakePresetKit", engineKey: "blackwakePreset", category: "preset-game", tier: "preset", provides: ["preset:blackwake", "game:preset:blackwake"], requires: ["game:preset"], purpose: "Blackwake Isles preset values for archipelago biome, pirate naming, sloop handling, wreck salvage, port markets, and Three.js visual style." });
export function createBlackwakePresetKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, BLACKWAKE_PRESET_KIT_DEFINITION, config); }
export default createBlackwakePresetKit;
