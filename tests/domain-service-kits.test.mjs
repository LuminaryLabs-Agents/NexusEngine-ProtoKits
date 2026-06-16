import assert from "node:assert/strict";
import {
  createAssetDescriptorKit,
  createBuildPlacementKit,
  createCompletionLedgerKit,
  createDamageHealthKit,
  createDiegeticFeedbackSignalKit,
  createDomainServiceKits,
  createEncounterDirectorKit,
  createLockGroupKit,
  createObjectiveBridgeKit,
  createResourceNodeKit,
  createSpatialInteractionKit,
  createStructureRuntimeKit,
  createViewRigKit
} from "../protokits/domain-service-kits/index.js";

function defineNamed(kind, name) { return Object.freeze({ kind, name }); }
function defineRuntimeKit(config = {}) { return Object.freeze({ id: config.id ?? "kit", resources: config.resources ?? {}, events: config.events ?? {}, components: config.components ?? {}, systems: config.systems ?? [], requires: config.requires ?? [], provides: config.provides ?? [], bindings: config.bindings ?? {}, metadata: config.metadata ?? {}, initWorld: config.initWorld, install: config.install }); }
const Nexus = { defineResource: (name) => defineNamed("resource", name), defineEvent: (name) => defineNamed("event", name), defineComponent: (name) => defineNamed("component", name), defineRuntimeKit };
function createWorld() { const resources = new Map(); const events = new Map(); return { __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 }, setResource(def, value) { resources.set(def.name, value); return value; }, getResource(def) { return resources.get(def.name); }, hasResource(def) { return resources.has(def.name); }, emit(def, payload = {}) { const queue = events.get(def.name) ?? []; queue.push(payload); events.set(def.name, queue); return payload; }, readEvents(def) { return (events.get(def.name) ?? []).slice(); }, clearAllEvents() { events.clear(); } }; }
function createEngine(kits) { const world = createWorld(); const systems = []; const engine = { world, kits: [], tick(delta = 1 / 60) { world.__nexusClock.delta = delta; world.__nexusClock.elapsed += delta; world.__nexusClock.frame += 1; for (const entry of systems) entry.system(world); world.clearAllEvents(); return world; } }; for (const kit of kits) { engine.kits.push(kit); kit.initWorld?.({ engine, world, kit }); for (const entry of kit.systems ?? []) systems.push(typeof entry === "function" ? { phase: "simulate", system: entry } : entry); kit.install?.({ engine, world, kit }); } return engine; }
function assertSerializable(value) { assert.deepEqual(JSON.parse(JSON.stringify(value)), value); }

const kits = [
  createViewRigKit(Nexus),
  createCompletionLedgerKit(Nexus),
  createObjectiveBridgeKit(Nexus, { mappings: [{ from: "relay", toAction: "scan", group: "relays" }] }),
  createSpatialInteractionKit(Nexus, { requireFacing: true }),
  createLockGroupKit(Nexus),
  createDamageHealthKit(Nexus),
  createEncounterDirectorKit(Nexus),
  createResourceNodeKit(Nexus),
  createBuildPlacementKit(Nexus, { catalog: { wall: { cost: { stone: 2 }, maxDistance: 5 } } }),
  createStructureRuntimeKit(Nexus),
  createDiegeticFeedbackSignalKit(Nexus),
  createAssetDescriptorKit(Nexus)
];

for (const kit of kits) { assert.equal(typeof kit.id, "string"); assert.ok(Array.isArray(kit.provides)); assert.ok(kit.metadata?.version); }

const engine = createEngine(kits);
engine.viewRig.look({ yawDelta: 0.2, pitchDelta: 0.1 });
engine.completionLedger.complete("relay-1", { group: "relays" });
engine.objectiveBridge.input({ from: "relay", group: "relays", targetId: "relay-1", oncePerId: true });
engine.spatialInteraction.registerTarget({ id: "relay-1", x: 1, y: 0, action: "scan", maxDistance: 2, requireFacing: true });
engine.spatialInteraction.setSubject({ id: "player", x: 0, y: 0, facing: { x: 1, y: 0 } });
engine.spatialInteraction.request("relay-1", { subjectId: "player", action: "scan" });
engine.lockGroup.register({ id: "gate", requiredCount: 1 });
engine.lockGroup.fill("gate", "relay-1");
engine.damageHealth.register({ id: "player", health: 10 });
engine.encounterDirector.register({ id: "wave-1", spawnBudget: 1, spawnCooldown: 0, maxActive: 1, archetypes: ["crawler"] });
engine.encounterDirector.start("wave-1");
engine.resourceNode.register({ id: "ore-1", resourceType: "ore", capacity: 3 });
engine.resourceNode.harvest("ore-1", 2);
engine.buildPlacement.select("wall");
engine.buildPlacement.preview({ type: "wall", x: 2, y: 0, origin: { x: 0, y: 0 }, resources: { stone: 2 } });
engine.buildPlacement.place({ type: "wall", id: "wall-1", x: 2, y: 0, origin: { x: 0, y: 0 }, resources: { stone: 2 } });
engine.structureRuntime.register({ id: "turret-1", type: "turret", health: 5, cooldownSeconds: 0 });
engine.structureRuntime.activate("turret-1", { targetId: "crawler-1" });
engine.diegeticFeedback.setSignal({ id: "gate-glow", kind: "pulse", group: "objective", targetId: "gate", intensity: 1 });
engine.assetDescriptor.registerAsset({ id: "crawler-sprite", kind: "sprite", tags: ["enemy"] });
engine.assetDescriptor.registerMaterial({ id: "hellstone", tags: ["ground"] });
engine.tick(0.1);

assert.ok(engine.viewRig.getState().yaw > 0);
assert.deepEqual(engine.completionLedger.getState().completedIds, ["relay-1"]);
assert.equal(engine.objectiveBridge.getState().countsByAction.scan, 1);
assert.deepEqual(engine.spatialInteraction.getState().completedIds, ["relay-1"]);
assert.equal(engine.lockGroup.getState().groups.gate.mode, "open");
assert.equal(engine.damageHealth.getState().entities.player.health, 10);
assert.equal(engine.encounterDirector.getState().pendingSpawnRequests.length, 1);
assert.equal(engine.resourceNode.getState().nodes["ore-1"].remaining, 1);
assert.equal(engine.buildPlacement.getState().placed[0].id, "wall-1");
assert.equal(engine.structureRuntime.getState().emittedRequests[0].structureId, "turret-1");
assert.equal(engine.diegeticFeedback.getState().signals["gate-glow"].kind, "pulse");
assert.equal(engine.assetDescriptor.getState().assets["crawler-sprite"].kind, "sprite");

for (const apiName of ["viewRig", "completionLedger", "objectiveBridge", "spatialInteraction", "lockGroup", "damageHealth", "encounterDirector", "resourceNode", "buildPlacement", "structureRuntime", "diegeticFeedback", "assetDescriptor"]) assertSerializable(engine[apiName].getSnapshot());

const bundle = createDomainServiceKits(Nexus);
assert.equal(bundle.length, 12);
assert.ok(bundle.some((kit) => kit.provides.includes("interaction:spatial")));
console.log("domain service kit tests passed");
