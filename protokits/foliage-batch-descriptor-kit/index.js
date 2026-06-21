export const FOLIAGE_BATCH_DESCRIPTOR_KIT_VERSION = "0.1.0";
export function createFoliageBatchDescriptorKit() { return Object.freeze({ id: "foliage-batch-descriptor-kit", provides: ["render:foliage-batches"] }); }
export default createFoliageBatchDescriptorKit;
