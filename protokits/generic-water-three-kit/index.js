import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_WATER_THREE_KIT_VERSION = "0.1.0";
export const GENERIC_WATER_THREE_KIT_DEFINITION = Object.freeze({ id: "generic-water-three-kit", camelName: "genericWaterThreeKit", engineKey: "genericWaterThree", category: "renderer", tier: "atomic", provides: ["render:three-water"], requires: ["render:three", "surface:height-sampler", "surface:foam-field"], purpose: "Generic Three.js water rendering slot driven by surface height and foam fields." });
export function createGenericWaterThreeKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_WATER_THREE_KIT_DEFINITION, config); }
export default createGenericWaterThreeKit;
