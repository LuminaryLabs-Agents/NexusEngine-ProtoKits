import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_SURFACE_IMPACT_KIT_VERSION = "0.1.0";
export const GENERIC_SURFACE_IMPACT_KIT_DEFINITION = Object.freeze({ id: "generic-surface-impact-kit", camelName: "genericSurfaceImpactKit", engineKey: "genericSurfaceImpact", category: "surface-water", tier: "atomic", provides: ["surface:impact-events"], requires: ["surface:height-sampler", "surface:foam-field"], purpose: "Surface slap, spray, splash, hard landing, and foam injection event slots." });
export function createGenericSurfaceImpactKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_SURFACE_IMPACT_KIT_DEFINITION, config); }
export default createGenericSurfaceImpactKit;
