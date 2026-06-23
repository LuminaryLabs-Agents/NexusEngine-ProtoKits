// Smoke signature: NexusRealtime-generic-promotion-replay::headless::2026-06-23
import { assert, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import { createGenericPressureLoopKit } from "../protokits/generic-pressure-loop-kit/index.js";
import { createGenericResourceLoopKit } from "../protokits/generic-resource-loop-kit/index.js";
import { createGenericActionWindowKit } from "../protokits/generic-action-window-kit/index.js";
import { createGenericAffordanceDescriptorKit } from "../protokits/generic-affordance-descriptor-kit/index.js";
import { promotionReplayFixtures } from "./fixtures/generic-promotion-replay-fixtures.mjs";

const FACTORIES = Object.freeze({
  genericPressureLoop: createGenericPressureLoopKit,
  genericResourceLoop: createGenericResourceLoopKit,
  genericActionWindow: createGenericActionWindowKit,
  genericAffordanceDescriptor: createGenericAffordanceDescriptorKit
});

function getPath(value, path) {
  return String(path).split(".").reduce((current, part) => current?.[part], value);
}

function callEngine(engine, call, args = []) {
  const segments = String(call).split(".");
  const methodName = segments.pop();
  const host = segments.reduce((current, part) => current?.[part], engine);
  assert.equal(typeof host?.[methodName], "function", `${call} is available as a headless method`);
  return host[methodName](...args);
}

function runTicks(tick, tickSpec = {}) {
  const count = Math.max(0, Number(tickSpec.count ?? 1));
  const dt = Number.isFinite(Number(tickSpec.dt)) ? Number(tickSpec.dt) : 1 / 60;
  for (let i = 0; i < count; i += 1) tick(dt);
}

function snapshotFor(factoryName, engine) {
  if (factoryName === "genericPressureLoop") return { pressure: engine.genericPressureLoop.getState() };
  if (factoryName === "genericResourceLoop") return { resource: engine.genericResourceLoop.getState() };
  if (factoryName === "genericActionWindow") return { action: engine.genericActionWindow.getState() };
  if (factoryName === "genericAffordanceDescriptor") {
    return {
      affordance: engine.genericAffordances.getState(),
      available: {
        open: engine.genericAffordances.getAvailable("open")
      }
    };
  }
  throw new TypeError(`Unknown replay fixture factory: ${factoryName}`);
}

function assertExpectedEvents(world, kit, expectedEventCounts = {}, fixtureId) {
  for (const [eventName, count] of Object.entries(expectedEventCounts)) {
    assert.equal(
      world.getEvents(kit.events[eventName]).length,
      count,
      `${fixtureId}: ${eventName} count is deterministic`
    );
  }
}

function assertExpectedPaths(snapshot, expectedPaths = {}, fixtureId) {
  for (const [path, expected] of Object.entries(expectedPaths)) {
    const actual = getPath(snapshot, path);
    if (typeof expected === "number") {
      assert.equal(Number(Number(actual).toFixed(6)), expected, `${fixtureId}: ${path}`);
    } else {
      assert.deepEqual(actual, expected, `${fixtureId}: ${path}`);
    }
  }
}

for (const fixture of promotionReplayFixtures) {
  const factory = FACTORIES[fixture.factory];
  assert.equal(typeof factory, "function", `${fixture.id}: fixture maps to a ProtoKit factory`);
  const { kit, engine, world, tick } = installKit(factory, fixture.config);

  assert.equal(Boolean(kit.resources && Object.keys(kit.resources).length), true, `${fixture.id}: exposes headless resources`);
  assert.equal(Boolean(kit.events && Object.keys(kit.events).length), true, `${fixture.id}: exposes headless events`);
  assert.equal(Array.isArray(kit.systems), true, `${fixture.id}: exposes fixed-tick systems`);
  assert.equal(Boolean(kit.metadata?.boundary), true, `${fixture.id}: declares DSK boundary metadata`);

  for (const step of fixture.steps) {
    if (step.call) callEngine(engine, step.call, step.args ?? []);
    if (step.tick) runTicks(tick, step.tick);
  }

  assertExpectedEvents(world, kit, fixture.expected?.eventCounts, fixture.id);
  assertExpectedPaths(snapshotFor(fixture.factory, engine), fixture.expected?.paths, fixture.id);
}
