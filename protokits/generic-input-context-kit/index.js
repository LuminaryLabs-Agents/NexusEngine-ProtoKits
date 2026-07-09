import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_INPUT_CONTEXT_KIT_VERSION = "0.1.0";
export const GENERIC_INPUT_CONTEXT_KIT_DEFINITION = Object.freeze({ id: "generic-input-context-kit", camelName: "genericInputContextKit", engineKey: "genericInputContext", category: "input", tier: "atomic", provides: ["input:context"], requires: ["input:actions"], purpose: "Input context switching for vehicle, swim, dive, map, menu, and dialogue modes." });
export function createGenericInputContextKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_INPUT_CONTEXT_KIT_DEFINITION, config); }
export default createGenericInputContextKit;
