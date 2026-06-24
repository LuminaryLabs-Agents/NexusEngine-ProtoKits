export function createSimpleRigidBodyKit(config = {}) {
  return {
    id: "simple-rigid-body-kit",
    kind: "descriptor-kit",
    version: "0.1.0",
    config,
    descriptors: {
      bodies: config.bodies || [],
      floorY: config.floorY ?? 0
    }
  };
}
