import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_THREE_RENDERER_KIT_VERSION = "0.1.0";
export const GENERIC_THREE_RENDERER_KIT_DEFINITION = Object.freeze({ id: "generic-three-renderer-kit", camelName: "genericThreeRendererKit", engineKey: "genericThreeRenderer", category: "renderer", tier: "atomic", provides: ["render:three", "render:webgl"], requires: ["render:descriptors", "camera:state"], purpose: "Generic Three.js renderer backend slot over render descriptors and camera state." });
export function createGenericThreeRendererKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_THREE_RENDERER_KIT_DEFINITION, config); }
export default createGenericThreeRendererKit;
