import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CARGO_KIT_VERSION = "0.1.0";
export const GENERIC_CARGO_KIT_DEFINITION = Object.freeze({ id: "generic-cargo-kit", camelName: "genericCargoKit", engineKey: "genericCargo", category: "inventory-economy", tier: "atomic", provides: ["cargo:hold", "cargo:weight", "cargo:value"], requires: [], purpose: "Generic vehicle or storage cargo hold, cargo weight, and cargo value slots." });
export function createGenericCargoKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_CARGO_KIT_DEFINITION, config); }
export default createGenericCargoKit;
