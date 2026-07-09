import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CAMERA_SEQUENCE_KIT_VERSION = "0.1.0";
export const GENERIC_CAMERA_SEQUENCE_KIT_DEFINITION = Object.freeze({ id: "generic-camera-sequence-kit", camelName: "genericCameraSequenceKit", engineKey: "genericCameraSequence", category: "camera", tier: "atomic", provides: ["camera:sequence-control"], requires: ["camera:state", "mission:phase"], purpose: "Generic sequence-driven camera beat and camera orchestration slot." });
export function createGenericCameraSequenceKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_CAMERA_SEQUENCE_KIT_DEFINITION, config); }
export default createGenericCameraSequenceKit;
