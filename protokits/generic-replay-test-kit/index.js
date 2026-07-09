import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_REPLAY_TEST_KIT_VERSION = "0.1.0";
export const GENERIC_REPLAY_TEST_KIT_DEFINITION = Object.freeze({ id: "generic-replay-test-kit", camelName: "genericReplayTestKit", engineKey: "genericReplayTest", category: "reliability-testing", tier: "atomic", provides: ["test:deterministic-replay"], requires: ["seed:world", "input:buffer"], purpose: "Deterministic replay slot using seed, input timeline, and expected state digest." });
export function createGenericReplayTestKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_REPLAY_TEST_KIT_DEFINITION, config); }
export default createGenericReplayTestKit;
