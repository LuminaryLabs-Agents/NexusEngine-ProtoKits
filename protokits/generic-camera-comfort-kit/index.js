import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CAMERA_COMFORT_KIT_VERSION = "0.1.0";
export const GENERIC_CAMERA_COMFORT_KIT_DEFINITION = Object.freeze({ id: "generic-camera-comfort-kit", camelName: "genericCameraComfortKit", engineKey: "genericCameraComfort", category: "camera", tier: "atomic", provides: ["camera:comfort"], requires: ["camera:state"], purpose: "Generic camera smoothing, shake limits, and motion comfort controls." });
export function createGenericCameraComfortKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_CAMERA_COMFORT_KIT_DEFINITION, config); }
export default createGenericCameraComfortKit;
