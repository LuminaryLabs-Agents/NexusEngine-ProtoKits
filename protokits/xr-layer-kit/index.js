export function createXrLayerKit(config = {}) {
  return {
    id: "xr-layer-kit",
    kind: "descriptor-kit",
    version: "0.1.0",
    config,
    descriptors: {
      layerId: config.layerId || "primary-projection",
      type: config.type || "projection",
      eyeCount: config.eyeCount || 2,
      colorFormat: config.colorFormat || "rgba8-srgb",
      depthFormat: config.depthFormat || "depth24",
      swapchainPolicy: config.swapchainPolicy || "host-provided"
    }
  };
}
