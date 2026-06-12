import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CURRENT_FIELD_KIT_VERSION = "0.1.0";
export const GENERIC_CURRENT_FIELD_KIT_DEFINITION = Object.freeze({ id: "generic-current-field-kit", camelName: "genericCurrentFieldKit", engineKey: "genericCurrentField", category: "surface-water", tier: "atomic", provides: ["surface:current-field"], requires: ["surface:velocity-sampler"], purpose: "Generic current and flow vectors for vehicles, swimmers, floating objects, particles, and AI navigation." });
export function createGenericCurrentFieldKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_CURRENT_FIELD_KIT_DEFINITION, config); }
export default createGenericCurrentFieldKit;
