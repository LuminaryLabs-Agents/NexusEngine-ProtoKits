// Smoke signature: NexusEngine-generic-route-cargo-extraction-replay::headless::2026-06-24
import { readFileSync } from "node:fs";
import { assert, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import { createGenericRouteCargoExtractionKit } from "../protokits/generic-route-cargo-extraction-kit/index.js";
import { routeCargoExtractionReplayFixtures } from "./fixtures/generic-route-cargo-extraction-replay-fixtures.mjs";

function getPath(value, path) {
  return String(path).split(".").reduce((current, part) => current?.[part], value);
}

function callEngine(engine, call, args = []) {
  const segments = String(call).split(".");
  const methodName = segments.pop();
  const host = segments.reduce((current, part) => current?.[part], engine);
  assert.equal(typeof host?.[methodName], "function", `${call} is available as a namespaced headless method`);
  return host[methodName](...args);
}

function runTicks(tick, tickSpec = {}) {
  const count = Math.max(0, Number(tickSpec.count ?? 1));
  const dt = Number.isFinite(Number(tickSpec.dt)) ? Number(tickSpec.dt) : 1 / 60;
  for (let index = 0; index < count; index += 1) tick(dt);
}

function snapshotFor(engine) {
  const snapshot = engine.n.genericRouteCargoExtraction.getSnapshot();
  return {
    snapshot,
    route: engine.n.genericRouteProgress.getState(),
    cargo: engine.n.genericResourceLoop.getState(),
    pressure: engine.n.genericPressureLoop.getState(),
    descriptors: engine.n.genericRouteCargoExtraction.getDescriptors()
  };
}

function eventDigest(world, kit) {
  return Object.fromEntries(
    Object.entries(kit.events).map(([eventName, event]) => [eventName, world.getEvents(event)])
  );
}

function assertExpectedEvents(events, expectedEventCounts = {}, fixtureId) {
  for (const [eventName, count] of Object.entries(expectedEventCounts)) {
    assert.equal(events[eventName]?.length ?? 0, count, `${fixtureId}: ${eventName} count is deterministic`);
  }
}

function assertExpectedPaths(snapshot, expectedPaths = {}, fixtureId) {
  for (const [path, expected] of Object.entries(expectedPaths)) {
    assert.deepEqual(getPath(snapshot, path), expected, `${fixtureId}: ${path}`);
  }
}

function poisonBroadFacades(engine, fixtureId) {
  for (const broadFacade of [
    "genericRouteCargoExtraction",
    "genericRouteProgress",
    "genericResourceLoop",
    "genericPressureLoop"
  ]) {
    engine[broadFacade] = new Proxy({}, {
      get() {
        throw new Error(`${fixtureId}: replay must not use broad ${broadFacade} after namespace sync`);
      }
    });
  }
}

function runFixture(fixture) {
  const { kit, engine, world, tick } = installKit(createGenericRouteCargoExtractionKit, fixture.config);

  assert.equal(Boolean(kit.resources?.RouteCargoExtractionState), true, `${fixture.id}: exposes route-cargo state resource`);
  assert.equal(Boolean(kit.events?.CargoChanged), true, `${fixture.id}: exposes cargo change event`);
  assert.equal(Boolean(kit.events?.PressureChanged), true, `${fixture.id}: exposes pressure change event`);
  assert.equal(Array.isArray(kit.systems), true, `${fixture.id}: exposes fixed-tick systems`);
  assert.equal(kit.metadata?.domain, "route-cargo-extraction", `${fixture.id}: declares composite domain metadata`);
  assert.equal(kit.metadata?.ownsLoop, false, `${fixture.id}: does not own the host/browser loop`);
  assert.deepEqual(kit.metadata?.composes, ["generic-route-progress-kit", "generic-resource-loop-kit", "generic-pressure-loop-kit"], `${fixture.id}: composes atomic child DSKs`);
  assert.equal(Boolean(kit.metadata?.boundary), true, `${fixture.id}: declares DSK boundary metadata`);
  assert.equal(Boolean(engine.n?.genericRouteCargoExtraction), true, `${fixture.id}: installs route-cargo namespace`);
  assert.equal(Boolean(engine.n?.genericRouteProgress), true, `${fixture.id}: installs route-progress namespace`);
  assert.equal(Boolean(engine.n?.genericResourceLoop), true, `${fixture.id}: installs resource namespace`);
  assert.equal(Boolean(engine.n?.genericPressureLoop), true, `${fixture.id}: installs pressure namespace`);

  const namespace = engine.n.genericRouteCargoExtraction;
  poisonBroadFacades(engine, fixture.id);
  assert.equal(engine.n.genericRouteCargoExtraction, namespace, `${fixture.id}: namespace remains stable after broad facades are poisoned`);

  for (const step of fixture.steps) {
    if (step.call) callEngine(engine, step.call, step.args ?? []);
    if (step.tick) runTicks(tick, step.tick);
  }

  const snapshot = snapshotFor(engine);
  const events = eventDigest(world, kit);
  assertExpectedEvents(events, fixture.expected?.eventCounts, fixture.id);
  assertExpectedPaths(snapshot, fixture.expected?.paths, fixture.id);

  const descriptorKinds = new Set(snapshot.descriptors.map((descriptor) => descriptor.kind));
  assert.equal(descriptorKinds.has("route-checkpoint"), true, `${fixture.id}: route descriptors stay renderer-agnostic`);
  assert.equal(descriptorKinds.has("cargo-resource"), true, `${fixture.id}: cargo descriptors stay renderer-agnostic`);
  assert.equal(descriptorKinds.has("extraction-pressure-channel"), true, `${fixture.id}: pressure descriptors stay renderer-agnostic`);
  assert.equal(snapshot.descriptors.some((descriptor) => descriptor.higherDomain === "route-cargo-extraction"), true, `${fixture.id}: route descriptors identify the composite higher domain`);

  return { snapshot, events };
}

const source = readFileSync(new URL("../protokits/generic-route-cargo-extraction-kit/index.js", import.meta.url), "utf8");
for (const blockedToken of [
  "Date.now",
  "performance.now",
  "Math.random",
  "crypto.getRandomValues",
  "requestAnimationFrame",
  "document.",
  "window.",
  "HTMLCanvasElement",
  "WebGL",
  "AudioContext",
  "pointerLockElement"
]) {
  assert.equal(source.includes(blockedToken), false, `generic-route-cargo-extraction replay excludes ${blockedToken}`);
}

for (const fixture of routeCargoExtractionReplayFixtures) {
  const first = runFixture(fixture);
  const second = runFixture(fixture);
  assert.deepEqual(second, first, `${fixture.id}: fresh-run event/snapshot digest is deterministic`);
}

console.log("generic route cargo extraction replay smoke passed");
