import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_VEHICLE_THREE_KIT_VERSION = "0.1.0";
export const GENERIC_VEHICLE_THREE_KIT_DEFINITION = Object.freeze({ id: "generic-vehicle-three-kit", camelName: "genericVehicleThreeKit", engineKey: "genericVehicleThree", category: "renderer", tier: "atomic", provides: ["render:three-vehicle"], requires: ["render:three", "vehicle:body-state"], purpose: "Generic Three.js vehicle rendering slot driven by vehicle body state." });
export function createGenericVehicleThreeKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_VEHICLE_THREE_KIT_DEFINITION, config); }
export default createGenericVehicleThreeKit;
