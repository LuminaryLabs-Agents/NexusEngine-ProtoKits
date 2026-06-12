import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_SEED_KIT_VERSION = "0.1.0";
export const GENERIC_SEED_KIT_DEFINITION = Object.freeze({ id: "generic-seed-kit", camelName: "genericSeedKit", engineKey: "genericSeed", category: "foundation", tier: "atomic", provides: ["seed:world", "random:seeded", "random:stream"], requires: [], purpose: "Deterministic world seed and named random streams." });
export function createGenericSeedKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_SEED_KIT_DEFINITION, config); }
export default createGenericSeedKit;
