import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_WORLD_THREE_KIT_VERSION = "0.1.0";
export const GENERIC_WORLD_THREE_KIT_DEFINITION = Object.freeze({ id: "generic-world-three-kit", camelName: "genericWorldThreeKit", engineKey: "genericWorldThree", category: "renderer", tier: "atomic", provides: ["render:three-world"], requires: ["render:three", "world:sectors", "poi:placement"], purpose: "Generic Three.js procedural world and POI rendering slot." });
export function createGenericWorldThreeKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_WORLD_THREE_KIT_DEFINITION, config); }
export default createGenericWorldThreeKit;
