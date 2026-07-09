import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_MEMORY_POOL_KIT_VERSION = "0.1.0";
export const GENERIC_MEMORY_POOL_KIT_DEFINITION = Object.freeze({ id: "generic-memory-pool-kit", camelName: "genericMemoryPoolKit", engineKey: "genericMemoryPool", category: "foundation", tier: "atomic", provides: ["memory:pools"], requires: [], purpose: "Reusable allocation pools for particles, descriptors, and hot path data." });
export function createGenericMemoryPoolKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_MEMORY_POOL_KIT_DEFINITION, config); }
export default createGenericMemoryPoolKit;
