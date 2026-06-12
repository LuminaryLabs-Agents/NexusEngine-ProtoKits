import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_RENDER_DESCRIPTOR_KIT_VERSION = "0.1.0";
export const GENERIC_RENDER_DESCRIPTOR_KIT_DEFINITION = Object.freeze({ id: "generic-render-descriptor-kit", camelName: "genericRenderDescriptorKit", engineKey: "genericRenderDescriptor", category: "renderer", tier: "atomic", provides: ["render:descriptors"], requires: [], purpose: "Generic render descriptor vocabulary for water, vehicles, worlds, POIs, particles, cameras, and lights." });
export function createGenericRenderDescriptorKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_RENDER_DESCRIPTOR_KIT_DEFINITION, config); }
export default createGenericRenderDescriptorKit;
