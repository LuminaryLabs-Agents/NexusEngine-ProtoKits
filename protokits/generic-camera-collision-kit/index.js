import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CAMERA_COLLISION_KIT_VERSION = "0.1.0";
export const GENERIC_CAMERA_COLLISION_KIT_DEFINITION = Object.freeze({ id: "generic-camera-collision-kit", camelName: "genericCameraCollisionKit", engineKey: "genericCameraCollision", category: "camera", tier: "atomic", provides: ["camera:collision"], requires: ["camera:state", "spatial:index"], purpose: "Generic camera collision and clipping avoidance slot." });
export function createGenericCameraCollisionKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_CAMERA_COLLISION_KIT_DEFINITION, config); }
export default createGenericCameraCollisionKit;
