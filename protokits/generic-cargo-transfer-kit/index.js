import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CARGO_TRANSFER_KIT_VERSION = "0.1.0";
export const GENERIC_CARGO_TRANSFER_KIT_DEFINITION = Object.freeze({ id: "generic-cargo-transfer-kit", camelName: "genericCargoTransferKit", engineKey: "genericCargoTransfer", category: "interaction", tier: "atomic", provides: ["cargo:transfer"], requires: ["interaction:registry", "cargo:hold"], purpose: "Generic transfer flow between player, vehicle, storage, markets, and ports." });
export function createGenericCargoTransferKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_CARGO_TRANSFER_KIT_DEFINITION, config); }
export default createGenericCargoTransferKit;
