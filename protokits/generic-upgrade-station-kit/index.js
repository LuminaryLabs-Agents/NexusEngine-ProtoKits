import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_UPGRADE_STATION_KIT_VERSION = "0.1.0";
export const GENERIC_UPGRADE_STATION_KIT_DEFINITION = Object.freeze({ id: "generic-upgrade-station-kit", camelName: "genericUpgradeStationKit", engineKey: "genericUpgradeStation", category: "inventory-economy", tier: "atomic", provides: ["interaction:upgrade-station"], requires: ["interaction:station", "progression:upgrades", "economy:currency"], purpose: "Generic station for buying and installing upgrades." });
export function createGenericUpgradeStationKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_UPGRADE_STATION_KIT_DEFINITION, config); }
export default createGenericUpgradeStationKit;
