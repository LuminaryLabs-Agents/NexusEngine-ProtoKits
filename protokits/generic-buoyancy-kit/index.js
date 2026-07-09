import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_BUOYANCY_KIT_VERSION = "0.1.0";
export const GENERIC_BUOYANCY_KIT_DEFINITION = Object.freeze({ id: "generic-buoyancy-kit", camelName: "genericBuoyancyKit", engineKey: "genericBuoyancy", category: "surface-water", tier: "atomic", provides: ["physics:buoyancy"], requires: ["surface:height-sampler", "surface:normal-sampler"], purpose: "Generic buoyancy slot for boats, crates, players, debris, buoys, and wildlife." });
export function createGenericBuoyancyKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_BUOYANCY_KIT_DEFINITION, config); }
export default createGenericBuoyancyKit;
