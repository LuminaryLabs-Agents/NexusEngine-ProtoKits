import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_INPUT_ACTIONS_KIT_VERSION = "0.1.0";
export const GENERIC_INPUT_ACTIONS_KIT_DEFINITION = Object.freeze({ id: "generic-input-actions-kit", camelName: "genericInputActionsKit", engineKey: "genericInputActions", category: "input", tier: "atomic", provides: ["input:actions"], requires: ["input:keyboard"], purpose: "Semantic input action mapping for movement, interaction, camera, and tools." });
export function createGenericInputActionsKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_INPUT_ACTIONS_KIT_DEFINITION, config); }
export default createGenericInputActionsKit;
