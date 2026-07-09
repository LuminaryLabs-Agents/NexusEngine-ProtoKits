import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_FOAM_FIELD_KIT_VERSION = "0.1.0";
export const GENERIC_FOAM_FIELD_KIT_DEFINITION = Object.freeze({ id: "generic-foam-field-kit", camelName: "genericFoamFieldKit", engineKey: "genericFoamField", category: "surface-water", tier: "atomic", provides: ["surface:foam-field"], requires: ["surface:wave-spectrum"], purpose: "Generic whitewater and foam field from crests, hazards, wake, collisions, storms, and shores." });
export function createGenericFoamFieldKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_FOAM_FIELD_KIT_DEFINITION, config); }
export default createGenericFoamFieldKit;
