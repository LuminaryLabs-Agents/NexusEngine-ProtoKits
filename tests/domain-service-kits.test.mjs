import assert from "node:assert/strict";
import {
  DOMAIN_SERVICE_KIT_DEFINITIONS,
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

assert.equal(DOMAIN_SERVICE_KIT_DEFINITIONS.length, 12);
assert.ok(DOMAIN_SERVICE_KIT_DEFINITIONS.every((definition) => definition.tier === "atomic"));

const kits = [
  createViewRigKit(Nexus),
  createSpatialInteractionKit(Nexus),
  createCompletionLedgerKit(Nexus),
  createObjectiveBridgeKit(Nexus),
  createLockGroupKit(Nexus),
  createDamageHealthKit(Nexus),
  createEncounterDirectorKit(Nexus),
  createResourceNodeKit(Nexus),
  createBuildPlacementKit(Nexus),
  createStructureRuntimeKit(Nexus),
  createDiegeticFeedbackSignalKit(Nexus),
  createAssetDescriptorKit(Nexus)
];

for (const kit of kits) {
  assert.equal(typeof kit.id, "string");
  assert.ok(Array.isArray(kit.provides));
  assert.ok(kit.metadata?.purpose);
}

const engine = createEngine(kits);
engine.viewRig.setCamera({ mode: "first-person", target: "player" });
engine.spatialInteraction.registerInteractable({ id: "relay-1", action: "scan" });
engine.completionLedger.completeInteraction("relay-1");
engine.objectiveBridge.addObjective({ id: "scan-relays", action: "scan", target: 1 });
engine.lockGroup.completeInteraction("gate-lock");
engine.damageHealth.command({ type: "damage", id: "player", amount: 5 });
engine.encounterDirector.setPhase("wave-1");
engine.resourceNode.addItem({ id: "ore", kind: "resource" });
engine.buildPlacement.addDescriptor({ id: "placement-preview", kind: "build-preview" });
engine.structureRuntime.addDescriptor({ id: "turret-1", kind: "structure" });
engine.diegeticFeedback.addEffect({ id: "gate-glow", kind: "pulse" });
engine.assetDescriptor.addDescriptor({ id: "crawler-sprite", kind: "sprite" });
engine.tick(0.1);

assert.equal(engine.viewRig.getState().domain.camera.mode, "first-person");
assert.equal(engine.spatialInteraction.getState().domain.interaction.registry["relay-1"].id, "relay-1");
assert.deepEqual(engine.completionLedger.getState().domain.interaction.completed, ["relay-1"]);
assert.equal(engine.objectiveBridge.getState().domain.mission.objectives[0].id, "scan-relays");
assert.equal(engine.lockGroup.getState().domain.interaction.completed[0], "gate-lock");
assert.equal(engine.damageHealth.getState().domain.vehicle.damage.player.hull, 95);
assert.equal(engine.encounterDirector.getState().domain.mission.phase, "wave-1");
assert.equal(engine.resourceNode.getState().domain.inventory.items[0].id, "ore");
assert.equal(engine.buildPlacement.getState().domain.render.descriptors[0].id, "placement-preview");
assert.equal(engine.structureRuntime.getState().domain.render.descriptors[0].id, "turret-1");
assert.equal(engine.diegeticFeedback.getState().domain.render.effects[0].id, "gate-glow");
assert.equal(engine.assetDescriptor.getState().domain.render.descriptors[0].id, "crawler-sprite");

for (const apiName of ["viewRig", "spatialInteraction", "completionLedger", "objectiveBridge", "lockGroup", "damageHealth", "encounterDirector", "resourceNode", "buildPlacement", "structureRuntime", "diegeticFeedback", "assetDescriptor"]) assertSerializable(engine[apiName].getState());

const bundle = createDomainServiceKits(Nexus);
assert.equal(bundle.length, 12);
assert.ok(bundle.some((kit) => kit.provides.includes("interaction:spatial")));
console.log("domain service kit tests passed");
