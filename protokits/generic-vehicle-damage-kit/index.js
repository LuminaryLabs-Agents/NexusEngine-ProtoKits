import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_VEHICLE_DAMAGE_KIT_VERSION = "0.1.0";
export const GENERIC_VEHICLE_DAMAGE_KIT_DEFINITION = Object.freeze({ id: "generic-vehicle-damage-kit", camelName: "genericVehicleDamageKit", engineKey: "genericVehicleDamage", category: "vehicle-watercraft", tier: "atomic", provides: ["vehicle:damage"], requires: ["vehicle:body-state"], purpose: "Generic configurable damage model for hull, engine, sails, rudder, cargo, crew, and tools." });
export function createGenericVehicleDamageKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_VEHICLE_DAMAGE_KIT_DEFINITION, config); }
export default createGenericVehicleDamageKit;
