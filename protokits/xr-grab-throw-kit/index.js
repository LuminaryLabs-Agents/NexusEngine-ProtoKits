export function createXrGrabThrowKit(config = {}) {
  return {
    id: "xr-grab-throw-kit",
    kind: "descriptor-kit",
    version: "0.1.0",
    config,
    descriptors: {
      historyFrames: config.historyFrames || 8,
      objects: config.objects || [],
      events: [
        "xr.grab.hover",
        "xr.grab.started",
        "xr.grab.released",
        "xr.throw.impulse"
      ]
    }
  };
}
