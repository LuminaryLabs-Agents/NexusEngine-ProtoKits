import { defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const AERIAL_UI_INTERACTION_KITS_VERSION = "0.1.0";
export const WORLD_MARKER_DOMAIN_KIT_VERSION = AERIAL_UI_INTERACTION_KITS_VERSION;
export const AERIAL_RETICLE_TARGETING_DOMAIN_KIT_VERSION = AERIAL_UI_INTERACTION_KITS_VERSION;
export const AERIAL_RADAR_DOMAIN_KIT_VERSION = AERIAL_UI_INTERACTION_KITS_VERSION;
export const AERIAL_COCKPIT_FEEDBACK_DOMAIN_KIT_VERSION = AERIAL_UI_INTERACTION_KITS_VERSION;
export const AERIAL_ROUTE_PLANNER_DOMAIN_KIT_VERSION = AERIAL_UI_INTERACTION_KITS_VERSION;
export const AERIAL_DOCKING_DOMAIN_KIT_VERSION = AERIAL_UI_INTERACTION_KITS_VERSION;
export const CONTRACT_BOARD_DOMAIN_KIT_VERSION = AERIAL_UI_INTERACTION_KITS_VERSION;
export const MODAL_FLOW_DOMAIN_KIT_VERSION = AERIAL_UI_INTERACTION_KITS_VERSION;
export const ACCESSIBILITY_PREFERENCES_DOMAIN_KIT_VERSION = AERIAL_UI_INTERACTION_KITS_VERSION;

const VALID_PHASES = new Set(["input", "simulate", "resolve", "cleanup"]);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const dist3 = (a = {}, b = {}) => Math.hypot(number(a.x) - number(b.x), number(a.y) - number(b.y), number(a.z) - number(b.z));
const normalizePhase = (phase, fallback = "simulate") => {
  const value = String(phase ?? fallback);
  if (value === "post" || value === "render") return "cleanup";
  return VALID_PHASES.has(value) ? value : fallback;
};
function defineResource(NexusEngine, name) { return typeof NexusEngine.defineResource === "function" ? NexusEngine.defineResource(name) : `resource:${name}`; }
function defineEvent(NexusEngine, name) { return typeof NexusEngine.defineEvent === "function" ? NexusEngine.defineEvent(name) : `event:${name}`; }
function forward(body = {}) {
  const yaw = number(body.rotation?.yaw, 0);
  const pitch = number(body.rotation?.pitch, 0);
  const cp = Math.cos(pitch);
  return { x: Math.sin(yaw) * cp, y: -Math.sin(pitch), z: Math.cos(yaw) * cp };
}
function dot(a = {}, b = {}) { return number(a.x) * number(b.x) + number(a.y) * number(b.y) + number(a.z) * number(b.z); }
function rel(body = {}, position = {}) {
  const p = body.position ?? {};
  return { x: number(position.x) - number(p.x), y: number(position.y) - number(p.y), z: number(position.z) - number(p.z) };
}
function withCommon(marker, body) {
  const distance = body?.position ? dist3(body.position, marker.position) : 0;
  return { distance, visible: distance <= number(marker.maxDistance, 9000), ...marker };
}

export function createWorldMarkerDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "worldMarker.state");
  let installedEngine = null;
  function initial() { return { id: config.id ?? "world-markers", version: WORLD_MARKER_DOMAIN_KIT_VERSION, descriptors: [], frame: 0, stats: { count: 0 } }; }
  function system(world) {
    const body = installedEngine?.poweredAerialFlight?.getBody?.();
    const objects = installedEngine?.aerialProceduralObjects?.getDescriptors?.() ?? [];
    const encounters = installedEngine?.aerialEncounter?.getDescriptors?.() ?? [];
    const route = installedEngine?.aerialRoutePlanner?.getState?.()?.waypoints ?? [];
    const contracts = installedEngine?.contractBoard?.getActiveContract?.() ? [installedEngine.contractBoard.getActiveContract()] : [];
    const descriptors = [];
    for (const object of objects) {
      if (!["objective", "structure", "atmosphere"].includes(object.kind)) continue;
      descriptors.push(withCommon({ id: `marker:${object.id}`, targetId: object.id, kind: "world-marker", markerType: object.type ?? object.kind, label: object.type ?? object.id, position: object.position, priority: object.kind === "objective" ? 1 : 4, materialId: object.materialId ?? "marker.amber" }, body));
    }
    for (const target of encounters) {
      if (!target.active) continue;
      descriptors.push(withCommon({ id: `marker:${target.id}`, targetId: target.id, kind: "world-marker", markerType: "threat", label: target.type ?? "threat", position: target.position, priority: target.type === "zeppelin" ? 0 : 2, materialId: "marker.red" }, body));
    }
    for (const waypoint of route) descriptors.push(withCommon({ id: `marker:${waypoint.id}`, targetId: waypoint.id, kind: "world-marker", markerType: waypoint.type ?? "route", label: waypoint.label ?? waypoint.type ?? "route", position: waypoint.position, priority: 1.5, materialId: "marker.cyan" }, body));
    for (const contract of contracts) if (contract?.destination) descriptors.push(withCommon({ id: `marker:contract:${contract.id}`, targetId: contract.id, kind: "world-marker", markerType: "contract", label: contract.label ?? contract.id, position: contract.destination, priority: 1, materialId: "marker.green" }, body));
    world.setResource(State, { id: config.id ?? "world-markers", version: WORLD_MARKER_DOMAIN_KIT_VERSION, descriptors: descriptors.filter((d) => d.visible).sort((a, b) => number(a.priority, 9) - number(b.priority, 9) || a.distance - b.distance).slice(0, number(config.limit, 64)), frame: number(world.__nexusClock?.frame, 0), stats: { count: descriptors.length } });
  }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "world-marker-domain-kit", provides: ["ui:world-markers", "render:marker-descriptors"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "worldMarkerSystem", system }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { installedEngine = engine; engine.worldMarkers = { getState: () => world.getResource(State), getDescriptors: () => world.getResource(State)?.descriptors ?? [] }; }, metadata: { version: WORLD_MARKER_DOMAIN_KIT_VERSION, domain: "world-marker", purpose: "Unifies objective, route, threat, structure, and contract marker descriptors." } });
}

export function createAerialReticleTargetingDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialReticleTargeting.state");
  let installedEngine = null;
  function initial() { return { id: config.id ?? "aerial-reticle", version: AERIAL_RETICLE_TARGETING_DOMAIN_KIT_VERSION, descriptor: { id: "reticle", kind: "reticle", status: "ready" }, target: null, frame: 0 }; }
  function system(world) {
    const body = installedEngine?.poweredAerialFlight?.getBody?.();
    const f = forward(body);
    const candidates = [...(installedEngine?.aerialCombat?.getTargets?.() ?? []), ...(installedEngine?.worldMarkers?.getDescriptors?.() ?? [])].filter((item) => item?.position && item.destroyed !== true);
    let best = null;
    for (const candidate of candidates) {
      const r = rel(body, candidate.position);
      const d = Math.hypot(r.x, r.y, r.z) || 1;
      const alignment = dot(f, { x: r.x / d, y: r.y / d, z: r.z / d });
      if (alignment < number(config.minAlignment, 0.965)) continue;
      const score = alignment * 10000 - d;
      if (!best || score > best.score) best = { ...candidate, distance: d, alignment, score };
    }
    const target = best ? { id: best.id, targetId: best.targetId ?? best.id, position: best.position, distance: best.distance, alignment: best.alignment, markerType: best.markerType ?? best.type ?? best.kind } : null;
    world.setResource(State, { id: config.id ?? "aerial-reticle", version: AERIAL_RETICLE_TARGETING_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), target, descriptor: { id: "reticle", kind: "reticle", status: target ? "locked" : "searching", targetId: target?.targetId ?? null, distance: target?.distance ?? null, alignment: target?.alignment ?? 0 } });
  }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-reticle-targeting-domain-kit", requires: ["aerial:body"], provides: ["ui:reticle-descriptor", "interaction:target-focus", "combat:lock-candidate", "scan:lock-candidate"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialReticleTargetingSystem", system }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { installedEngine = engine; engine.aerialReticleTargeting = { getState: () => world.getResource(State), getDescriptor: () => world.getResource(State)?.descriptor ?? null, getTarget: () => world.getResource(State)?.target ?? null }; }, metadata: { version: AERIAL_RETICLE_TARGETING_DOMAIN_KIT_VERSION, domain: "aerial-reticle-targeting", purpose: "Center-screen target focus and reticle descriptor for combat, scan, route, and interaction." } });
}

export function createAerialRadarDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialRadar.state");
  let installedEngine = null;
  function initial() { return { id: config.id ?? "aerial-radar", version: AERIAL_RADAR_DOMAIN_KIT_VERSION, blips: [], frame: 0 }; }
  function system(world) {
    const body = installedEngine?.poweredAerialFlight?.getBody?.();
    const markers = installedEngine?.worldMarkers?.getDescriptors?.() ?? [];
    const maxDistance = number(config.maxDistance, 6500);
    const blips = markers.map((marker) => {
      const r = rel(body, marker.position);
      const d = Math.hypot(r.x, r.y, r.z);
      return { id: `radar:${marker.id}`, targetId: marker.targetId, markerType: marker.markerType, x: clamp(r.x / maxDistance, -1, 1), z: clamp(r.z / maxDistance, -1, 1), distance: d, priority: marker.priority, materialId: marker.materialId };
    }).filter((blip) => blip.distance <= maxDistance).slice(0, number(config.limit, 48));
    world.setResource(State, { id: config.id ?? "aerial-radar", version: AERIAL_RADAR_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), blips });
  }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-radar-domain-kit", requires: ["aerial:body", "ui:world-markers"], provides: ["ui:radar", "render:radar-descriptors"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialRadarSystem", system }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { installedEngine = engine; engine.aerialRadar = { getState: () => world.getResource(State), getBlips: () => world.getResource(State)?.blips ?? [] }; }, metadata: { version: AERIAL_RADAR_DOMAIN_KIT_VERSION, domain: "aerial-radar", purpose: "Radar blips derived from world markers and the active aerial body." } });
}

export function createAerialCockpitFeedbackDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialCockpitFeedback.state");
  let installedEngine = null;
  function system(world) {
    const flight = installedEngine?.poweredAerialFlight?.getState?.();
    const body = flight?.body ?? {};
    const mission = installedEngine?.aerialMission?.getState?.();
    const warnings = [];
    if (number(body.agl, 100) < number(config.lowAltitudeAgl, 55)) warnings.push({ id: "low-altitude", severity: "danger", text: "LOW AGL" });
    if (number(body.boostHeat, 0) > 82) warnings.push({ id: "boost-heat", severity: "warning", text: "BOOST HEAT" });
    if (number(body.health, 100) < 35) warnings.push({ id: "critical-health", severity: "danger", text: "AIRFRAME" });
    if (mission?.failed) warnings.push({ id: "mission-failed", severity: "danger", text: "MISSION FAILED" });
    world.setResource(State, { id: config.id ?? "aerial-cockpit-feedback", version: AERIAL_COCKPIT_FEEDBACK_DOMAIN_KIT_VERSION, frame: number(world.__nexusClock?.frame, 0), meters: { speed: number(body.speed), agl: number(body.agl), health: number(body.health, 100), boostHeat: number(body.boostHeat, 0), score: number(mission?.score, 0) }, warnings, descriptor: { id: "cockpit-feedback", kind: "cockpit-feedback", warnings, meters: { speed: number(body.speed), agl: number(body.agl), health: number(body.health, 100), boostHeat: number(body.boostHeat, 0) } } });
  }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-cockpit-feedback-domain-kit", requires: ["aerial:body"], provides: ["ui:cockpit-feedback", "ui:warning-descriptors"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialCockpitFeedbackSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-cockpit-feedback", version: AERIAL_COCKPIT_FEEDBACK_DOMAIN_KIT_VERSION, meters: {}, warnings: [], descriptor: null, frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.aerialCockpitFeedback = { getState: () => world.getResource(State), getDescriptor: () => world.getResource(State)?.descriptor ?? null, getWarnings: () => world.getResource(State)?.warnings ?? [] }; }, metadata: { version: AERIAL_COCKPIT_FEEDBACK_DOMAIN_KIT_VERSION, domain: "aerial-cockpit-feedback", purpose: "Diegetic cockpit meter and warning descriptors derived from flight and mission state." } });
}

export function createAerialRoutePlannerDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialRoutePlanner.state");
  function initial() { return { id: config.id ?? "aerial-route-planner", version: AERIAL_ROUTE_PLANNER_DOMAIN_KIT_VERSION, activeRouteId: config.defaultRouteId ?? "main-canyon", waypoints: arr(config.waypoints).length ? arr(config.waypoints) : [0, 1, 2, 3].map((i) => ({ id: `route-${i + 1}`, type: "route", label: `Gate ${i + 1}`, position: { x: Math.sin(i * 1.7) * 220, y: 185 + i * 20, z: 1800 + i * 1900 } })), risk: number(config.risk, 0.35), frame: 0 }; }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-route-planner-domain-kit", provides: ["route:planner", "ui:route-plan", "render:route-descriptors"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "simulate"), name: "aerialRoutePlannerSystem", system(world) { const s = world.getResource(State) ?? initial(); world.setResource(State, { ...s, frame: number(world.__nexusClock?.frame, 0) }); } }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { engine.aerialRoutePlanner = { getState: () => world.getResource(State), getWaypoints: () => world.getResource(State)?.waypoints ?? [] }; }, metadata: { version: AERIAL_ROUTE_PLANNER_DOMAIN_KIT_VERSION, domain: "aerial-route-planner", purpose: "Route waypoint and risk descriptors for map, marker, and checkpoint UI." } });
}

export function createAerialDockingDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "aerialDocking.state");
  let installedEngine = null;
  function system(world) {
    const body = installedEngine?.poweredAerialFlight?.getBody?.();
    const pads = arr(config.pads).length ? arr(config.pads) : [{ id: "home-airstrip", label: "Home Airstrip", position: { x: 0, y: 40, z: -600 }, radius: 220 }];
    let nearest = null;
    for (const pad of pads) {
      const d = body?.position ? dist3(body.position, pad.position) : Infinity;
      if (!nearest || d < nearest.distance) nearest = { ...pad, distance: d };
    }
    const canDock = nearest && nearest.distance <= number(nearest.radius, 220) && number(body?.speed, 999) < number(config.maxDockSpeed, 95);
    world.setResource(State, { id: config.id ?? "aerial-docking", version: AERIAL_DOCKING_DOMAIN_KIT_VERSION, pads, nearest, canDock: Boolean(canDock), status: canDock ? "ready" : nearest?.distance < number(nearest?.radius, 220) ? "too-fast" : "searching", frame: number(world.__nexusClock?.frame, 0) });
  }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "aerial-docking-domain-kit", requires: ["aerial:body"], provides: ["interaction:docking", "ui:docking-descriptor"], resources: { State }, systems: [{ phase: normalizePhase(config.phase, "cleanup"), name: "aerialDockingSystem", system }], initWorld({ world }) { world.setResource(State, { id: config.id ?? "aerial-docking", version: AERIAL_DOCKING_DOMAIN_KIT_VERSION, pads: [], nearest: null, canDock: false, status: "searching", frame: 0 }); }, install({ engine, world }) { installedEngine = engine; engine.aerialDocking = { getState: () => world.getResource(State), canDock: () => Boolean(world.getResource(State)?.canDock) }; }, metadata: { version: AERIAL_DOCKING_DOMAIN_KIT_VERSION, domain: "aerial-docking", purpose: "Aerial station approach and docking readiness descriptors." } });
}

export function createContractBoardDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "contractBoard.state");
  const Accept = defineEvent(NexusEngine, "contractBoard.accept");
  const Complete = defineEvent(NexusEngine, "contractBoard.complete");
  function contracts() { return arr(config.contracts).length ? arr(config.contracts) : [ { id: "courier-01", type: "courier", label: "Carry med crates to Mesa Relay", reward: 1200, destination: { x: 420, y: 170, z: 6200 } }, { id: "survey-01", type: "survey", label: "Scan the storm-cut arches", reward: 900, destination: { x: -620, y: 260, z: 4800 } }, { id: "combat-01", type: "combat", label: "Break the canyon patrol", reward: 1500, destination: { x: 0, y: 300, z: 8400 } } ]; }
  function initial() { return { id: config.id ?? "contract-board", version: CONTRACT_BOARD_DOMAIN_KIT_VERSION, contracts: contracts().map((c) => ({ status: "available", ...c })), activeContractId: config.activeContractId ?? "courier-01", completedIds: [], frame: 0 }; }
  function system(world) { const state = clone(world.getResource(State) ?? initial()); for (const e of world.readEvents(Accept)) if (state.contracts.some((c) => c.id === e.id)) state.activeContractId = e.id; for (const e of world.readEvents(Complete)) { state.completedIds = Array.from(new Set([...state.completedIds, e.id])); state.contracts = state.contracts.map((c) => c.id === e.id ? { ...c, status: "complete" } : c); } state.frame = number(world.__nexusClock?.frame, 0); world.setResource(State, state); }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "contract-board-domain-kit", provides: ["contract:board", "mission:contracts", "ui:contract-descriptors"], resources: { State }, events: { Accept, Complete }, systems: [{ phase: normalizePhase(config.phase, "simulate"), name: "contractBoardSystem", system }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { engine.contractBoard = { accept(id) { world.emit(Accept, { id }); return world.getResource(State); }, complete(id) { world.emit(Complete, { id }); return world.getResource(State); }, getState: () => world.getResource(State), getActiveContract: () => (world.getResource(State)?.contracts ?? []).find((c) => c.id === world.getResource(State)?.activeContractId) ?? null }; }, metadata: { version: CONTRACT_BOARD_DOMAIN_KIT_VERSION, domain: "contract-board", purpose: "Data-driven contract selection and completion state for courier, survey, salvage, and combat goals." } });
}

export function createModalFlowDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "modalFlow.state");
  const Open = defineEvent(NexusEngine, "modalFlow.open");
  const Close = defineEvent(NexusEngine, "modalFlow.close");
  function initial() { return { id: config.id ?? "modal-flow", version: MODAL_FLOW_DOMAIN_KIT_VERSION, activeModalId: null, payload: null, history: [] }; }
  function system(world) { let s = clone(world.getResource(State) ?? initial()); for (const e of world.readEvents(Open)) s = { ...s, activeModalId: e.id ?? e.modalId, payload: e.payload ?? null, history: [{ type: "open", id: e.id ?? e.modalId }, ...s.history].slice(0, 24) }; for (const e of world.readEvents(Close)) s = { ...s, activeModalId: null, payload: null, history: [{ type: "close", reason: e.reason ?? "closed" }, ...s.history].slice(0, 24) }; world.setResource(State, s); }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "modal-flow-domain-kit", provides: ["ui:modal-flow", "input:modal-context"], resources: { State }, events: { Open, Close }, systems: [{ phase: "input", name: "modalFlowSystem", system }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { engine.modalFlow = { open(id, payload = {}) { world.emit(Open, { id, payload }); return world.getResource(State); }, close(reason = "closed") { world.emit(Close, { reason }); return world.getResource(State); }, getState: () => world.getResource(State) }; }, metadata: { version: MODAL_FLOW_DOMAIN_KIT_VERSION, domain: "modal-flow", purpose: "Safe modal state for map, contract, shop, settings, and pause overlays." } });
}

export function createAccessibilityPreferencesDomainKit(NexusEngine = {}, config = {}) {
  const State = defineResource(NexusEngine, config.resourceName ?? "accessibilityPreferences.state");
  const Configure = defineEvent(NexusEngine, "accessibilityPreferences.configure");
  function initial() { return { id: config.id ?? "accessibility-preferences", version: ACCESSIBILITY_PREFERENCES_DOMAIN_KIT_VERSION, invertPitch: Boolean(config.invertPitch), reduceMotion: Boolean(config.reduceMotion), highContrastMarkers: Boolean(config.highContrastMarkers), subtitles: config.subtitles !== false, dprCap: number(config.dprCap, 1.35), cameraShake: config.cameraShake !== false }; }
  function system(world) { let s = clone(world.getResource(State) ?? initial()); for (const e of world.readEvents(Configure)) s = { ...s, ...clone(e.patch ?? e) }; world.setResource(State, s); }
  return defineInjectedRuntimeKit(NexusEngine, { id: config.kitId ?? "accessibility-preferences-domain-kit", provides: ["ui:accessibility-preferences", "render:accessibility-policy", "input:preference-policy"], resources: { State }, events: { Configure }, systems: [{ phase: "input", name: "accessibilityPreferencesSystem", system }], initWorld({ world }) { world.setResource(State, initial()); }, install({ engine, world }) { engine.accessibilityPreferences = { configure(patch = {}) { world.emit(Configure, { patch }); return world.getResource(State); }, getState: () => world.getResource(State) }; }, metadata: { version: ACCESSIBILITY_PREFERENCES_DOMAIN_KIT_VERSION, domain: "accessibility-preferences", purpose: "Input, render, subtitle, motion, and marker accessibility preferences." } });
}

export function createAerialUiInteractionDomainKits(NexusEngine = {}, config = {}) {
  return [
    createContractBoardDomainKit(NexusEngine, config.contracts ?? config.contractBoard ?? {}),
    createAerialRoutePlannerDomainKit(NexusEngine, config.routePlanner ?? {}),
    createWorldMarkerDomainKit(NexusEngine, config.worldMarkers ?? {}),
    createAerialReticleTargetingDomainKit(NexusEngine, config.reticle ?? {}),
    createAerialRadarDomainKit(NexusEngine, config.radar ?? {}),
    createAerialCockpitFeedbackDomainKit(NexusEngine, config.cockpit ?? {}),
    createAerialDockingDomainKit(NexusEngine, config.docking ?? {}),
    createModalFlowDomainKit(NexusEngine, config.modalFlow ?? {}),
    createAccessibilityPreferencesDomainKit(NexusEngine, config.accessibility ?? {})
  ];
}

export function collectAerialUiInteractionSnapshot(engine = {}) {
  return {
    markers: engine.worldMarkers?.getDescriptors?.() ?? [],
    reticle: engine.aerialReticleTargeting?.getDescriptor?.() ?? null,
    reticleTarget: engine.aerialReticleTargeting?.getTarget?.() ?? null,
    radar: engine.aerialRadar?.getState?.() ?? null,
    cockpit: engine.aerialCockpitFeedback?.getState?.() ?? null,
    route: engine.aerialRoutePlanner?.getState?.() ?? null,
    docking: engine.aerialDocking?.getState?.() ?? null,
    contract: engine.contractBoard?.getState?.() ?? null,
    activeContract: engine.contractBoard?.getActiveContract?.() ?? null,
    modal: engine.modalFlow?.getState?.() ?? null,
    accessibility: engine.accessibilityPreferences?.getState?.() ?? null
  };
}

export default createAerialUiInteractionDomainKits;
