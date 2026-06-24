export function createSkyGradientKit(config = {}) {
  return {
    id: "sky-gradient-kit",
    kind: "descriptor-kit",
    version: "0.1.0",
    config,
    descriptors: {
      type: "gradient-skybox",
      zenith: config.zenith || [0.18, 0.38, 0.92],
      horizon: config.horizon || [1.0, 0.78, 0.48],
      ground: config.ground || [0.38, 0.29, 0.18]
    }
  };
}
