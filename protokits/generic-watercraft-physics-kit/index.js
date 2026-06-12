import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_WATERCRAFT_PHYSICS_KIT_VERSION = "0.1.0";
export const GENERIC_WATERCRAFT_PHYSICS_KIT_DEFINITION = Object.freeze({ id: "generic-watercraft-physics-kit", camelName: "genericWatercraftPhysicsKit", engineKey: "genericWatercraftPhysics", category: "vehicle-watercraft", tier: "atomic", provides: ["watercraft:physics"], requires: ["vehicle:body-state", "surface:height-sampler", "surface:current-field"], purpose: "Generic watercraft drag, turn inertia, current push, bobbing, anchor drag, and hazard impact physics slot." });
export function createGenericWatercraftPhysicsKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_WATERCRAFT_PHYSICS_KIT_DEFINITION, config); }
export default createGenericWatercraftPhysicsKit;
