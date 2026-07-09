import { createReactiveParticleFieldKit } from "../reactive-particle-field-kit/index.js";

export function createGpuAmbientCaveDustKit(NexusEngine, config = {}) {
  return createReactiveParticleFieldKit(NexusEngine, { ...config, presetId: "gpu-ambient-cave-dust-kit", kitId: config.kitId ?? "gpu-ambient-cave-dust-kit" });
}

export default createGpuAmbientCaveDustKit;
