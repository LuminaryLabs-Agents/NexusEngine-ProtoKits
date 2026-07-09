import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_WAVE_SPECTRUM_KIT_VERSION = "0.1.0";
export const GENERIC_WAVE_SPECTRUM_KIT_DEFINITION = Object.freeze({ id: "generic-wave-spectrum-kit", camelName: "genericWaveSpectrumKit", engineKey: "genericWaveSpectrum", category: "surface-water", tier: "atomic", provides: ["surface:wave-spectrum", "surface:wave-displacement"], requires: ["surface:height-sampler"], purpose: "Configurable swell, chop, cross-sea, storm, shore-break, and wake disturbance bands." });
export function createGenericWaveSpectrumKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_WAVE_SPECTRUM_KIT_DEFINITION, config); }
export default createGenericWaveSpectrumKit;
