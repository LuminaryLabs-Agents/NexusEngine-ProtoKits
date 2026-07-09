import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_VEHICLE_CONTROL_KIT_VERSION = "0.1.0";
export const GENERIC_VEHICLE_CONTROL_KIT_DEFINITION = Object.freeze({ id: "generic-vehicle-control-kit", camelName: "genericVehicleControlKit", engineKey: "genericVehicleControl", category: "vehicle-watercraft", tier: "atomic", provides: ["vehicle:control"], requires: ["vehicle:body-state", "input:actions"], purpose: "Translates semantic input actions into vehicle throttle, brake, steer, boost, anchor, and tool intent." });
export function createGenericVehicleControlKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_VEHICLE_CONTROL_KIT_DEFINITION, config); }
export default createGenericVehicleControlKit;
