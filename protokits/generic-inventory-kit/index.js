import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_INVENTORY_KIT_VERSION = "0.1.0";
export const GENERIC_INVENTORY_KIT_DEFINITION = Object.freeze({ id: "generic-inventory-kit", camelName: "genericInventoryKit", engineKey: "genericInventory", category: "inventory-economy", tier: "atomic", provides: ["inventory:items"], requires: [], purpose: "Generic personal item inventory slot." });
export function createGenericInventoryKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_INVENTORY_KIT_DEFINITION, config); }
export default createGenericInventoryKit;
