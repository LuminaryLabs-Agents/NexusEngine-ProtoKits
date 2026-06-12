import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_HUD_DOM_KIT_VERSION = "0.1.0";
export const GENERIC_HUD_DOM_KIT_DEFINITION = Object.freeze({ id: "generic-hud-dom-kit", camelName: "genericHudDomKit", engineKey: "genericHudDom", category: "renderer", tier: "atomic", provides: ["ui:hud"], requires: ["mission:objective"], purpose: "Generic DOM HUD slot configured by state selectors and mission/objective resources." });
export function createGenericHudDomKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_HUD_DOM_KIT_DEFINITION, config); }
export default createGenericHudDomKit;
