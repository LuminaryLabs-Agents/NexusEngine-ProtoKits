import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_HOLD_ACTION_KIT_VERSION = "0.1.0";
export const GENERIC_HOLD_ACTION_KIT_DEFINITION = Object.freeze({ id: "generic-hold-action-kit", camelName: "genericHoldActionKit", engineKey: "genericHoldAction", category: "interaction", tier: "atomic", provides: ["interaction:hold-action"], requires: ["interaction:registry", "input:actions"], purpose: "Generic hold-to-complete interaction for opening, repairing, salvaging, capturing, stabilizing, and harvesting." });
export function createGenericHoldActionKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_HOLD_ACTION_KIT_DEFINITION, config); }
export default createGenericHoldActionKit;
