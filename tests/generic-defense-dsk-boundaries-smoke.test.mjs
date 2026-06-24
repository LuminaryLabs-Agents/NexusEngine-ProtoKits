// Smoke signature: NexusRealtime-generic-defense-dsk-boundaries::headless::2026-06-23
import { assert, createMockNexusRealtime, createSmokeWorld } from "./aaa-domain-spine-smoke-harness.mjs";
import {
  GENERIC_DEFENSE_DSK_BOUNDARIES,
  GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE,
  createGenericDefenseBuildPlacementDsk,
  createGenericDefenseCombatResolverDsk,
  createGenericDefenseDskBundle,
  createGenericDefenseEconomyWalletDsk,
  createGenericDefenseMapDsk,
  createGenericDefenseRenderDescriptorDsk,
  createGenericDefenseSessionFacadeDsk,
  createGenericDefenseWaveAgentDirectorDsk,
  getGenericDefenseDskBoundary,
  listGenericDefenseDskBoundaries,
  syncGenericDefenseDskEngineNamespace
} from "../protokits/generic-defense-dsk-boundaries/index.js";
import {
  GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE as GENERIC_DEFENSE_AAA_BRIDGE_DSK_ENGINE_NAMESPACE,
  createGenericDefenseAuthoringQaKit,
  createGenericDefenseBuildKit,
  createGenericDefenseDskBundle as createGenericDefenseAaaBridgeDskBundle,
  createGenericDefenseKits as createGenericDefenseAaaBridgeKits,
  createGenericDefenseMapDsk as createGenericDefenseAaaBridgeMapDsk,
  listGenericDefenseDskBoundaries as listGenericDefenseAaaBridgeDskBoundaries,
  syncGenericDefenseDskEngineNamespace as syncGenericDefenseAaaBridgeDskEngineNamespace
} from "../protokits/generic-defense-aaa-dsk-bridge/index.js";

const expectedBoundaryIds = [
  "map",
  "economyWallet",
  "buildPlacement",
  "waveAgentDirector",
  "combatResolver",
  "sessionFacade",
  "renderDescriptors"
];

assert.equal(
  GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE,
  "genericDefense",
  "generic defense DSKs expose a stable engine.n domain namespace"
);

assert.equal(
  GENERIC_DEFENSE_AAA_BRIDGE_DSK_ENGINE_NAMESPACE,
  GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE,
  "AAA DSK bridge re-exports the same engine.n domain namespace"
);

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

assert.deepEqual(
  listGenericDefenseAaaBridgeDskBoundaries().map((boundary) => boundary.id),
  expectedBoundaryIds,
  "AAA DSK bridge exposes the same pruned boundary list while preserving the compatibility facade"
);

for (const boundary of GENERIC_DEFENSE_DSK_BOUNDARIES) {
  assert.equal(getGenericDefenseDskBoundary(boundary.id), boundary, `${boundary.id}: lookup returns boundary descriptor`);
  assert.equal(Boolean(boundary.exportName), true, `${boundary.id}: boundary has export name`);
  assert.equal(Boolean(boundary.kitId), true, `${boundary.id}: boundary has backing kit id`);
  assert.equal(Array.isArray(boundary.resources), true, `${boundary.id}: resources are explicit`);
  assert.equal(Array.isArray(boundary.events), true, `${boundary.id}: events are explicit`);
  assert.equal(Array.isArray(boundary.methods), true, `${boundary.id}: methods are explicit`);
  assert.equal(boundary.methods.some((method) => method.startsWith("engine.n.genericDefense.")), true, `${boundary.id}: methods include pruned engine.n namespace alias`);
  assert.equal(Array.isArray(boundary.snapshots), true, `${boundary.id}: snapshots are explicit`);
  assert.equal(Array.isArray(boundary.descriptors), true, `${boundary.id}: descriptors are explicit`);
  assert.equal(String(boundary.boundary).length > 0, true, `${boundary.id}: boundary is documented`);
}

const individualFactories = [
  ["generic-defense-map-kit", "map", createGenericDefenseMapDsk],
  ["generic-defense-economy-kit", "economyWallet", createGenericDefenseEconomyWalletDsk],
  ["generic-defense-structure-kit", "buildPlacement", createGenericDefenseBuildPlacementDsk],
  ["generic-defense-agent-wave-kit", "waveAgentDirector", createGenericDefenseWaveAgentDirectorDsk],
  ["generic-defense-combat-kit", "combatResolver", createGenericDefenseCombatResolverDsk],
  ["generic-defense-session-kit", "sessionFacade", createGenericDefenseSessionFacadeDsk],
  ["generic-defense-render-descriptor-kit", "renderDescriptors", createGenericDefenseRenderDescriptorDsk]
];

for (const [kitId, boundaryId, factory] of individualFactories) {
  const kit = factory(createMockNexusRealtime());
  assert.equal(kit.id, kitId, `${kitId}: individual DSK alias returns the backing kit`);
  assert.equal(Boolean(kit.metadata?.dskBoundary), true, `${kitId}: individual alias annotates DSK boundary metadata`);
  assert.equal(Boolean(kit.metadata?.apiSurface), true, `${kitId}: individual alias annotates API surface metadata`);
  assert.equal(kit.metadata?.engineNamespace, `engine.n.genericDefense.${boundaryId}`, `${kitId}: individual alias annotates pruned engine namespace`);
}

const bridgeMapKit = createGenericDefenseAaaBridgeMapDsk(createMockNexusRealtime());
assert.equal(bridgeMapKit.id, "generic-defense-map-kit", "AAA DSK bridge keeps the map DSK alias available beside the broad compatibility facade");
assert.equal(Boolean(bridgeMapKit.metadata?.apiSurface), true, "AAA DSK bridge annotates atomic DSK API surface metadata");

const bridgeCompatibilityKits = createGenericDefenseAaaBridgeKits(createMockNexusRealtime());
assert.equal(
  bridgeCompatibilityKits.some((kit) => kit.id === "generic-defense-build-kit"),
  true,
  "AAA DSK bridge keeps the existing broad build facade available for compatibility hosts"
);
assert.equal(
  createGenericDefenseBuildKit(createMockNexusRealtime()).id,
  "generic-defense-build-kit",
  "AAA DSK bridge directly exports the compatibility build facade"
);
assert.equal(
  createGenericDefenseAuthoringQaKit(createMockNexusRealtime()).id,
  "generic-defense-authoring-qa-kit",
  "AAA DSK bridge directly exports the compatibility authoring QA facade"
);
assert.deepEqual(
  createGenericDefenseAaaBridgeDskBundle(createMockNexusRealtime(), {}, ["map", "renderDescriptors"]).map((kit) => kit.id),
  ["generic-defense-map-kit", "generic-defense-render-descriptor-kit"],
  "AAA DSK bridge can return the smallest requested DSK subset without forcing the broad compatibility bundle"
);

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

const namespace = engine.n?.genericDefense;
assert.equal(namespace, syncGenericDefenseDskEngineNamespace(engine), "namespace sync returns the existing engine.n.genericDefense object");
assert.equal(namespace, syncGenericDefenseAaaBridgeDskEngineNamespace(engine), "AAA bridge namespace sync returns the same engine.n.genericDefense object");
assert.equal(typeof namespace.map.getState, "function", "map DSK is mirrored under engine.n.genericDefense.map");
assert.equal(typeof namespace.economyWallet.credit, "function", "economy DSK is mirrored under engine.n.genericDefense.economyWallet");
assert.equal(typeof namespace.buildPlacement.build, "function", "build-placement DSK is mirrored under engine.n.genericDefense.buildPlacement");
assert.equal(typeof namespace.waveAgentDirector.startWave, "function", "wave-agent DSK is mirrored under engine.n.genericDefense.waveAgentDirector");
assert.equal(typeof namespace.combatResolver.getState, "function", "combat DSK is mirrored under engine.n.genericDefense.combatResolver");
assert.equal(typeof namespace.sessionFacade.getSnapshot, "function", "session facade DSK is mirrored under engine.n.genericDefense.sessionFacade");
assert.equal(typeof namespace.renderDescriptors.getSnapshot, "function", "render descriptor DSK is mirrored under engine.n.genericDefense.renderDescriptors");
assert.equal(namespace.resources, engine.genericDefense.resources, "session facade resources stay discoverable from the pruned namespace");
assert.equal(namespace.events, engine.genericDefense.events, "session facade events stay discoverable from the pruned namespace");

namespace.sessionFacade.build("slot-a", "bolt", { commandId: "boundary-smoke:build" });
namespace.sessionFacade.startWave({ commandId: "boundary-smoke:start" });
for (let i = 0; i < 4; i += 1) {
  world.advance(0.25);
  for (const kit of kits) {
    for (const system of kit.systems ?? []) system.system(world);
  }
}

const snapshot = namespace.sessionFacade.getSnapshot();
assert.equal(snapshot.map.vital.id, "core", "snapshot keeps vital target state renderer-agnostic");
assert.equal(snapshot.economy.currency < 130, true, "wallet state reflects build debit through DSK events");
assert.equal(Object.keys(snapshot.structures.structures).length, 1, "build-placement state owns structure runtime data");
assert.equal(snapshot.agents.waveActive, true, "wave-agent director owns wave state");
assert.equal(Array.isArray(namespace.renderDescriptors.getSnapshot().descriptors), true, "render DSK exposes descriptors instead of DOM rendering");
assert.equal(typeof globalThis.document, "undefined", "boundary smoke does not require DOM state");
assert.equal(typeof globalThis.HTMLCanvasElement, "undefined", "boundary smoke does not require Canvas state");
