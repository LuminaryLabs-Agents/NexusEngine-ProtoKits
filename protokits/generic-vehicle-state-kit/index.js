import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_VEHICLE_STATE_KIT_VERSION = "0.1.0";
export const GENERIC_VEHICLE_STATE_KIT_DEFINITION = Object.freeze({ id: "generic-vehicle-state-kit", camelName: "genericVehicleStateKit", engineKey: "genericVehicleState", category: "vehicle-watercraft", tier: "atomic", provides: ["vehicle:body-state", "vehicle:transform", "vehicle:velocity"], requires: [], purpose: "Generic durable vehicle transform, velocity, and body-state slot." });
export function createGenericVehicleStateKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_VEHICLE_STATE_KIT_DEFINITION, config); }
export default createGenericVehicleStateKit;
