import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_MODE_WATERCRAFT_EXPLORATION_VERSION = "0.1.0";
export const GENERIC_MODE_WATERCRAFT_EXPLORATION_DEFINITION = Object.freeze({ id: "generic-mode-watercraft-exploration", camelName: "genericModeWatercraftExploration", engineKey: "genericModeWatercraftExploration", category: "mode", tier: "mode", provides: ["mode:watercraft-exploration"], requires: ["seed:world", "input:actions", "surface:height-sampler", "surface:current-field", "watercraft:physics", "camera:modes", "render:three", "ui:hud", "poi:placement"], purpose: "Higher-order mode for generic watercraft exploration over procedural surfaces." });
export function createGenericModeWatercraftExploration(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_MODE_WATERCRAFT_EXPLORATION_DEFINITION, config); }
export default createGenericModeWatercraftExploration;
