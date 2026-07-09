import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_DOCKING_ANCHOR_KIT_VERSION = "0.1.0";
export const GENERIC_DOCKING_ANCHOR_KIT_DEFINITION = Object.freeze({ id: "generic-docking-anchor-kit", camelName: "genericDockingAnchorKit", engineKey: "genericDockingAnchor", category: "vehicle-watercraft", tier: "atomic", provides: ["vehicle:docking", "vehicle:anchor"], requires: ["vehicle:body-state"], purpose: "Generic anchor, docking, mooring, and stop-near-target vehicle slots." });
export function createGenericDockingAnchorKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_DOCKING_ANCHOR_KIT_DEFINITION, config); }
export default createGenericDockingAnchorKit;
