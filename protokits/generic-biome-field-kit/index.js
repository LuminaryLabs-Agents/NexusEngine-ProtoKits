import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_BIOME_FIELD_KIT_VERSION = "0.1.0";
export const GENERIC_BIOME_FIELD_KIT_DEFINITION = Object.freeze({ id: "generic-biome-field-kit", camelName: "genericBiomeFieldKit", engineKey: "genericBiomeField", category: "procedural-world", tier: "atomic", provides: ["world:biomes", "biome:sampler"], requires: ["world:field-sampler"], purpose: "Generic biome assignment and biome sampling for procedural worlds." });
export function createGenericBiomeFieldKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_BIOME_FIELD_KIT_DEFINITION, config); }
export default createGenericBiomeFieldKit;
