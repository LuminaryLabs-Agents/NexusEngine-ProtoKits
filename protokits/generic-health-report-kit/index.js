import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_HEALTH_REPORT_KIT_VERSION = "0.1.0";
export const GENERIC_HEALTH_REPORT_KIT_DEFINITION = Object.freeze({ id: "generic-health-report-kit", camelName: "genericHealthReportKit", engineKey: "genericHealthReport", category: "foundation", tier: "atomic", provides: ["diagnostics:health-report", "diagnostics:startup-checks"], requires: [], purpose: "Startup capability checks and health report surface." });
export function createGenericHealthReportKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_HEALTH_REPORT_KIT_DEFINITION, config); }
export default createGenericHealthReportKit;
