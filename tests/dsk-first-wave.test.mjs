import assert from "node:assert/strict";
import * as NexusRealtime from "nexusrealtime";
import {
  createNHazardDirectorKit,
  createNResourcePressureKit,
  createNRouteCheckpointKit,
  createNScanSurveyKit,
  createNTokenRegistryKit,
  createNZoneFieldKit,
  createScanSurveyKit
} from "../protokits/domain-foundation/index.js";
import {
  createCompletionLedgerKit,
  createNCompletionLedgerKit
} from "../protokits/domain-service-kits/index.js";

function assertSerializable(value) {
  assert.deepEqual(JSON.parse(JSON.stringify(value)), value);
}

const directScanKit = createNScanSurveyKit({ radius: 3 });
assert.equal(directScanKit.id, "n-scan-survey-kit");
assert.equal(directScanKit.metadata.kind, "domain-service-kit");
assert.equal(directScanKit.metadata.namespace, "n");
assert.equal(directScanKit.metadata.execution.mode, "linear");
assert.equal(directScanKit.metadata.execution.asyncReady, true);
assert.ok(directScanKit.provides.includes("n:scan-survey"));

const legacyScanKit = createScanSurveyKit(NexusRealtime, { radius: 3 });
assert.equal(legacyScanKit.id, "n-scan-survey-kit");
assert.ok(legacyScanKit.provides.includes("scan:survey"));

const completionLedgerKit = createNCompletionLedgerKit({ seed: "dsk-proof" });
assert.equal(completionLedgerKit.id, "n-completion-ledger-kit");
assert.ok(completionLedgerKit.provides.includes("n:completion-ledger"));

const engine = NexusRealtime.createRealtimeGame({
  kits: [
    createNZoneFieldKit(),
    directScanKit,
    createNRouteCheckpointKit(),
    createNResourcePressureKit(),
    createNHazardDirectorKit(),
    createNTokenRegistryKit(),
    completionLedgerKit
  ]
});

for (const key of ["zoneField", "scanSurvey", "routeCheckpoint", "resourcePressure", "hazardDirector", "tokenRegistry", "completionLedger"]) {
  assert.ok(engine.n[key], `engine.n.${key} should be installed`);
  assert.equal(engine.n[key], engine[key], `engine.${key} should remain as the compatibility API`);
}

engine.n.zoneField.registerZone({ id: "safe-zone", x: 0, y: 0, radius: 4 });
engine.n.zoneField.setEntityPosition("player", { x: 1, y: 0 });
engine.n.scanSurvey.registerTarget({ id: "relay-1", x: 2, y: 0, radius: 0.5, required: 1 });
engine.n.scanSurvey.pulse({ origin: { x: 0, y: 0 }, radius: 3, amount: 1, commandId: "scan-1" });
engine.n.routeCheckpoint.registerRoute({ id: "route-a", checkpoints: ["a", "b"] });
engine.n.routeCheckpoint.enter("a");
engine.n.resourcePressure.register({ id: "oxygen", value: 1, min: 0, max: 1, rate: -0.5 });
engine.n.hazardDirector.register({ id: "saw" });
engine.n.hazardDirector.activate("saw");
engine.n.tokenRegistry.set({ descriptors: { provides: ["n:scan-survey"] } });
engine.n.completionLedger.completeInteraction("relay-1");
engine.tick(0.25);

assert.deepEqual(engine.n.zoneField.sample({ x: 1, y: 0 }), ["safe-zone"]);
assert.deepEqual(engine.n.scanSurvey.getSnapshot().completedTargetIds, ["relay-1"]);
assert.equal(engine.n.routeCheckpoint.getSnapshot().progressByRouteId["route-a"], 1);
assert.equal(engine.n.resourcePressure.getSnapshot().resources.oxygen.value, 0.875);
assert.equal(engine.n.hazardDirector.getSnapshot().hazards.saw.active, true);
assert.deepEqual(engine.n.completionLedger.getSnapshot().domain.interaction.completed, ["relay-1"]);

for (const key of ["zoneField", "scanSurvey", "routeCheckpoint", "resourcePressure", "hazardDirector", "tokenRegistry", "completionLedger"]) {
  assertSerializable(engine.n[key].getSnapshot());
}

const needsMissingToken = NexusRealtime.defineDomainServiceKit({
  domain: "needs-missing",
  stability: "test",
  version: "0.0.0",
  requires: ["n:not-installed"]
});

assert.throws(
  () => NexusRealtime.createEngine({ kits: [needsMissingToken] }),
  /requires missing token\(s\): n:not-installed/
);

console.log("first-wave DSK migration tests passed");
