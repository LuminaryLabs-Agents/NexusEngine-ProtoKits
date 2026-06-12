import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CAMERA_STATE_KIT_VERSION = "0.1.0";
export const GENERIC_CAMERA_STATE_KIT_DEFINITION = Object.freeze({ id: "generic-camera-state-kit", camelName: "genericCameraStateKit", engineKey: "genericCameraState", category: "camera", tier: "atomic", provides: ["camera:state", "camera:active"], requires: [], purpose: "Generic active camera state resource and camera selection slot." });
export function createGenericCameraStateKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_CAMERA_STATE_KIT_DEFINITION, config); }
export default createGenericCameraStateKit;
