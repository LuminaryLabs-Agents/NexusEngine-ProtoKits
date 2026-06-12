import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_AVATAR_ON_FOOT_KIT_VERSION = "0.1.0";
export const GENERIC_AVATAR_ON_FOOT_KIT_DEFINITION = Object.freeze({ id: "generic-avatar-on-foot-kit", camelName: "genericAvatarOnFootKit", engineKey: "genericAvatarOnFoot", category: "avatar-player", tier: "atomic", provides: ["avatar:on-foot"], requires: ["input:actions", "avatar:state"], purpose: "Generic on-foot movement and mode slot." });
export function createGenericAvatarOnFootKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_AVATAR_ON_FOOT_KIT_DEFINITION, config); }
export default createGenericAvatarOnFootKit;
