import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_MARKET_KIT_VERSION = "0.1.0";
export const GENERIC_MARKET_KIT_DEFINITION = Object.freeze({ id: "generic-market-kit", camelName: "genericMarketKit", engineKey: "genericMarket", category: "inventory-economy", tier: "atomic", provides: ["economy:market"], requires: ["cargo:value", "economy:currency"], purpose: "Generic market slot for selling cargo and buying supplies or services." });
export function createGenericMarketKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_MARKET_KIT_DEFINITION, config); }
export default createGenericMarketKit;
