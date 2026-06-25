import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const matrixPath = path.join(repoRoot, "protokits", "kit-status-matrix.json");

assert.ok(fs.existsSync(matrixPath), "protokits/kit-status-matrix.json must exist");

const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));

assert.equal(
  matrix.schemaVersion,
  "nexusrealtime.protokits.kit-status-matrix.v1",
  "kit status matrix schema version must stay stable"
);
assert.ok(Array.isArray(matrix.classificationTypes), "classificationTypes must be an array");
assert.ok(Array.isArray(matrix.promotionStatuses), "promotionStatuses must be an array");
assert.ok(Array.isArray(matrix.entries), "entries must be an array");
assert.ok(matrix.entries.length >= 12, "matrix must cover the current high-signal ProtoKit families");

const allowedClassifications = new Set(matrix.classificationTypes);
const allowedStatuses = new Set(matrix.promotionStatuses);
const byId = new Map();

for (const entry of matrix.entries) {
  assert.equal(typeof entry.id, "string", "entry.id must be a string");
  assert.ok(entry.id.length > 0, "entry.id must not be empty");
  assert.ok(!byId.has(entry.id), `duplicate matrix entry: ${entry.id}`);
  byId.set(entry.id, entry);

  assert.ok(
    allowedClassifications.has(entry.classification),
    `${entry.id} has unknown classification ${entry.classification}`
  );
  assert.ok(
    allowedStatuses.has(entry.promotionStatus),
    `${entry.id} has unknown promotion status ${entry.promotionStatus}`
  );
  assert.equal(typeof entry.currentAction, "string", `${entry.id} must describe currentAction`);
  assert.equal(typeof entry.nextLedge, "string", `${entry.id} must describe nextLedge`);
  assert.equal(typeof entry.doNotDoNext, "string", `${entry.id} must describe doNotDoNext`);
}

for (const requiredId of [
  "generic-pressure-loop-kit",
  "generic-resource-loop-kit",
  "generic-action-window-kit",
  "generic-affordance-descriptor-kit",
  "generic-route-progress-kit",
  "generic-route-cargo-extraction-kit",
  "generic-defense-dsk-boundaries",
  "generic-defense-aaa-dsk-bridge",
  "generic-defense-session-command-kit",
  "vertical-climb-family",
  "arcade-race-family",
  "open-world-flight-family",
  "vr-platformer-kit-suite"
]) {
  assert.ok(byId.has(requiredId), `matrix must include ${requiredId}`);
}

const routeProgress = byId.get("generic-route-progress-kit");
assert.equal(routeProgress.classification, "atomic-dsk");
assert.ok(
  routeProgress.mustNotOwn.includes("cargo ledger"),
  "generic-route-progress-kit must not absorb cargo ledger state"
);
assert.ok(
  routeProgress.mustNotOwn.includes("DOM input"),
  "generic-route-progress-kit must stay renderer/browser independent"
);

const routeCargo = byId.get("generic-route-cargo-extraction-kit");
assert.equal(routeCargo.classification, "composite-dsk");
assert.equal(routeCargo.requiresDownstreamConsumption, true);
assert.notEqual(
  routeCargo.promotionStatus,
  "promotion-candidate-after-proof",
  "route-cargo extraction composite cannot be promotion-facing before downstream route consumption"
);

const defenseBoundaries = byId.get("generic-defense-dsk-boundaries");
assert.equal(defenseBoundaries.preferredNamespace, "engine.n.genericDefense");
assert.deepEqual(defenseBoundaries.children, [
  "map",
  "economyWallet",
  "buildPlacement",
  "waveAgentDirector",
  "combatResolver",
  "sessionFacade",
  "renderDescriptors"
]);

for (const broadId of [
  "generic-defense-aaa-dsk-bridge",
  "vertical-climb-family",
  "arcade-race-family",
  "open-world-flight-family",
  "vr-platformer-kit-suite"
]) {
  const entry = byId.get(broadId);
  assert.notEqual(
    entry.promotionStatus,
    "promotion-candidate-after-proof",
    `${broadId} must not be promotion-facing as a broad bundle`
  );
}

assert.equal(
  byId.get("vr-platformer-kit-suite").doNotPromoteAsBundle,
  true,
  "vr-platformer-kit-suite must stay on promotion hold as a suite"
);

console.log("kit-status-matrix-smoke passed");
