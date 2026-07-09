import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_WEATHER_WIND_KIT_VERSION = "0.1.0";
export const GENERIC_WEATHER_WIND_KIT_DEFINITION = Object.freeze({ id: "generic-weather-wind-kit", camelName: "genericWeatherWindKit", engineKey: "genericWeatherWind", category: "surface-water", tier: "atomic", provides: ["weather:wind"], requires: ["random:seeded"], purpose: "Generic wind vector and wind strength slot for sailing, storms, particles, and atmosphere coupling." });
export function createGenericWeatherWindKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, GENERIC_WEATHER_WIND_KIT_DEFINITION, config); }
export default createGenericWeatherWindKit;
