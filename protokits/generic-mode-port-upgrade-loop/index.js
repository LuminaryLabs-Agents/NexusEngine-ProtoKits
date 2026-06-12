import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_MODE_PORT_UPGRADE_LOOP_VERSION = "0.1.0";
export const GENERIC_MODE_PORT_UPGRADE_LOOP_DEFINITION = Object.freeze({ id: "generic-mode-port-upgrade-loop", camelName: "genericModePortUpgradeLoop", engineKey: "genericModePortUpgradeLoop", category: "mode", tier: "mode", provides: ["mode:port-upgrade-loop"], requires: ["economy:market", "economy:currency", "cargo:hold", "progression:upgrades", "interaction:upgrade-station", "ui:hud"], purpose: "Higher-order mode for ports, markets, currency, cargo selling, and upgrade stations." });
export function createGenericModePortUpgradeLoop(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_MODE_PORT_UPGRADE_LOOP_DEFINITION, config); }
export default createGenericModePortUpgradeLoop;
