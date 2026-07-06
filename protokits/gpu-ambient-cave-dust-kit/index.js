import { createReactiveParticleFieldKit } from "../reactive-particle-field-kit/index.js";

export function createGpuAmbientCaveDustKit(NexusRealtime, config = {}) {
  return createReactiveParticleFieldKit(NexusRealtime, { ...config, presetId: "gpu-ambient-cave-dust-kit", kitId: config.kitId ?? "gpu-ambient-cave-dust-kit" });
}

export default createGpuAmbientCaveDustKit;
