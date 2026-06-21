export const PROCEDURAL_FOLIAGE_COMPOSITION_KIT_VERSION = "0.1.0";
export function createProceduralFoliageConfig(overrides = {}) { return { seed: "procedural-foliage", ...overrides }; }
export function createProceduralFoliageKits() { return []; }
export default createProceduralFoliageKits;
