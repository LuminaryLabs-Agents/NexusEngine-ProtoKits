import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_STATE_DIGEST_KIT_VERSION = "0.1.0";
export const GENERIC_STATE_DIGEST_KIT_DEFINITION = Object.freeze({ id: "generic-state-digest-kit", camelName: "genericStateDigestKit", engineKey: "genericStateDigest", category: "reliability-testing", tier: "atomic", provides: ["test:state-digest"], requires: [], purpose: "Compact deterministic state digest slot for regression checks." });
export function createGenericStateDigestKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_STATE_DIGEST_KIT_DEFINITION, config); }
export default createGenericStateDigestKit;
