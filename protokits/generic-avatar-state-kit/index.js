import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_AVATAR_STATE_KIT_VERSION = "0.1.0";
export const GENERIC_AVATAR_STATE_KIT_DEFINITION = Object.freeze({ id: "generic-avatar-state-kit", camelName: "genericAvatarStateKit", engineKey: "genericAvatarState", category: "avatar-player", tier: "atomic", provides: ["avatar:state", "avatar:mode"], requires: [], purpose: "Generic avatar state and mode resource for on-foot, vehicle, swimming, diving, climbing, interaction, and map states." });
export function createGenericAvatarStateKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_AVATAR_STATE_KIT_DEFINITION, config); }
export default createGenericAvatarStateKit;
