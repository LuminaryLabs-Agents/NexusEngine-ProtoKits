import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_DISCOVERY_KIT_VERSION = "0.1.0";
export const GENERIC_DISCOVERY_KIT_DEFINITION = Object.freeze({ id: "generic-discovery-kit", camelName: "genericDiscoveryKit", engineKey: "genericDiscovery", category: "procedural-world", tier: "atomic", provides: ["world:discovery"], requires: ["world:sectors", "poi:registry"], purpose: "Tracks discovered sectors, POIs, landmarks, and map reveal." });
export function createGenericDiscoveryKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_DISCOVERY_KIT_DEFINITION, config); }
export default createGenericDiscoveryKit;
