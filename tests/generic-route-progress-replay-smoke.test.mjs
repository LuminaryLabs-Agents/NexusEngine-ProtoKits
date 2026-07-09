// Smoke signature: NexusEngine-generic-route-progress-replay::headless::2026-06-24
import { readFileSync } from "node:fs";
import { assert, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import { createGenericRouteProgressKit } from "../protokits/generic-route-progress-kit/index.js";
import { routeProgressReplayFixtures } from "./fixtures/generic-route-progress-replay-fixtures.mjs";

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
  return {
    route: engine.n.genericRouteProgress.getState(),
    active: engine.n.genericRouteProgress.getActiveCheckpoint(),
    descriptors: engine.n.genericRouteProgress.getDescriptors()
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

function runFixture(fixture) {
  const { kit, engine, world, tick } = installKit(createGenericRouteProgressKit, fixture.config);

  assert.equal(Boolean(kit.resources?.RouteProgressState), true, `${fixture.id}: exposes route-progress state resource`);
  assert.equal(Boolean(kit.events?.CheckpointCompleted), true, `${fixture.id}: exposes checkpoint completion event`);
  assert.equal(Array.isArray(kit.systems), true, `${fixture.id}: exposes fixed-tick system`);
  assert.equal(kit.metadata?.engineNamespace, "engine.n.genericRouteProgress", `${fixture.id}: declares namespaced DSK method surface`);
  assert.equal(Boolean(kit.metadata?.boundary), true, `${fixture.id}: declares DSK boundary metadata`);
  assert.equal(Boolean(engine.n?.genericRouteProgress), true, `${fixture.id}: installs engine.n generic-route-progress namespace`);

  const namespacedFacade = engine.n.genericRouteProgress;
  engine.genericRouteProgress = new Proxy({}, {
    get() {
      throw new Error(`${fixture.id}: replay must not use the broad route-progress facade after namespace sync`);
    }
  });
  assert.equal(engine.n.genericRouteProgress, namespacedFacade, `${fixture.id}: namespace remains stable after broad facade is poisoned`);

  for (const step of fixture.steps) {
    if (step.call) callEngine(engine, step.call, step.args ?? []);
    if (step.tick) runTicks(tick, step.tick);
  }

  const snapshot = snapshotFor(engine);
  const events = eventDigest(world, kit);
  assertExpectedEvents(events, fixture.expected?.eventCounts, fixture.id);
  assertExpectedPaths(snapshot, fixture.expected?.paths, fixture.id);

  assert.equal(snapshot.descriptors.every((descriptor) => descriptor.kind === "route-checkpoint"), true, `${fixture.id}: descriptors remain renderer-agnostic`);

  return { snapshot, events };
}

const source = readFileSync(new URL("../protokits/generic-route-progress-kit/index.js", import.meta.url), "utf8");
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
  assert.equal(source.includes(blockedToken), false, `generic-route-progress replay excludes ${blockedToken}`);
}

for (const fixture of routeProgressReplayFixtures) {
  const first = runFixture(fixture);
  const second = runFixture(fixture);
  assert.deepEqual(second, first, `${fixture.id}: fresh-run event/snapshot digest is deterministic`);
}
