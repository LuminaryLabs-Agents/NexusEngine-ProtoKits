import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_ERROR_OVERLAY_KIT_VERSION = "0.1.0";
export const GENERIC_ERROR_OVERLAY_KIT_DEFINITION = Object.freeze({ id: "generic-error-overlay-kit", camelName: "genericErrorOverlayKit", engineKey: "genericErrorOverlay", category: "foundation", tier: "atomic", provides: ["diagnostics:error-overlay"], requires: ["diagnostics:health-report"], purpose: "Visible startup and runtime error reporting slot for hosts." });
export function createGenericErrorOverlayKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_ERROR_OVERLAY_KIT_DEFINITION, config); }
export default createGenericErrorOverlayKit;
