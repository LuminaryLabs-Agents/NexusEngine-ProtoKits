import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_STATION_INTERACTION_KIT_VERSION = "0.1.0";
export const GENERIC_STATION_INTERACTION_KIT_DEFINITION = Object.freeze({ id: "generic-station-interaction-kit", camelName: "genericStationInteractionKit", engineKey: "genericStationInteraction", category: "interaction", tier: "atomic", provides: ["interaction:station"], requires: ["interaction:registry"], purpose: "Generic station interaction for helm, anchor, map, upgrade bench, shop, cannon, cockpit, and seat." });
export function createGenericStationInteractionKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_STATION_INTERACTION_KIT_DEFINITION, config); }
export default createGenericStationInteractionKit;
