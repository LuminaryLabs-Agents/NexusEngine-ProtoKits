import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_FALLBACK_RENDERER_KIT_VERSION = "0.1.0";
export const GENERIC_FALLBACK_RENDERER_KIT_DEFINITION = Object.freeze({ id: "generic-fallback-renderer-kit", camelName: "genericFallbackRendererKit", engineKey: "genericFallbackRenderer", category: "reliability-testing", tier: "atomic", provides: ["render:fallback"], requires: ["diagnostics:health-report"], purpose: "Fallback renderer slot for recovering from missing Three.js/WebGL support." });
export function createGenericFallbackRendererKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_FALLBACK_RENDERER_KIT_DEFINITION, config); }
export default createGenericFallbackRendererKit;
