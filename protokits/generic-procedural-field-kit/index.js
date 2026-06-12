import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_PROCEDURAL_FIELD_KIT_VERSION = "0.1.0";
export const GENERIC_PROCEDURAL_FIELD_KIT_DEFINITION = Object.freeze({ id: "generic-procedural-field-kit", camelName: "genericProceduralFieldKit", engineKey: "genericProceduralField", category: "procedural-world", tier: "atomic", provides: ["world:field-sampler"], requires: ["random:seeded"], purpose: "Generic sampler surface for procedural height, depth, danger, biome, wind, current, and visibility fields." });
export function createGenericProceduralFieldKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_PROCEDURAL_FIELD_KIT_DEFINITION, config); }
export default createGenericProceduralFieldKit;
