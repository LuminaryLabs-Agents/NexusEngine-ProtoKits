import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMockNexusEngine, createSmokeWorld } from "../../../tests/aaa-domain-spine-smoke-harness.mjs";
import { classifySurfaceOrientation, createSpatialSurfaceCandidateDomainKit, normalizeSurfaceObservation } from "../index.js";

function createHarness() {
  const runtime = createMockNexusEngine();
  const NexusEngine = {
    ...runtime,
    defineDomainServiceKit(spec) {
      return {
        ...spec,
        metadata: {
          ...spec.metadata,
          kind: "domain-service-kit",
          namespace: "n",
          domain: spec.domain,
          domainPath: spec.domainPath,
          parentDomainPath: spec.parentDomainPath,
          apiName: spec.apiName,
          stability: spec.stability,
          version: spec.version
        },
        install(context) {
          context.engine.n ??= {};
          context.engine.n[spec.apiName] = spec.createApi(context);
        }
      };
    }
  };
  const world = createSmokeWorld();
  const engine = {};
  const kit = createSpatialSurfaceCandidateDomainKit(NexusEngine, { stableFramesRequired: 3, minConfidence: 0.7, preferredOrientations: ["vertical", "horizontal-up"] });
  kit.initWorld({ engine, world, kit });
  kit.install({ engine, world, kit });
  return { kit, world, engine };
}

function runScenario() {
  const { kit, world, engine } = createHarness();
  for (let index = 0; index < 3; index += 1) {
    world.advance(1 / 60);
    engine.n.spatialSurfaceCandidate.observe({ id: "wall-a", position: { x: 0.01 * index, y: 1.2, z: -1.5 }, normal: { z: 1 }, confidence: 0.92, source: "webxr-hit-test" });
  }
  engine.n.spatialSurfaceCandidate.select();
  engine.n.spatialSurfaceCandidate.observe({ id: "bad", normal: {} });
  return { kit, engine, snapshot: engine.n.spatialSurfaceCandidate.getSnapshot() };
}

assert.equal(classifySurfaceOrientation({ y: 1 }), "horizontal-up");
assert.equal(classifySurfaceOrientation({ z: 1 }), "vertical");
assert.equal(normalizeSurfaceObservation({ id: "wall", position: {}, normal: { z: 1 } }).orientation, "vertical");

const first = runScenario();
assert.equal(first.kit.metadata.domain, "spatial-surface-candidate");
assert.equal(first.kit.metadata.status, "experimental");
assert.equal(first.engine.n.spatialSurfaceCandidate.getStableCandidates().length, 1);
assert.equal(first.snapshot.selectedCandidateId, "wall-a");
assert.equal(first.snapshot.rejections.at(-1).reason, "invalid-observation");
assert.equal(first.engine.n.spatialSurfaceCandidate.getDescriptors()[0].kind, "spatial-surface-candidate");

const second = runScenario();
assert.deepEqual(second.snapshot, first.snapshot, "same observations produce the same snapshot");
first.engine.n.spatialSurfaceCandidate.reset({ reason: "test" });
assert.equal(first.engine.n.spatialSurfaceCandidate.getSnapshot().candidateIds.length, 0);
first.engine.n.spatialSurfaceCandidate.loadSnapshot(first.snapshot);
assert.deepEqual(first.engine.n.spatialSurfaceCandidate.getSnapshot(), first.snapshot, "snapshot restores without feature loss");

const source = readFileSync(new URL("../index.js", import.meta.url), "utf8");
for (const forbidden of ["document.", "window.", "requestAnimationFrame", "Date.now", "Math.random", "new THREE", "getContext("]) {
  assert.equal(source.includes(forbidden), false, `source excludes ${forbidden}`);
}

console.log("spatial-surface-candidate-domain-kit: ok");
