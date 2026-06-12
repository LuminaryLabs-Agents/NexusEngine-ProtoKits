import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_CURRENCY_KIT_VERSION = "0.1.0";
export const GENERIC_CURRENCY_KIT_DEFINITION = Object.freeze({ id: "generic-currency-kit", camelName: "genericCurrencyKit", engineKey: "genericCurrency", category: "inventory-economy", tier: "atomic", provides: ["economy:currency"], requires: [], purpose: "Generic currency slot for gold, credits, supplies, salvage points, or game-specific money." });
export function createGenericCurrencyKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_CURRENCY_KIT_DEFINITION, config); }
export default createGenericCurrencyKit;
