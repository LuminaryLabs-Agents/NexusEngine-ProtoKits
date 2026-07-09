import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_ROUTE_FIELD_KIT_VERSION = "0.1.0";
export const GENERIC_ROUTE_FIELD_KIT_DEFINITION = Object.freeze({ id: "generic-route-field-kit", camelName: "genericRouteFieldKit", engineKey: "genericRouteField", category: "procedural-world", tier: "atomic", provides: ["navigation:route-field"], requires: ["world:field-sampler"], purpose: "Generic safe/risky route fields, trade paths, and difficulty corridors." });
export function createGenericRouteFieldKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_ROUTE_FIELD_KIT_DEFINITION, config); }
export default createGenericRouteFieldKit;
