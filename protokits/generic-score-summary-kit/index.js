import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_SCORE_SUMMARY_KIT_VERSION = "0.1.0";
export const GENERIC_SCORE_SUMMARY_KIT_DEFINITION = Object.freeze({ id: "generic-score-summary-kit", camelName: "genericScoreSummaryKit", engineKey: "genericScoreSummary", category: "mission-sequence", tier: "atomic", provides: ["mission:score-summary"], requires: ["mission:phase"], purpose: "Generic scoring and end-of-mission summary slot." });
export function createGenericScoreSummaryKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_SCORE_SUMMARY_KIT_DEFINITION, config); }
export default createGenericScoreSummaryKit;
