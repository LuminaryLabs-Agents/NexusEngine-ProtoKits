export const TIME_OF_DAY_KIT_VERSION = "0.1.0";
export function createTimeOfDayKit() { return Object.freeze({ id: "time-of-day-kit", provides: ["time:day-night"] }); }
export default createTimeOfDayKit;
