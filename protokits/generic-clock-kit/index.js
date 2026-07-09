import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CLOCK_KIT_VERSION = "0.1.0";
export const GENERIC_CLOCK_KIT_DEFINITION = Object.freeze({ id: "generic-clock-kit", camelName: "genericClockKit", engineKey: "genericClock", category: "foundation", tier: "atomic", provides: ["time:clock", "time:delta", "time:elapsed", "time:fixed-step"], requires: [], purpose: "Shared simulation clock, delta, elapsed, and fixed-step slots." });
export function createGenericClockKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_CLOCK_KIT_DEFINITION, config); }
export default createGenericClockKit;
