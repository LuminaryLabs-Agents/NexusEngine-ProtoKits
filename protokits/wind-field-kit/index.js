export const WIND_FIELD_KIT_VERSION = "0.1.0";
export function createWindFieldKit() {
  return Object.freeze({ id: "wind-field-kit", provides: ["weather:wind-field", "wind:sample"] });
}
export default createWindFieldKit;
