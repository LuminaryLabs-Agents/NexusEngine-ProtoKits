import { clamp, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const GROUND_CONTACT_KIT_VERSION = "0.0.1";

function unitNormal(normal = {}) {
  const x = number(normal.x, 0);
  const y = number(normal.y, 1);
  const z = number(normal.z, 0);
  const length = Math.hypot(x, y, z) || 1;
  return Object.freeze({ x: x / length, y: y / length, z: z / length });
}

export function slopeFromNormal(normal = {}) {
  const n = unitNormal(normal);
  return 1 - clamp(n.y, 0, 1);
}

export function seatOnGround(instance = {}, terrain = {}, options = {}) {
  const source = instance.position ?? instance.transform ?? instance;
  const x = number(source.x, 0);
  const z = number(source.z ?? source.y, 0);
  const height = typeof terrain.heightAt === "function" ? number(terrain.heightAt(x, z), 0) : number(terrain.height, 0);
  const normal = unitNormal(typeof terrain.normalAt === "function" ? terrain.normalAt(x, z) : terrain.normal);
  const inset = number(instance.inset ?? options.inset ?? 0, 0);
  const slope = slopeFromNormal(normal);
  const maxSlope = number(instance.maxSlope ?? options.maxSlope, Infinity);
  const valid = slope <= maxSlope;
  return Object.freeze({
    ...instance,
    position: Object.freeze({ ...source, x, y: height - inset, z }),
    groundContact: Object.freeze({ height, inset, normal, slope, valid, reason: valid ? null : "slope" })
  });
}

export function applyGroundInset(instance = {}, amount = 0.08) {
  const source = instance.position ?? instance.transform ?? instance;
  return Object.freeze({ ...instance, position: Object.freeze({ ...source, y: number(source.y, 0) - number(amount, 0.08) }) });
}

export function alignToNormal(instance = {}, normal = {}) {
  const n = unitNormal(normal);
  return Object.freeze({ ...instance, groundAlignment: Object.freeze({ normal: n, pitchHint: Math.atan2(n.z, Math.max(0.0001, n.y)), rollHint: -Math.atan2(n.x, Math.max(0.0001, n.y)) }) });
}

export function withSlopeValidity(instance = {}, maxSlope = 0.55) {
  const slope = number(instance.groundContact?.slope, 0);
  const valid = slope <= maxSlope;
  return Object.freeze({ ...instance, placementValid: valid, placementReason: valid ? null : "slope" });
}

export function createGroundContactService(options = {}) {
  return Object.freeze({
    inset: number(options.inset, 0.08),
    maxSlope: number(options.maxSlope, 0.55),
    seatOnGround: (instance, terrain, overrides = {}) => seatOnGround(instance, terrain, { inset: options.inset, maxSlope: options.maxSlope, ...overrides }),
    applyGroundInset,
    alignToNormal,
    withSlopeValidity,
    slopeFromNormal
  });
}

export function createGroundContactKit(nexusEngine = {}, options = {}) {
  const service = createGroundContactService(options);
  const api = Object.freeze({ id: options.id ?? "ground-contact-kit", version: GROUND_CONTACT_KIT_VERSION, ...service });
  return Object.freeze({
    ...api,
    createRuntimeKit(runtimeOptions = {}) {
      return defineInjectedRuntimeKit(nexusEngine, {
        id: runtimeOptions.id ?? api.id,
        provides: runtimeOptions.provides ?? ["domain:ground-contact", "service:ground-seating", "service:slope-filter"],
        bindings: { groundContactKit: api },
        metadata: { version: GROUND_CONTACT_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) }
      });
    }
  });
}
