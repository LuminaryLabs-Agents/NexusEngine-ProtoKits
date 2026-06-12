import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_MISSION_PHASE_KIT_VERSION = "0.1.0";
export const GENERIC_MISSION_PHASE_KIT_DEFINITION = Object.freeze({ id: "generic-mission-phase-kit", camelName: "genericMissionPhaseKit", engineKey: "genericMissionPhase", category: "mission-sequence", tier: "atomic", provides: ["mission:phase", "sequence:phase"], requires: ["mission:objective"], purpose: "Generic mission phase graph for intro, travel, search, interact, return, upgrade, escalation, complete, and fail phases." });
export function createGenericMissionPhaseKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_MISSION_PHASE_KIT_DEFINITION, config); }
export default createGenericMissionPhaseKit;
