// Smoke signature: NexusRealtime-generic-defense-dsk-boundaries::headless::2026-06-23
import { assert, createMockNexusRealtime, createSmokeWorld } from "./aaa-domain-spine-smoke-harness.mjs";
import {
  GENERIC_DEFENSE_DSK_BOUNDARIES,
  createGenericDefenseBuildPlacementDsk,
  createGenericDefenseCombatResolverDsk,
  createGenericDefenseDskBundle,
  createGenericDefenseEconomyWalletDsk,
  createGenericDefenseMapDsk,
  createGenericDefenseRenderDescriptorDsk,
  createGenericDefenseSessionFacadeDsk,
  createGenericDefenseWaveAgentDirectorDsk,
  getGenericDefenseDskBoundary,
  listGenericDefenseDskBoundaries
} from "../protokits/generic-defense-dsk-boundaries/index.js";

const expectedBoundaryIds = [
  "map",
  "economyWallet",
  "buildPlacement",
  "waveAgentDirector",
  "combatResolver",
  "sessionFacade",
  "renderDescriptors"
];

assert.deepEqual(
  GENERIC_DEFENSE_DSK_BOUNDARIES.map((boundary) => boundary.id),
  expectedBoundaryIds,
  "generic defense composite is pruned into named atomic DSK boundaries"
);

assert.deepEqual(
  listGenericDefenseDskBoundaries().map((boundary) => boundary.id),
  expectedBoundaryIds,
  "boundary list helper exposes the same stable order"
);

for (const boundary of GENERIC_DEFENSE_DSK_BOUNDARIES) {
  assert.equal(getGenericDefenseDskBoundary(boundary.id), boundary, `${boundary.id}: lookup returns boundary descriptor`);
  assert.equal(Boolean(boundary.exportName), true, `${boundary.id}: boundary has export name`);
  assert.equal(Boolean(boundary.kitId), true, `${boundary.id}: boundary has backing kit id`);
  assert.equal(Array.isArray(boundary.resources), true, `${boundary.id}: resources are explicit`);
  assert.equal(Array.isArray(boundary.events), true, `${boundary.id}: events are explicit`);
  assert.equal(Array.isArray(boundary.methods), true, `${boundary.id}: methods are explicit`);
  assert.equal(Array.isArray(boundary.snapshots), true, `${boundary.id}: snapshots are explicit`);
  assert.equal(Array.isArray(boundary.descriptors), true, `${boundary.id}: descriptors are explicit`);
  assert.equal(String(boundary.boundary).length > 0, true, `${boundary.id}: boundary is documented`);
}

const individualFactories = [
  ["generic-defense-map-kit", createGenericDefenseMapDsk],
  ["generic-defense-economy-kit", createGenericDefenseEconomyWalletDsk],
  ["generic-defense-structure-kit", createGenericDefenseBuildPlacementDsk],
  ["generic-defense-agent-wave-kit", createGenericDefenseWaveAgentDirectorDsk],
  ["generic-defense-combat-kit", createGenericDefenseCombatResolverDsk],
  ["generic-defense-session-kit", createGenericDefenseSessionFacadeDsk],
  ["generic-defense-render-descriptor-kit", createGenericDefenseRenderDescriptorDsk]
];

for (const [kitId, factory] of individualFactories) {
  const kit = factory(createMockNexusRealtime());
  assert.equal(kit.id, kitId, `${kitId}: individual DSK alias returns the backing kit`);
  assert.equal(Boolean(kit.metadata?.dskBoundary), true, `${kitId}: individual alias annotates DSK boundary metadata`);
  assert.equal(Boolean(kit.metadata?.apiSurface), true, `${kitId}: individual alias annotates API surface metadata`);
}

const NexusRealtime = createMockNexusRealtime();
const kits = createGenericDefenseDskBundle(NexusRealtime, {}, expectedBoundaryIds);
assert.deepEqual(kits.map((kit) => kit.id), individualFactories.map(([kitId]) => kitId), "bundle selector preserves layered kit order");

const world = createSmokeWorld();
const engine = { clock: world.__nexusClock };
for (const kit of kits) kit.initWorld?.({ world, engine });
for (const kit of kits) kit.install?.({ world, engine });

assert.equal(typeof engine.defenseMap.getState, "function", "map DSK exposes a small headless method surface");
assert.equal(typeof engine.defenseEconomy.credit, "function", "economy DSK exposes a wallet method surface");
assert.equal(typeof engine.defenseStructures.build, "function", "build-placement DSK exposes semantic build method");
assert.equal(typeof engine.defenseAgents.startWave, "function", "wave-agent DSK exposes semantic start method");
assert.equal(typeof engine.defenseCombat.getState, "function", "combat DSK exposes state snapshot method");
assert.equal(typeof engine.genericDefense.getSnapshot, "function", "session facade exposes cumulative snapshot method");
assert.equal(typeof engine.defenseRender.getSnapshot, "function", "render descriptor DSK exposes descriptor snapshot method");

engine.genericDefense.build("slot-a", "bolt", { commandId: "boundary-smoke:build" });
engine.genericDefense.startWave({ commandId: "boundary-smoke:start" });
for (let i = 0; i < 4; i += 1) {
  world.advance(0.25);
  for (const kit of kits) {
    for (const system of kit.systems ?? []) system.system(world);
  }
}

const snapshot = engine.genericDefense.getSnapshot();
assert.equal(snapshot.map.vital.id, "core", "snapshot keeps vital target state renderer-agnostic");
assert.equal(snapshot.economy.currency < 130, true, "wallet state reflects build debit through DSK events");
assert.equal(Object.keys(snapshot.structures.structures).length, 1, "build-placement state owns structure runtime data");
assert.equal(snapshot.agents.waveActive, true, "wave-agent director owns wave state");
assert.equal(Array.isArray(snapshot.render.descriptors), true, "render DSK exposes descriptors instead of DOM rendering");
assert.equal(typeof globalThis.document, "undefined", "boundary smoke does not require DOM state");
assert.equal(typeof globalThis.HTMLCanvasElement, "undefined", "boundary smoke does not require Canvas state");
