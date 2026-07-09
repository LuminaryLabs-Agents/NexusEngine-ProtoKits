import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_EFFECTS_THREE_KIT_VERSION = "0.1.0";
export const GENERIC_EFFECTS_THREE_KIT_DEFINITION = Object.freeze({ id: "generic-effects-three-kit", camelName: "genericEffectsThreeKit", engineKey: "genericEffectsThree", category: "renderer", tier: "atomic", provides: ["render:three-effects"], requires: ["render:three"], purpose: "Generic Three.js effects for wake rings, foam particles, bubbles, lightning, and beacon glows." });
export function createGenericEffectsThreeKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_EFFECTS_THREE_KIT_DEFINITION, config); }
export default createGenericEffectsThreeKit;
