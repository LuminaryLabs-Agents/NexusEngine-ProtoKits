import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_POI_PLACEMENT_KIT_VERSION = "0.1.0";
export const GENERIC_POI_PLACEMENT_KIT_DEFINITION = Object.freeze({ id: "generic-poi-placement-kit", camelName: "genericPoiPlacementKit", engineKey: "genericPoiPlacement", category: "procedural-world", tier: "atomic", provides: ["poi:placement", "poi:registry"], requires: ["world:sectors", "random:seeded"], purpose: "Generic point-of-interest placement for settlements, recovery sites, hazards, landmarks, resources, encounters, and route markers." });
export function createGenericPoiPlacementKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_POI_PLACEMENT_KIT_DEFINITION, config); }
export default createGenericPoiPlacementKit;
