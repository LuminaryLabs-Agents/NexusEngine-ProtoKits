import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_WATERCRAFT_WAKE_KIT_VERSION = "0.1.0";
export const GENERIC_WATERCRAFT_WAKE_KIT_DEFINITION = Object.freeze({ id: "generic-watercraft-wake-kit", camelName: "genericWatercraftWakeKit", engineKey: "genericWatercraftWake", category: "vehicle-watercraft", tier: "atomic", provides: ["watercraft:wake", "surface:wake-injection"], requires: ["vehicle:body-state", "surface:foam-field"], purpose: "Generic wake descriptors and wake field injection for moving watercraft." });
export function createGenericWatercraftWakeKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_WATERCRAFT_WAKE_KIT_DEFINITION, config); }
export default createGenericWatercraftWakeKit;
