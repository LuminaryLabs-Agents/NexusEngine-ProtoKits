import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_INPUT_BUFFER_KIT_VERSION = "0.1.0";
export const GENERIC_INPUT_BUFFER_KIT_DEFINITION = Object.freeze({ id: "generic-input-buffer-kit", camelName: "genericInputBufferKit", engineKey: "genericInputBuffer", category: "input", tier: "atomic", provides: ["input:buffer", "input:pressed", "input:held"], requires: ["input:actions"], purpose: "Buffered pressed/held input state for deterministic frame flushing." });
export function createGenericInputBufferKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_INPUT_BUFFER_KIT_DEFINITION, config); }
export default createGenericInputBufferKit;
