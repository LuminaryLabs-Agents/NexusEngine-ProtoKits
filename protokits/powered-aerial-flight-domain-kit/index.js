import { clamp, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const POWERED_AERIAL_FLIGHT_DOMAIN_KIT_VERSION = "0.2.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
function defineResource(NexusEngine, name) { return typeof NexusEngine.defineResource === "function" ? NexusEngine.defineResource(name) : `resource:${name}`; }
function defineEvent(NexusEngine, name) { return typeof NexusEngine.defineEvent === "function" ? NexusEngine.defineEvent(name) : `event:${name}`; }
function dtOf(world) { return clamp(number(world.__nexusClock?.delta, 1 / 60), 0, 1 / 15); }
function approach(a, b, rate, dt) { return number(a) + (number(b) - number(a)) * (1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt))); }
function len3(v = {}) { return Math.hypot(number(v.x), number(v.y), number(v.z)); }
function norm3(v = {}, fallback = { x: 0, y: 0, z: 1 }) { const l = len3(v); return l > 0.000001 ? { x: number(v.x) / l, y: number(v.y) / l, z: number(v.z) / l } : { ...fallback }; }
function add3(a = {}, b = {}) { return { x: number(a.x) + number(b.x), y: number(a.y) + number(b.y), z: number(a.z) + number(b.z) }; }
function mul3(v = {}, s = 1) { return { x: number(v.x) * s, y: number(v.y) * s, z: number(v.z) * s }; }
function forwardFromRotation(rotation = {}) { const yaw = number(rotation.yaw), pitch = number(rotation.pitch); const cp = Math.cos(pitch); return norm3({ x: Math.sin(yaw) * cp, y: -Math.sin(pitch), z: Math.cos(yaw) * cp }); }

const DEFAULT_PLANES = Object.freeze([
  { id: "p80-fury", label: "P-80 Fury", baseSpeed: 130, maxSpeed: 285, maxHealth: 100, agility: 1, color: "#c22b1d", accent: "#f59e0b" },
  { id: "iron-behemoth", label: "Iron Behemoth", baseSpeed: 105, maxSpeed: 220, maxHealth: 180, agility: 0.65, color: "#3f3f46", accent: "#ea580c" },
  { id: "a12-interceptor", label: "A-12 Interceptor", baseSpeed: 148, maxSpeed: 315, maxHealth: 82, agility: 0.95, color: "#1e3a8a", accent: "#10b981" }
]);

export function createPoweredAerialFlightDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "poweredAerialFlight.state");
  const SetInput = defineEvent(NexusEngine, "poweredAerialFlight.setInput");
  const Reset = defineEvent(NexusEngine, "poweredAerialFlight.reset");
  const Crashed = defineEvent(NexusEngine, "poweredAerialFlight.crashed");
  const FireRequested = defineEvent(NexusEngine, "poweredAerialFlight.fireRequested");
  const planes = Object.freeze((config.planes ?? DEFAULT_PLANES).map((plane, index) => ({ id: plane.id ?? `plane-${index + 1}`, ...plane })));
  let installedEngine = null;

  function speedConfig(plane = {}) {
    const user = config.speed ?? {};
    return { cruise: number(user.cruise, number(plane.baseSpeed, 130)), min: number(user.min, 70), max: number(user.max, number(plane.maxSpeed, 285)), boost: number(user.boost, number(plane.maxSpeed, 285)), airbrake: number(user.airbrake, 82) };
  }
  function responseConfig(agility = 1) {
    const r = config.response ?? {};
    return { pitchRate: number(r.pitchRate, 1.35) * agility, rollRate: number(r.rollRate, 2.4) * agility, yawRate: number(r.yawRate, 0.45) * agility, bankTurnRate: number(r.bankTurnRate, 1.15) * agility, autoLevelPitch: number(r.autoLevelPitch, 0.45), autoLevelRoll: number(r.autoLevelRoll, 0.7) };
  }
  function physicsConfig() { const p = config.physics ?? {}; return { climbDrag: number(p.climbDrag, 0.18), diveAccel: number(p.diveAccel, 0.25), turnDrag: number(p.turnDrag, 0.12), airbrakeDrag: number(p.airbrakeDrag, 0.55), velocityResponse: number(p.velocityResponse, 5.2) }; }
  function assistConfig() { const a = config.assist ?? {}; return { lowAglAssistStart: number(a.lowAglAssistStart, 75), hardDeckAgl: number(a.hardDeckAgl, 28), terrainAvoidance: number(a.terrainAvoidance, 0.25) }; }

  function initialState(overrides = {}) {
    const plane = planes.find((entry) => entry.id === (overrides.planeId ?? config.defaultPlaneId)) ?? planes[0];
    const x = number(overrides.x, 0), z = number(overrides.z, 0);
    const terrain = installedEngine?.canyonTerrain ?? installedEngine?.genericTerrainSampler;
    const ground = number(terrain?.heightAt?.(x, z), 0);
    const cruiseAgl = number(config.cruiseAgl, 100);
    const sc = speedConfig(plane);
    return { id: config.id ?? "powered-aerial-flight", version: POWERED_AERIAL_FLIGHT_DOMAIN_KIT_VERSION, planeId: plane.id, plane, status: "ready", input: { pitch: 0, roll: 0, yaw: 0, boost: false, airbrake: false, fire: false }, body: { position: { x, y: ground + cruiseAgl, z }, velocity: { x: 0, y: 0, z: sc.cruise }, forward: { x: 0, y: 0, z: 1 }, rotation: { pitch: 0, yaw: 0, roll: 0 }, angularVelocity: { pitch: 0, yaw: 0, roll: 0 }, speed: sc.cruise, targetSpeed: sc.cruise, agl: cruiseAgl, health: number(plane.maxHealth, 100), maxHealth: number(plane.maxHealth, 100), boostHeat: 0, boosting: false, airbrake: false, fireRequested: false, crashed: false, terrainAssist: 0, lastGroundHeight: ground }, frame: 0, lastReason: "initialized" };
  }

  function system(world) {
    let state = world.getResource(State) ?? initialState();
    for (const event of world.readEvents(Reset)) state = initialState(event);
    for (const event of world.readEvents(SetInput)) state = { ...state, input: { pitch: clamp(number(event.pitch), -1, 1), roll: clamp(number(event.roll ?? event.bank), -1, 1), yaw: clamp(number(event.yaw), -1, 1), boost: Boolean(event.boost), airbrake: Boolean(event.airbrake || event.brake), fire: Boolean(event.fire) } };
    const dt = dtOf(world);
    const body = clone(state.body);
    const input = state.input ?? {};
    const plane = state.plane ?? planes[0];
    const agility = number(plane.agility, 1);
    const sc = speedConfig(plane), rc = responseConfig(agility), pc = physicsConfig(), ac = assistConfig();
    const maxPitch = number(config.maxPitch, 0.78), maxRoll = number(config.maxRoll, 1.22);

    const rollInput = number(input.roll), pitchInput = number(input.pitch), yawInput = number(input.yaw);
    body.angularVelocity.roll = approach(body.angularVelocity.roll, rollInput * rc.rollRate, 9, dt);
    body.angularVelocity.pitch = approach(body.angularVelocity.pitch, pitchInput * rc.pitchRate, 8, dt);
    body.rotation.roll = clamp(number(body.rotation.roll) + body.angularVelocity.roll * dt, -maxRoll, maxRoll);
    body.rotation.pitch = clamp(number(body.rotation.pitch) + body.angularVelocity.pitch * dt, -maxPitch, maxPitch * 0.78);
    if (Math.abs(rollInput) < 0.04) body.rotation.roll = approach(body.rotation.roll, 0, rc.autoLevelRoll, dt);
    if (Math.abs(pitchInput) < 0.04 && !input.airbrake) body.rotation.pitch = approach(body.rotation.pitch, 0, rc.autoLevelPitch, dt);
    const speedFactor = clamp(number(body.speed, sc.cruise) / Math.max(1, sc.max), 0.35, 1.25);
    const bankYaw = -body.rotation.roll * rc.bankTurnRate * speedFactor;
    body.rotation.yaw += (yawInput * rc.yawRate + bankYaw) * dt;

    const boosting = Boolean(input.boost) && number(body.boostHeat, 0) < 100 && !input.airbrake;
    body.boostHeat = clamp(number(body.boostHeat, 0) + (boosting ? number(config.boostHeatPerSecond, 42) : -number(config.boostCoolPerSecond, 30)) * dt, 0, 100);
    const diveBonus = Math.max(0, body.rotation.pitch) * sc.cruise * pc.diveAccel;
    const climbDrag = Math.max(0, -body.rotation.pitch) * sc.cruise * pc.climbDrag;
    const turnDrag = Math.abs(body.rotation.roll) * sc.cruise * pc.turnDrag;
    const brakeDrag = input.airbrake ? sc.cruise * pc.airbrakeDrag : 0;
    const boostBonus = boosting ? (sc.boost - sc.cruise) : 0;
    body.targetSpeed = clamp(sc.cruise + boostBonus + diveBonus - climbDrag - turnDrag - brakeDrag, input.airbrake ? sc.airbrake : sc.min, boosting ? sc.boost : sc.max);
    body.speed = approach(body.speed, body.targetSpeed, input.airbrake ? 8.5 : 4.5, dt);
    body.forward = forwardFromRotation(body.rotation);
    let desiredVelocity = mul3(body.forward, body.speed);

    const terrain = installedEngine?.canyonTerrain ?? installedEngine?.genericTerrainSampler;
    const corridor = installedEngine?.flightCorridor;
    const ground = number(terrain?.heightAt?.(body.position.x, body.position.z), 0);
    const corridorSample = corridor?.sample?.(body.position.x, body.position.z);
    const cruiseY = number(corridorSample?.cruiseAltitude, ground + number(config.cruiseAgl, 100));
    const minimumSafeY = number(corridorSample?.minimumSafeAltitude, ground + number(config.minimumSafeAgl, 35));
    body.agl = number(body.position.y) - ground;
    const lowAglT = clamp((ac.lowAglAssistStart - body.agl) / Math.max(1, ac.lowAglAssistStart - ac.hardDeckAgl), 0, 1);
    const neutralPitch = Math.abs(pitchInput) < 0.05 && !input.airbrake;
    const cruiseHold = neutralPitch ? (cruiseY - body.position.y) * number(config.cruiseHold, 0.18) : 0;
    desiredVelocity.y += cruiseHold + lowAglT * ac.terrainAvoidance * 75;
    body.velocity = { x: approach(body.velocity.x, desiredVelocity.x, pc.velocityResponse, dt), y: approach(body.velocity.y, desiredVelocity.y, 4.4, dt), z: approach(body.velocity.z, desiredVelocity.z, pc.velocityResponse, dt) };
    body.position = add3(body.position, mul3(body.velocity, dt));
    const nextGround = number(terrain?.heightAt?.(body.position.x, body.position.z), 0);
    body.position.y = clamp(body.position.y, nextGround + ac.hardDeckAgl - 12, nextGround + number(config.maxAgl, 1600));
    body.agl = body.position.y - nextGround;
    body.terrainAssist = lowAglT;
    body.lastGroundHeight = nextGround;
    body.boosting = boosting;
    body.airbrake = Boolean(input.airbrake);
    body.fireRequested = Boolean(input.fire);
    if (body.position.y <= nextGround + ac.hardDeckAgl - 5 && !body.crashed) { body.crashed = true; state = { ...state, status: "failed", lastReason: "terrain-hard-deck" }; world.emit(Crashed, { id: state.id, reason: "terrain-hard-deck", position: body.position, agl: body.agl }); }
    if (body.fireRequested) world.emit(FireRequested, { sourceId: "player", ownerId: "player", position: body.position, rotation: body.rotation, velocity: body.velocity, speed: body.speed });
    world.setResource(State, { ...state, body, frame: number(state.frame) + 1 });
  }

  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "powered-aerial-flight-domain-kit", requires: ["terrain:height-sampler", "flight:corridor"], provides: ["aerial:powered-flight", "aerial:body", "input:flight", "combat:fire-request"], resources: { State }, events: { SetInput, Reset, Crashed, FireRequested }, systems: [{ phase: "simulate", name: "poweredAerialFlightSystem", system }], initWorld({ world }) { world.setResource(State, initialState()); }, install({ engine, world }) { installedEngine = engine; engine.poweredAerialFlight = { events: { SetInput, Reset, Crashed, FireRequested }, setInput(input = {}) { world.emit(SetInput, input); return world.getResource(State); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(State); }, getState() { return world.getResource(State); }, getSnapshot() { return clone(world.getResource(State)); }, getBody() { return world.getResource(State)?.body ?? null; }, getRenderDescriptor() { const s = world.getResource(State); return s ? { id: "player-plane", kind: "aerial-body", planeId: s.planeId, plane: s.plane, transform: { position: s.body.position, rotation: s.body.rotation }, body: s.body } : null; } }; engine.genericFlightInput ??= { setInput: engine.poweredAerialFlight.setInput }; engine.genericAerialBody ??= { getActiveBody: engine.poweredAerialFlight.getBody, reset: engine.poweredAerialFlight.reset, getState: engine.poweredAerialFlight.getState }; }, metadata: { version: POWERED_AERIAL_FLIGHT_DOMAIN_KIT_VERSION, domain: "powered-aerial-flight", purpose: "Responsive arcade aircraft flight with airbrake, bank-turn coupling, auto-level, boost heat, terrain assist, and terrain-relative cruise." } });
}

export default createPoweredAerialFlightDomainKit;
