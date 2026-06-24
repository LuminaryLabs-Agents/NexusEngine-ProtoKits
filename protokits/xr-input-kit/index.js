export function createXrInputKit(config = {}) {
  return {
    id: "xr-input-kit",
    kind: "descriptor-kit",
    version: "0.1.0",
    config,
    descriptors: {
      stream: "XrInputFrame",
      hands: ["left", "right"],
      buttons: ["grip", "select", "menu"],
      axes: ["thumbstick"]
    }
  };
}
