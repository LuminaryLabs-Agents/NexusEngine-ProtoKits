export function createXrRenderDescriptorKit(config = {}) {
  return {
    id: "xr-render-descriptor-kit",
    kind: "descriptor-kit",
    version: "0.1.0",
    config,
    descriptors: {
      objects: config.objects || [],
      materials: config.materials || [],
      sky: config.sky || null,
      lighting: config.lighting || null,
      outlines: config.outlines || null,
      backend: config.backend || "host-selected"
    }
  };
}
