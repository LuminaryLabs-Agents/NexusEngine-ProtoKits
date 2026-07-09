import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_DIVING_KIT_VERSION = "0.1.0";
export const GENERIC_DIVING_KIT_DEFINITION = Object.freeze({ id: "generic-diving-kit", camelName: "genericDivingKit", engineKey: "genericDiving", category: "avatar-player", tier: "atomic", provides: ["avatar:diving", "avatar:oxygen"], requires: ["avatar:swimming", "surface:height-sampler"], purpose: "Generic diving, depth, oxygen, underwater movement, and surface transition slot." });
export function createGenericDivingKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_DIVING_KIT_DEFINITION, config); }
export default createGenericDivingKit;
