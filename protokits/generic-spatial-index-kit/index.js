import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_SPATIAL_INDEX_KIT_VERSION = "0.1.0";
export const GENERIC_SPATIAL_INDEX_KIT_DEFINITION = Object.freeze({ id: "generic-spatial-index-kit", camelName: "genericSpatialIndexKit", engineKey: "genericSpatialIndex", category: "foundation", tier: "atomic", provides: ["spatial:index", "spatial:query-radius", "spatial:nearest"], requires: [], purpose: "Spatial indexing slots for nearest and radius queries." });
export function createGenericSpatialIndexKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_SPATIAL_INDEX_KIT_DEFINITION, config); }
export default createGenericSpatialIndexKit;
