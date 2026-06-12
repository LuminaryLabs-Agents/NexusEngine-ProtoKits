import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_UPGRADE_KIT_VERSION = "0.1.0";
export const GENERIC_UPGRADE_KIT_DEFINITION = Object.freeze({ id: "generic-upgrade-kit", camelName: "genericUpgradeKit", engineKey: "genericUpgrade", category: "inventory-economy", tier: "atomic", provides: ["progression:upgrades"], requires: ["economy:currency"], purpose: "Generic upgrade descriptors, costs, levels, stat modifiers, and requirements." });
export function createGenericUpgradeKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_UPGRADE_KIT_DEFINITION, config); }
export default createGenericUpgradeKit;
