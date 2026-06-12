import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_RECOVERY_SITE_KIT_VERSION = "0.1.0";
export const GENERIC_RECOVERY_SITE_KIT_DEFINITION = Object.freeze({ id: "generic-recovery-site-kit", camelName: "genericRecoverySiteKit", engineKey: "genericRecoverySite", category: "interaction", tier: "atomic", provides: ["poi:recovery-site", "interaction:recovery"], requires: ["poi:registry", "interaction:hold-action"], purpose: "Generic recovery-site loop for salvage, ruins, mining, crashed vehicles, lost cargo, and resource extraction." });
export function createGenericRecoverySiteKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_RECOVERY_SITE_KIT_DEFINITION, config); }
export default createGenericRecoverySiteKit;
