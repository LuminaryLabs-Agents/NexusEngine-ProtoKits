export function createXrFrameKit(config = {}) {
  return {
    id: "xr-frame-kit",
    kind: "descriptor-kit",
    version: "0.1.0",
    config,
    descriptors: {
      framePacket: "WebXrFramePacket",
      viewPacket: "WebXrViewPacket",
      inputPacket: "WebXrInputSourcePacket",
      layerPacket: "WebXrLayerPacket"
    }
  };
}
