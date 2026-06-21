export const PROCEDURAL_CLOUD_LAYER_KIT_VERSION = "0.1.0";
export function createProceduralCloudLayerKit() { return Object.freeze({ id: "procedural-cloud-layer-kit", provides: ["sky:cloud-layers", "render:cloud-descriptors"] }); }
export default createProceduralCloudLayerKit;
