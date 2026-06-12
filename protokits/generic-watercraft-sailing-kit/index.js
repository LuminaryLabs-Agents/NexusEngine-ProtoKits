import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_WATERCRAFT_SAILING_KIT_VERSION = "0.1.0";
export const GENERIC_WATERCRAFT_SAILING_KIT_DEFINITION = Object.freeze({ id: "generic-watercraft-sailing-kit", camelName: "genericWatercraftSailingKit", engineKey: "genericWatercraftSailing", category: "vehicle-watercraft", tier: "atomic", provides: ["watercraft:sailing"], requires: ["vehicle:body-state", "weather:wind", "input:actions"], purpose: "Generic wind angle, sail trim, tacking curve, gust response, and sail upgrade modifiers." });
export function createGenericWatercraftSailingKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_WATERCRAFT_SAILING_KIT_DEFINITION, config); }
export default createGenericWatercraftSailingKit;
