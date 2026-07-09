import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CLIMBING_KIT_VERSION = "0.1.0";
export const GENERIC_CLIMBING_KIT_DEFINITION = Object.freeze({ id: "generic-climbing-kit", camelName: "genericClimbingKit", engineKey: "genericClimbing", category: "avatar-player", tier: "atomic", provides: ["avatar:climbing"], requires: ["avatar:state", "interaction:registry"], purpose: "Generic climbing and edge/ladder/rail traversal slot." });
export function createGenericClimbingKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_CLIMBING_KIT_DEFINITION, config); }
export default createGenericClimbingKit;
