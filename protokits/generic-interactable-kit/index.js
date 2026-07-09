import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_INTERACTABLE_KIT_VERSION = "0.1.0";
export const GENERIC_INTERACTABLE_KIT_DEFINITION = Object.freeze({ id: "generic-interactable-kit", camelName: "genericInteractableKit", engineKey: "genericInteractable", category: "interaction", tier: "atomic", provides: ["interaction:registry", "interaction:focus"], requires: ["spatial:index"], purpose: "Generic interactable registry and focus selection for world objects." });
export function createGenericInteractableKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_INTERACTABLE_KIT_DEFINITION, config); }
export default createGenericInteractableKit;
