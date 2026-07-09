import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_MODE_STORM_NAVIGATION_VERSION = "0.1.0";
export const GENERIC_MODE_STORM_NAVIGATION_DEFINITION = Object.freeze({ id: "generic-mode-storm-navigation", camelName: "genericModeStormNavigation", engineKey: "genericModeStormNavigation", category: "mode", tier: "mode", provides: ["mode:storm-navigation"], requires: ["surface:wave-spectrum", "watercraft:physics", "camera:comfort", "render:three-effects"], purpose: "Higher-order mode for storm navigation, surface/weather coupling, visibility pressure, and camera/renderer intensity." });
export function createGenericModeStormNavigation(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_MODE_STORM_NAVIGATION_DEFINITION, config); }
export default createGenericModeStormNavigation;
