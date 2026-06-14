import assert from "node:assert/strict";
import {
  createTimedPressureDirectorKit,
  createZoneFieldKit,
  createScanSurveyKit,
  createResourcePressureKit,
  createRouteCheckpointKit,
  createCargoDeliveryKit,
  createAgentGroupKit,
  createHazardDirectorKit,
  createVisualFidelityMakerKit,
  createAudioEventFeedbackMakerKit,
  createCameraCinematicMakerKit,
  createScenarioQaHarness,
  createDeterministicReplayHarness,
  createGamehostStandardKit,
  createTokenRegistryKit,
  createFoglineSurveyPressureBridgeKit,
  createDomainFoundationKits
} from "../protokits/domain-foundation/index.js";

function defineNamed(kind, name) { return Object.freeze({ kind, name }); }
function defineRuntimeKit(config = {}) { return Object.freeze({ id: config.id ?? "kit", resources: config.resources ?? {}, events: config.events ?? {}, components: config.components ?? {}, systems: config.systems ?? [], requires: config.requires ?? [], provides: config.provides ?? [], bindings: config.bindings ?? {}, metadata: config.metadata ?? {}, initWorld: config.initWorld, install: config.install }); }
const Nexus = { defineResource: (name) => defineNamed("resource", name), defineEvent: (name) => defineNamed("event", name), defineComponent: (name) => defineNamed("component", name), defineRuntimeKit };
function createWorld() { const resources = new Map(); const events = new Map(); return { __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 }, setResource(def, value) { resources.set(def.name, value); return value; }, getResource(def) { return resources.get(def.name); }, hasResource(def) { return resources.has(def.name); }, emit(def, payload = {}) { const queue = events.get(def.name) ?? []; queue.push(payload); events.set(def.name, queue); return payload; }, readEvents(def) { return (events.get(def.name) ?? []).slice(); }, clearAllEvents() { events.clear(); } }; }
function createEngine(kits) { const world = createWorld(); const systems = []; const engine = { world, kits: [], tick(delta = 1 / 60) { world.__nexusClock.delta = delta; world.__nexusClock.elapsed += delta; world.__nexusClock.frame += 1; for (const entry of systems) entry.system(world); world.clearAllEvents(); return world; } }; for (const kit of kits) { engine.kits.push(kit); kit.initWorld?.({ engine, world, kit }); for (const entry of kit.systems ?? []) systems.push(typeof entry === "function" ? { phase: "simulate", system: entry } : entry); kit.install?.({ engine, world, kit }); } return engine; }
function assertSerializable(value) { assert.deepEqual(JSON.parse(JSON.stringify(value)), value); }

const kits = [createTimedPressureDirectorKit(Nexus, { durationSeconds: 2, thresholds: [{ id: "heat", value: 0.5 }], pressurePerSecond: 1 }), createZoneFieldKit(Nexus), createScanSurveyKit(Nexus), createResourcePressureKit(Nexus), createRouteCheckpointKit(Nexus), createCargoDeliveryKit(Nexus), createAgentGroupKit(Nexus), createHazardDirectorKit(Nexus), createVisualFidelityMakerKit(Nexus), createAudioEventFeedbackMakerKit(Nexus), createCameraCinematicMakerKit(Nexus), createScenarioQaHarness(Nexus), createDeterministicReplayHarness(Nexus), createGamehostStandardKit(Nexus), createTokenRegistryKit(Nexus), createFoglineSurveyPressureBridgeKit(Nexus, { relayTargetIds: ["relay-1"] })];
for (const kit of kits) { assert.equal(typeof kit.id, "string"); assert.ok(Array.isArray(kit.provides)); assert.ok(kit.metadata?.version); }

const engine = createEngine(kits);
engine.timedPressure.startPhase("relay-window", { durationSeconds: 1, commandId: "start-1" });
engine.scanSurvey.registerTarget({ id: "relay-1", x: 2, y: 0, radius: 0.5, required: 1 });
engine.zoneField.registerZone({ id: "fog", x: 0, y: 0, radius: 3, effects: [{ id: "corruption", amountPerSecond: 2, threshold: 1 }] });
engine.zoneField.setEntityPosition("player", { x: 0, y: 0 });
engine.resourcePressure.register({ id: "oxygen", value: 1, min: 0, max: 1, rate: -0.25, thresholds: [{ id: "low", value: 0.75 }] });
engine.routeCheckpoint.registerRoute({ id: "route-a", checkpoints: ["a", "b"] });
engine.cargoDelivery.registerItem({ id: "crate", health: 1 });
engine.agentGroup.spawn({ id: "drone", groupId: "flock", x: 0, y: 0, speed: 10 });
engine.agentGroup.setGroupGoal("flock", { x: 1, y: 0, radius: 0.1 });
engine.hazardDirector.register({ id: "wraith" });
engine.visualFidelity.set({ profile: "fogline", descriptors: { fog: true } });
engine.audioEventFeedback.cue("scan-start", { duration: 0.2 });
engine.cameraCinematic.set({ profile: "survey", descriptors: { mode: "first-person" } });
engine.scenarioQa.set({ descriptors: { expectedRelays: 1 } });
engine.deterministicReplay.cue("command", { payload: { action: "scan" }, duration: 0 });
engine.gamehostStandard.set({ descriptors: { status: "booted" } });
engine.tokenRegistry.set({ descriptors: { provides: ["scan:survey"] } });
engine.tick(0);
engine.scanSurvey.pulse({ origin: { x: 0, y: 0 }, radius: 3, amount: 1, commandId: "pulse-1" });
engine.routeCheckpoint.enter("a");
engine.cargoDelivery.pickup("crate");
engine.hazardDirector.activate("wraith");
engine.tick(0.5);
assert.deepEqual(engine.scanSurvey.getState().completedTargetIds, ["relay-1"]);
assert.deepEqual(engine.foglineSurveyPressure.getState().completedRelayIds, ["relay-1"]);
assert.ok(engine.zoneField.getState().effectsByEntityId.player.corruption >= 1);
assert.ok(engine.foglineSurveyPressure.getState().failed, "zone threshold should fail the bridge by default");
assert.equal(engine.routeCheckpoint.getState().progressByRouteId["route-a"], 1);
assert.deepEqual(engine.cargoDelivery.getState().carriedIds, ["crate"]);
assert.ok(engine.agentGroup.getState().agents.drone.x > 0);
assert.equal(engine.hazardDirector.getState().hazards.wraith.active, true);
assert.equal(engine.resourcePressure.getState().resources.oxygen.value, 0.875);
engine.tick(0.6);
assert.equal(engine.timedPressure.getState().status, "expired");
for (const apiName of ["timedPressure", "zoneField", "scanSurvey", "resourcePressure", "routeCheckpoint", "cargoDelivery", "agentGroup", "hazardDirector", "visualFidelity", "audioEventFeedback", "cameraCinematic", "scenarioQa", "deterministicReplay", "gamehostStandard", "tokenRegistry", "foglineSurveyPressure"]) assertSerializable(engine[apiName].getSnapshot());
engine.scanSurvey.reset({ keepTargets: true }); engine.timedPressure.reset(); engine.zoneField.reset(); engine.foglineSurveyPressure.reset(); engine.tick(0);
assert.equal(engine.scanSurvey.getState().completedTargetIds.length, 0);
assert.equal(engine.timedPressure.getState().status, "idle");
assert.equal(Object.keys(engine.zoneField.getState().zones).length, 0);
const foundation = createDomainFoundationKits(Nexus);
assert.equal(foundation.length, 16);
assert.ok(foundation.some((kit) => kit.provides.includes("pressure:timed")));
console.log("domain foundation tests passed");
