import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_MODE_SWIM_DIVE_RECOVERY_VERSION = "0.1.0";
export const GENERIC_MODE_SWIM_DIVE_RECOVERY_DEFINITION = Object.freeze({ id: "generic-mode-swim-dive-recovery", camelName: "genericModeSwimDiveRecovery", engineKey: "genericModeSwimDiveRecovery", category: "mode", tier: "mode", provides: ["mode:swim-dive-recovery"], requires: ["avatar:state", "avatar:swimming", "avatar:diving", "avatar:oxygen", "interaction:recovery", "cargo:transfer", "render:three-water"], purpose: "Higher-order mode for swimming, diving, oxygen, recovery sites, and cargo carry-back." });
export function createGenericModeSwimDiveRecovery(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_MODE_SWIM_DIVE_RECOVERY_DEFINITION, config); }
export default createGenericModeSwimDiveRecovery;
