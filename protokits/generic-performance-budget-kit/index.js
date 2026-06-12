import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_PERFORMANCE_BUDGET_KIT_VERSION = "0.1.0";
export const GENERIC_PERFORMANCE_BUDGET_KIT_DEFINITION = Object.freeze({ id: "generic-performance-budget-kit", camelName: "genericPerformanceBudgetKit", engineKey: "genericPerformanceBudget", category: "reliability-testing", tier: "atomic", provides: ["perf:budget"], requires: ["time:clock"], purpose: "Performance budget slot for frame time, renderer time, entity count, draw calls, active POIs, and particle count." });
export function createGenericPerformanceBudgetKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_PERFORMANCE_BUDGET_KIT_DEFINITION, config); }
export default createGenericPerformanceBudgetKit;
