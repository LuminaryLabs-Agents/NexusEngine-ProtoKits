import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_SURFACE_FIELD_KIT_VERSION = "0.1.0";
export const GENERIC_SURFACE_FIELD_KIT_DEFINITION = Object.freeze({ id: "generic-surface-field-kit", camelName: "genericSurfaceFieldKit", engineKey: "genericSurfaceField", category: "surface-water", tier: "atomic", provides: ["surface:height-sampler", "surface:normal-sampler", "surface:velocity-sampler", "surface:material-sampler"], requires: ["random:seeded"], purpose: "Generic sampled surface API for oceans, lakes, rivers, lava, cloud seas, and other dynamic surfaces." });
export function createGenericSurfaceFieldKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_SURFACE_FIELD_KIT_DEFINITION, config); }
export default createGenericSurfaceFieldKit;
