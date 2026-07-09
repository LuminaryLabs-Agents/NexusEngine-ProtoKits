import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_FAIL_STATE_KIT_VERSION = "0.1.0";
export const GENERIC_FAIL_STATE_KIT_DEFINITION = Object.freeze({ id: "generic-fail-state-kit", camelName: "genericFailStateKit", engineKey: "genericFailState", category: "mission-sequence", tier: "atomic", provides: ["mission:fail-state"], requires: ["mission:phase"], purpose: "Generic failure state for vehicle destruction, oxygen loss, timeout, cargo loss, and player stranded conditions." });
export function createGenericFailStateKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_FAIL_STATE_KIT_DEFINITION, config); }
export default createGenericFailStateKit;
