export function createXrSessionKit(config = {}) {
  return {
    id: "xr-session-kit",
    kind: "descriptor-kit",
    version: "0.1.0",
    config,
    descriptors: {
      mode: config.mode || "immersive-vr",
      requiredFeatures: config.requiredFeatures || ["local-floor"],
      optionalFeatures: config.optionalFeatures || ["hand-tracking", "anchors", "haptics"],
      referenceSpace: config.referenceSpace || "local-floor"
    }
  };
}
