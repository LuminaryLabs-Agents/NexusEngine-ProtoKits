import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_OBJECTIVE_KIT_VERSION = "0.1.0";
export const GENERIC_OBJECTIVE_KIT_DEFINITION = Object.freeze({ id: "generic-objective-kit", camelName: "genericObjectiveKit", engineKey: "genericObjective", category: "mission-sequence", tier: "atomic", provides: ["mission:objective", "sequence:objective"], requires: [], purpose: "Generic objective descriptors for reach, collect, recover, return, dock, upgrade, survive, scan, escort, and tow goals." });
export function createGenericObjectiveKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_OBJECTIVE_KIT_DEFINITION, config); }
export default createGenericObjectiveKit;
