export const GENERIC_VISUAL_FX_DESCRIPTOR_KITS_VERSION = "0.1.0";
export const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
export const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
