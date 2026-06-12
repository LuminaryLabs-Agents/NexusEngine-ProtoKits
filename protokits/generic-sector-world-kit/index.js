import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_SECTOR_WORLD_KIT_VERSION = "0.1.0";
export const GENERIC_SECTOR_WORLD_KIT_DEFINITION = Object.freeze({ id: "generic-sector-world-kit", camelName: "genericSectorWorldKit", engineKey: "genericSectorWorld", category: "procedural-world", tier: "atomic", provides: ["world:sectors", "world:sector-streaming"], requires: ["seed:world"], purpose: "Deterministic sector coordinates and streaming state for procedural worlds." });
export function createGenericSectorWorldKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_SECTOR_WORLD_KIT_DEFINITION, config); }
export default createGenericSectorWorldKit;
