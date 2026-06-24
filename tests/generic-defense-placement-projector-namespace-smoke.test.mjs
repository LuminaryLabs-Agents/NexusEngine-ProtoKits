// Smoke signature: NexusRealtime-generic-defense-placement-projector-namespace::headless::2026-06-24
import { assert, createMockNexusRealtime, createSmokeWorld } from "./aaa-domain-spine-smoke-harness.mjs";
import { createGenericPlacementProjectorKit } from "../protokits/generic-defense-presentation-stack-kit/index.js";
import {
  createGenericDefenseDskBundle,
  syncGenericDefenseDskEngineNamespace
} from "../protokits/generic-defense-dsk-boundaries/index.js";

const NexusRealtime = createMockNexusRealtime();
const defenseKits = createGenericDefenseDskBundle(NexusRealtime);
const projectorKit = createGenericPlacementProjectorKit(NexusRealtime);
const world = createSmokeWorld();
const engine = { clock: world.__nexusClock };

for (const kit of defenseKits) kit.initWorld?.({ world, engine });
for (const kit of defenseKits) kit.install?.({ world, engine });
projectorKit.install?.({ world, engine });

const namespace = syncGenericDefenseDskEngineNamespace(engine);
assert.equal(namespace, engine.n.genericDefense, "smoke uses the synced engine.n.genericDefense namespace");
assert.equal(typeof namespace.sessionFacade.build, "function", "session facade exposes semantic build through the namespace");
assert.equal(typeof namespace.sessionFacade.getSnapshot, "function", "session facade exposes snapshots through the namespace");

const initialSnapshot = namespace.sessionFacade.getSnapshot();
const slot = Object.values(initialSnapshot.map.slots)[0];
const blueprintId = initialSnapshot.level.buildOrder[0];
assert.equal(Boolean(slot?.id), true, "fixture exposes a valid build slot");
assert.equal(Boolean(initialSnapshot.structures.blueprints[blueprintId]), true, "fixture exposes a valid blueprint");

engine.genericDefense = {
  getSnapshot() {
    throw new Error("placement projector should prefer engine.n.genericDefense.sessionFacade.getSnapshot");
  },
  build() {
    throw new Error("placement projector should prefer engine.n.genericDefense.sessionFacade.build");
  }
};
engine.defenseBuild = {
  build() {
    throw new Error("placement projector should not prefer the broad defenseBuild compatibility facade");
  }
};

const begin = engine.placementProjector.begin(blueprintId);
assert.equal(begin.valid, false, "begin waits for a world point before confirming placement");
const moved = engine.placementProjector.moveTo({ x: slot.x, y: slot.y });
assert.equal(moved.valid, true, "projector validates placement from namespaced snapshot data");
assert.equal(moved.slotId, slot.id, "projector resolves the intended slot from the namespaced snapshot");

const confirmation = engine.placementProjector.confirm({ commandId: "placement-projector-namespace-smoke:build" });
assert.equal(confirmation.accepted, true, "projector confirms through the namespaced DSK session facade");

const nextSnapshot = namespace.sessionFacade.getSnapshot();
const structures = Object.values(nextSnapshot.structures.structures);
assert.equal(structures.length, 1, "namespaced build path creates one structure");
assert.equal(structures[0].slotId, slot.id, "built structure uses the projected slot");
assert.equal(structures[0].blueprintId, blueprintId, "built structure uses the selected blueprint");
assert.equal(nextSnapshot.economy.currency < initialSnapshot.economy.currency, true, "namespaced build path debits the wallet resource");

assert.equal(typeof globalThis.document, "undefined", "projector namespace smoke does not require DOM state");
assert.equal(typeof globalThis.HTMLCanvasElement, "undefined", "projector namespace smoke does not require Canvas state");
assert.equal(typeof globalThis.requestAnimationFrame, "undefined", "projector namespace smoke does not require browser frame timing");

console.log("Generic defense placement projector namespace smoke passed.");
