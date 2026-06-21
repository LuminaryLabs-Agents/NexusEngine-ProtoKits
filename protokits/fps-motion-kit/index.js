export const FPS_MOTION_KIT_VERSION = "0.1.0";
export function createFpsMotionKit() { return Object.freeze({ id: "fps-motion-kit", provides: ["fps:motion", "player:pose"] }); }
export default createFpsMotionKit;
