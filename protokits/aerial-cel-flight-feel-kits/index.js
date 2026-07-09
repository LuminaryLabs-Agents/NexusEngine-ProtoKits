import { defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const AERIAL_CEL_FLIGHT_FEEL_KITS_VERSION = "0.1.0";
export const AERIAL_CEL_SHADING_DOMAIN_KIT_VERSION = AERIAL_CEL_FLIGHT_FEEL_KITS_VERSION;
export const TERRAIN_RESOLUTION_DOMAIN_KIT_VERSION = AERIAL_CEL_FLIGHT_FEEL_KITS_VERSION;
export const TERRAIN_STRATA_DOMAIN_KIT_VERSION = AERIAL_CEL_FLIGHT_FEEL_KITS_VERSION;
export const AERIAL_INPUT_FEEL_DOMAIN_KIT_VERSION = AERIAL_CEL_FLIGHT_FEEL_KITS_VERSION;
export const AERIAL_FLIGHT_ASSIST_DOMAIN_KIT_VERSION = AERIAL_CEL_FLIGHT_FEEL_KITS_VERSION;
export const AERIAL_SPEED_FEEL_DOMAIN_KIT_VERSION = AERIAL_CEL_FLIGHT_FEEL_KITS_VERSION;
export const AERIAL_VFX_FEEDBACK_DOMAIN_KIT_VERSION = AERIAL_CEL_FLIGHT_FEEL_KITS_VERSION;
export const AERIAL_WEAPON_FEEL_DOMAIN_KIT_VERSION = AERIAL_CEL_FLIGHT_FEEL_KITS_VERSION;

const VALID_PHASES = new Set(["input", "simulate", "resolve", "cleanup"]);
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const normalizePhase = (phase, fallback = "simulate") => { const value = String(phase ?? fallback); if (value === "post" || value === "render") return "cleanup"; return VALID_PHASES.has(value) ? value : fallback; };
function defineResource(NexusEngine, name) { return typeof NexusEngine.defineResource === "function" ? NexusEngine.defineResource(name) : `resource:${name}`; }
function defineEvent(NexusEngine, name) { return typeof NexusEngine.defineEvent === "function" ? NexusEngine.defineEvent(name) : `event:${name}`; }
function approach(a, b, rate, dt) { return number(a) + (number(b) - number(a)) * (1 - Math.exp(-Math.max(0, rate) * Math.max(0, dt))); }
function dtOf(world, fallback = 1 / 60) { return clamp(number(world.__nexusClock?.delta, fallback), 0, 1 / 15); }

export function createAerialCelShadingDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialCelShading.state");
  const defaultRamp = config.ramp ?? [
    [46, 28, 20, 255], [70, 42, 26, 255], [104, 58, 31, 255], [140, 78, 39, 255],
    [178, 102, 50, 255], [216, 133, 66, 255], [244, 170, 92, 255], [255, 212, 132, 255]
  ];
  function initial() {
    return { id: config.id ?? "aerial-cel-shading", version: AERIAL_CEL_SHADING_DOMAIN_KIT_VERSION, steps: number(config.steps, 8), exposure: number(config.exposure, 1.18), saturation: number(config.saturation, 1.2), rampId: config.rampId ?? "canyon-day-8", ramp: defaultRamp, rimStrength: number(config.rimStrength, 0.35), outline: { plane: true, landmarks: true, vegetation: false, ...(config.outline ?? {}) }, sky: { color: config.skyColor ?? "#f08a3e", fogColor: config.fogColor ?? "#d98a58", fogNear: number(config.fogNear, 700), fogFar: number(config.fogFar, 8500) }, frame: 0 };
  }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-cel-shading-domain-kit", provides: ["render:cel-shading-policy", "render:toon-ramp-descriptor", "render:outline-policy"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialCelShadingSystem", system(world) { const s = world.getResource(State) ?? initial(); world.setResource(State, { ...s, frame: number(world.__nexusClock?.frame, 0) }); } }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { engine.aerialCelShading = { getState: () => world.getResource(State), getRamp: () => world.getResource(State)?.ramp ?? defaultRamp, getMaterialPolicy: () => world.getResource(State) }; }, metadata: { version: AERIAL_CEL_SHADING_DOMAIN_KIT_VERSION, domain: "aerial-cel-shading", purpose: "Global 8-step cel shading, ramp, saturation, rim, outline, and sky policy descriptors." } });
}

export function createTerrainResolutionDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "terrainResolution.state");
  const tiers = {
    low: { dprCap: 1, buildsPerFrame: 1, near: 32, mid: 16, far: 8 },
    standard: { dprCap: 1.25, buildsPerFrame: 1, near: 56, mid: 28, far: 12 },
    high: { dprCap: 1.5, buildsPerFrame: 2, near: 80, mid: 40, far: 16 },
    ultra: { dprCap: 1.8, buildsPerFrame: 2, near: 112, mid: 56, far: 24 },
    ...(config.tiers ?? {})
  };
  function initial() { const tierId = config.defaultTier ?? "high"; return { id: config.id ?? "terrain-resolution", version: TERRAIN_RESOLUTION_DOMAIN_KIT_VERSION, tierId, tiers, policy: tiers[tierId] ?? tiers.high, vertexColorMode: config.vertexColorMode ?? "biome-toon", frame: 0 }; }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "terrain-resolution-domain-kit", provides: ["render:terrain-resolution-policy", "render:terrain-build-budget"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "terrainResolutionSystem", system(world) { const s = world.getResource(State) ?? initial(); world.setResource(State, { ...s, frame: number(world.__nexusClock?.frame, 0) }); } }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { engine.terrainResolution = { getState: () => world.getResource(State), getPolicy: () => world.getResource(State)?.policy ?? tiers.high, getSegments(lod = "near") { const p = world.getResource(State)?.policy ?? tiers.high; return Math.max(4, Math.floor(number(p[lod], p.near))); } }; }, metadata: { version: TERRAIN_RESOLUTION_DOMAIN_KIT_VERSION, domain: "terrain-resolution", purpose: "Adaptive terrain mesh resolution, DPR, vertex-color mode, and build budget descriptors." } });
}

export function createTerrainStrataDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "terrainStrata.state");
  let installedEngine = null;
  function sampleAt(x = 0, z = 0) {
    const h = installedEngine?.canyonTerrain?.heightAt?.(x, z) ?? 0;
    const slope = installedEngine?.canyonTerrain?.slopeAt?.(x, z) ?? 0;
    const strata = (Math.sin(h * number(config.heightFrequency, 0.045) + z * number(config.zFrequency, 0.0025)) + 1) * 0.5;
    const ridge = clamp(slope * number(config.ridgeStrength, 2.2), 0, 1);
    const dust = clamp(1 - slope * 2 + Math.sin(x * 0.003 + z * 0.002) * 0.12, 0, 1);
    return { height: h, slope, strata, ridge, dust, routeLightness: installedEngine?.flightCorridor?.corridorWeightAt?.(x, z) ?? 0 };
  }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "terrain-strata-domain-kit", requires: ["terrain:height-sampler"], provides: ["terrain:strata-sample", "render:terrain-detail-descriptor"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "terrainStrataSystem", system(world) { world.setResource(State, { id: config.id ?? "terrain-strata", version: TERRAIN_STRATA_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), params: { heightFrequency: number(config.heightFrequency, 0.045), ridgeStrength: number(config.ridgeStrength, 2.2) } }); } }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "terrain-strata", version: TERRAIN_STRATA_DOMAIN_KIT_VERSION, frame: 0, params: {} }); }, install({ engine, world }) { installedEngine = engine; engine.terrainStrata = { getState: () => world.getResource(State), sampleAt }; }, metadata: { version: TERRAIN_STRATA_DOMAIN_KIT_VERSION, domain: "terrain-strata", purpose: "Canyon strata, slope, ridge, dust, and route lightness sampling for terrain vertex color fidelity." } });
}

export function createAerialInputFeelDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialInputFeel.state");
  const SetRawInput = defineEvent(NexusEngine, "aerialInputFeel.setRawInput");
  let installedEngine = null;
  function initial() { return { id: config.id ?? "aerial-input-feel", version: AERIAL_INPUT_FEEL_DOMAIN_KIT_VERSION, raw: {}, intent: { pitch: 0, roll: 0, yaw: 0, boost: false, airbrake: false, fire: false }, frame: 0 }; }
  function curve(v) { const sign = v < 0 ? -1 : 1; const a = Math.abs(v); return sign * Math.pow(a, number(config.curve, 1.25)); }
  function system(world) { let s = clone(world.getResource(State) ?? initial()); for (const e of world.readEvents(SetRawInput)) s.raw = { ...s.raw, ...e }; const dt = dtOf(world); const invert = installedEngine?.accessibilityPreferences?.getState?.()?.invertPitch ? -1 : 1; const target = { pitch: curve(number(s.raw.pitch) * invert), roll: curve(number(s.raw.roll)), yaw: curve(number(s.raw.yaw)), boost: Boolean(s.raw.boost), airbrake: Boolean(s.raw.airbrake), fire: Boolean(s.raw.fire) }; s.intent = { ...target, pitch: approach(s.intent.pitch, target.pitch, number(config.pitchSmoothing, 9), dt), roll: approach(s.intent.roll, target.roll, number(config.rollSmoothing, 11), dt), yaw: approach(s.intent.yaw, target.yaw, number(config.yawSmoothing, 8), dt) }; s.frame = number(world.__nexusClock?.frame, 0); world.setResource(State, s); }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-input-feel-domain-kit", provides: ["aerial:input-intent", "input:flight-feel"], resources: { State }, events: { SetRawInput }, systems: [{ phase: normalizePhase(config.phase, "input"), name: "aerialInputFeelSystem", system }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { installedEngine = engine; engine.aerialInputFeel = { setInput(raw = {}) { const previous = world.getResource(State) ?? initial(); const next = { ...previous, raw: { ...previous.raw, ...raw }, intent: { ...previous.intent, ...raw } }; world.setResource(State, next); world.emit(SetRawInput, raw); engine.poweredAerialFlight?.setInput?.(next.intent); return next.intent; }, getState: () => world.getResource(State), getIntent: () => world.getResource(State)?.intent ?? initial().intent }; }, metadata: { version: AERIAL_INPUT_FEEL_DOMAIN_KIT_VERSION, domain: "aerial-input-feel", purpose: "Input curves, smoothing, airbrake intent, and accessibility-aware flight intent descriptors." } });
}

export function createAerialFlightAssistDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialFlightAssist.state");
  let installedEngine = null;
  function system(world) { const body = installedEngine?.poweredAerialFlight?.getBody?.(); const agl = number(body?.agl, 100); const start = number(config.lowAglAssistStart, 75); const hard = number(config.hardDeckAgl, 28); const lowAglT = clamp((start - agl) / Math.max(1, start - hard), 0, 1); world.setResource(State, { id: config.id ?? "aerial-flight-assist", version: AERIAL_FLIGHT_ASSIST_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), lowAglT, terrainAvoidance: lowAglT * number(config.terrainAvoidance, 0.25), safetyEnvelope: { lowAglAssistStart: start, hardDeckAgl: hard, agl }, warnings: lowAglT > 0.25 ? [{ id: "terrain-assist", severity: lowAglT > 0.75 ? "danger" : "warning", text: "TERRAIN" }] : [] }); }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-flight-assist-domain-kit", requires: ["aerial:body"], provides: ["aerial:assist-descriptor", "aerial:safety-envelope"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialFlightAssistSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-flight-assist", version: AERIAL_FLIGHT_ASSIST_DOMAIN_KIT_VERSION, lowAglT: 0, warnings: [], frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.aerialFlightAssist = { getState: () => world.getResource(State), getWarnings: () => world.getResource(State)?.warnings ?? [] }; }, metadata: { version: AERIAL_FLIGHT_ASSIST_DOMAIN_KIT_VERSION, domain: "aerial-flight-assist", purpose: "Terrain safety envelope and assist descriptors for readable, forgiving arcade flight." } });
}

export function createAerialSpeedFeelDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialSpeedFeel.state");
  let installedEngine = null;
  function system(world) { const body = installedEngine?.poweredAerialFlight?.getBody?.() ?? {}; const speed = number(body.speed, 0); const boostHeat = number(body.boostHeat, 0); const speedT = clamp((speed - number(config.minSpeed, 70)) / (number(config.maxSpeed, 285) - number(config.minSpeed, 70)), 0, 1); const boostT = Boolean(body.boosting) || boostHeat > 5 ? clamp(boostHeat / 100, 0, 1) : 0; world.setResource(State, { id: config.id ?? "aerial-speed-feel", version: AERIAL_SPEED_FEEL_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), speed, speedT, boostT, fovKick: speedT * number(config.fovKick, 12), contrailIntensity: Math.max(0, speedT - 0.45) / 0.55, dustWake: number(body.agl, 999) < 80 ? 1 - clamp(number(body.agl, 0) / 80, 0, 1) : 0, audio: { enginePitch: 32 + speed * 0.48, windGain: 0.04 + speedT * 0.12, boostGain: boostT * 0.12 } }); }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-speed-feel-domain-kit", requires: ["aerial:body"], provides: ["render:speed-feedback", "audio:speed-feedback", "camera:speed-feedback"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialSpeedFeelSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-speed-feel", version: AERIAL_SPEED_FEEL_DOMAIN_KIT_VERSION, speedT: 0, frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.aerialSpeedFeel = { getState: () => world.getResource(State) }; }, metadata: { version: AERIAL_SPEED_FEEL_DOMAIN_KIT_VERSION, domain: "aerial-speed-feel", purpose: "Speed perception descriptors for FOV, audio, contrails, dust wake, and boost feedback." } });
}

export function createAerialVfxFeedbackDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialVfxFeedback.state");
  let installedEngine = null;
  function system(world) { const body = installedEngine?.poweredAerialFlight?.getBody?.(); const speedFeel = installedEngine?.aerialSpeedFeel?.getState?.() ?? {}; const scan = installedEngine?.aerialScanLock?.getState?.() ?? {}; const cargo = installedEngine?.aerialCargoStatus?.getState?.() ?? {}; const effects = []; if (body?.position) { if (number(speedFeel.contrailIntensity, 0) > 0.05) effects.push({ id: "contrail", type: "contrail", position: body.position, intensity: speedFeel.contrailIntensity }); if (number(speedFeel.dustWake, 0) > 0.05) effects.push({ id: "dust-wake", type: "dust-wake", position: body.position, intensity: speedFeel.dustWake }); if (number(body.boostHeat, 0) > 3) effects.push({ id: "boost-exhaust", type: "boost-exhaust", position: body.position, intensity: clamp(number(body.boostHeat, 0) / 100, 0, 1) }); } if (scan.scanning) effects.push({ id: "scan-pulse", type: "scan-pulse", targetId: scan.targetId, intensity: scan.progress }); if (cargo.carrying && cargo.status !== "secure") effects.push({ id: "cargo-warning", type: "cargo-warning", intensity: 1 - number(cargo.integrity, 1) }); world.setResource(State, { id: config.id ?? "aerial-vfx-feedback", version: AERIAL_VFX_FEEDBACK_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), effects }); }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-vfx-feedback-domain-kit", provides: ["render:vfx-descriptors"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialVfxFeedbackSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-vfx-feedback", version: AERIAL_VFX_FEEDBACK_DOMAIN_KIT_VERSION, effects: [], frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.aerialVfxFeedback = { getState: () => world.getResource(State), getEffects: () => world.getResource(State)?.effects ?? [] }; }, metadata: { version: AERIAL_VFX_FEEDBACK_DOMAIN_KIT_VERSION, domain: "aerial-vfx-feedback", purpose: "Visual feedback descriptors for speed, boost, ground proximity dust, scan pulse, cargo warning, and future hits." } });
}

export function createAerialWeaponFeelDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialWeaponFeel.state");
  let heat = 0;
  function system(world) { const dt = dtOf(world); heat = clamp(heat - dt * number(config.coolPerSecond, 48), 0, 100); world.setResource(State, { id: config.id ?? "aerial-weapon-feel", version: AERIAL_WEAPON_FEEL_DOMAIN_KIT_VERSION, heat, ready: heat < number(config.maxHeat, 95), cooldown: heat / 100, frame: number(world.__nexusClock?.frame, 0) }); }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-weapon-feel-domain-kit", provides: ["combat:weapon-feel", "render:weapon-feedback", "audio:weapon-feedback"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialWeaponFeelSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-weapon-feel", version: AERIAL_WEAPON_FEEL_DOMAIN_KIT_VERSION, heat: 0, ready: true, frame: 0 }); }, install({ engine, world }) { engine.aerialWeaponFeel = { getState: () => world.getResource(State), noteFire() { heat = clamp(heat + number(config.heatPerShot, 8), 0, 100); return world.getResource(State); } }; }, metadata: { version: AERIAL_WEAPON_FEEL_DOMAIN_KIT_VERSION, domain: "aerial-weapon-feel", purpose: "Weapon cooldown, heat, hit-feedback hooks, and combat feel descriptors." } });
}

export function createAerialCelFlightFeelDomainKits(NexusEngine = {}, config = {}) {
  return [
    createAerialCelShadingDomainKit(NexusEngine, config.celShading ?? {}),
    createTerrainResolutionDomainKit(NexusEngine, config.terrainResolution ?? {}),
    createTerrainStrataDomainKit(NexusEngine, config.terrainStrata ?? {}),
    createAerialInputFeelDomainKit(NexusEngine, config.inputFeel ?? {}),
    createAerialFlightAssistDomainKit(NexusEngine, config.flightAssist ?? {}),
    createAerialSpeedFeelDomainKit(NexusEngine, config.speedFeel ?? {}),
    createAerialVfxFeedbackDomainKit(NexusEngine, config.vfxFeedback ?? {}),
    createAerialWeaponFeelDomainKit(NexusEngine, config.weaponFeel ?? {})
  ];
}

export function collectAerialCelFlightFeelSnapshot(engine = {}) {
  return { cel: engine.aerialCelShading?.getState?.() ?? null, terrainResolution: engine.terrainResolution?.getState?.() ?? null, terrainStrata: engine.terrainStrata?.getState?.() ?? null, inputFeel: engine.aerialInputFeel?.getState?.() ?? null, flightAssist: engine.aerialFlightAssist?.getState?.() ?? null, speedFeel: engine.aerialSpeedFeel?.getState?.() ?? null, vfx: engine.aerialVfxFeedback?.getState?.() ?? null, weaponFeel: engine.aerialWeaponFeel?.getState?.() ?? null };
}

export default createAerialCelFlightFeelDomainKits;
