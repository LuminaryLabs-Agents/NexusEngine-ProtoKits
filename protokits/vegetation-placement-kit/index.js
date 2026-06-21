export const VEGETATION_PLACEMENT_KIT_VERSION = "0.1.0";
export function createVegetationPlacementKit() { return Object.freeze({ id: "vegetation-placement-kit", provides: ["vegetation:placement", "vegetation:patch-instances"] }); }
export default createVegetationPlacementKit;
