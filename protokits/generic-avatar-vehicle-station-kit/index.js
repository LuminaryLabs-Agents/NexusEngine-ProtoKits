import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_AVATAR_VEHICLE_STATION_KIT_VERSION = "0.1.0";
export const GENERIC_AVATAR_VEHICLE_STATION_KIT_DEFINITION = Object.freeze({ id: "generic-avatar-vehicle-station-kit", camelName: "genericAvatarVehicleStationKit", engineKey: "genericAvatarVehicleStation", category: "avatar-player", tier: "atomic", provides: ["avatar:vehicle-station"], requires: ["avatar:state", "vehicle:body-state"], purpose: "Generic enter/exit station behavior for helm, cockpit, turret, map table, seat, and control stations." });
export function createGenericAvatarVehicleStationKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_AVATAR_VEHICLE_STATION_KIT_DEFINITION, config); }
export default createGenericAvatarVehicleStationKit;
