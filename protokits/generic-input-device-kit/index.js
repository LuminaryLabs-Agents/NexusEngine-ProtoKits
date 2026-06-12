import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_INPUT_DEVICE_KIT_VERSION = "0.1.0";
export const GENERIC_INPUT_DEVICE_KIT_DEFINITION = Object.freeze({ id: "generic-input-device-kit", camelName: "genericInputDeviceKit", engineKey: "genericInputDevice", category: "input", tier: "atomic", provides: ["input:keyboard", "input:pointer", "input:gamepad", "input:touch"], requires: [], purpose: "Raw device input slots for keyboard, pointer, gamepad, and touch." });
export function createGenericInputDeviceKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_INPUT_DEVICE_KIT_DEFINITION, config); }
export default createGenericInputDeviceKit;
