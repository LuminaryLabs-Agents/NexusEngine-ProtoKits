import { createGenericFxEmitterDescriptorKit } from "./generic-fx-emitter-descriptor-kit.js";
import { createGenericParticleFieldDescriptorKit } from "./generic-particle-field-descriptor-kit.js";
import { createGenericShockwaveDescriptorKit } from "./generic-shockwave-descriptor-kit.js";
import { createGenericAtmosphereLayerDescriptorKit } from "./generic-atmosphere-layer-descriptor-kit.js";

export const GENERIC_VISUAL_FX_DESCRIPTOR_KITS_VERSION = "0.1.0";

export function createGenericVisualFxDescriptorKits(NexusRealtime = {}, config = {}) {
  return [
    createGenericFxEmitterDescriptorKit(NexusRealtime, config.fxEmitter ?? {}),
    createGenericParticleFieldDescriptorKit(NexusRealtime, config.particleFields ?? {}),
    createGenericShockwaveDescriptorKit(NexusRealtime, config.shockwaves ?? {}),
    createGenericAtmosphereLayerDescriptorKit(NexusRealtime, config.atmosphereLayers ?? {})
  ];
}

export default createGenericVisualFxDescriptorKits;
