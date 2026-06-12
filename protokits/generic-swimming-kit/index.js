import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_SWIMMING_KIT_VERSION = "0.1.0";
export const GENERIC_SWIMMING_KIT_DEFINITION = Object.freeze({ id: "generic-swimming-kit", camelName: "genericSwimmingKit", engineKey: "genericSwimming", category: "avatar-player", tier: "atomic", provides: ["avatar:swimming"], requires: ["surface:height-sampler", "surface:current-field", "avatar:state", "input:actions"], purpose: "Generic surface swimming mode, waterline movement, current drift, and swim action slot." });
export function createGenericSwimmingKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_SWIMMING_KIT_DEFINITION, config); }
export default createGenericSwimmingKit;
