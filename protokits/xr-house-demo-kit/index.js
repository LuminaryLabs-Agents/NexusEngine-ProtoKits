export function createXrHouseDemoKit(config = {}) {
  return {
    id: "xr-house-demo-kit",
    kind: "composition-kit",
    version: "0.1.0",
    config,
    kits: [
      "xr-session-kit",
      "xr-frame-kit",
      "xr-layer-kit",
      "xr-render-descriptor-kit",
      "xr-input-kit",
      "xr-grab-throw-kit",
      "simple-rigid-body-kit",
      "toon-visual-kit",
      "sky-gradient-kit"
    ]
  };
}
