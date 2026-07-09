import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CAMERA_MODE_KIT_VERSION = "0.1.0";
export const GENERIC_CAMERA_MODE_KIT_DEFINITION = Object.freeze({ id: "generic-camera-mode-kit", camelName: "genericCameraModeKit", engineKey: "genericCameraMode", category: "camera", tier: "atomic", provides: ["camera:modes"], requires: ["camera:state"], purpose: "Generic third-person, first-person, map, cinematic, vehicle-chase, underwater, dock, and inspection camera modes." });
export function createGenericCameraModeKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_CAMERA_MODE_KIT_DEFINITION, config); }
export default createGenericCameraModeKit;
