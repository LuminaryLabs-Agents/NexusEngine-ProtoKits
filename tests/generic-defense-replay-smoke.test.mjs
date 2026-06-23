// Smoke signature: NexusRealtime-generic-defense-replay::headless::2026-06-23
import { assert, createMockNexusRealtime, createSmokeWorld } from "./aaa-domain-spine-smoke-harness.mjs";
import { createGenericDefenseKits } from "../protokits/generic-defense-kits/index.js";
import { genericDefenseReplayFixtures } from "./fixtures/generic-defense-replay-fixtures.mjs";

function installKits(factory, config = {}) {
  const NexusRealtime = createMockNexusRealtime();
  const kits = factory(NexusRealtime, config);
  assert.equal(Array.isArray(kits), true, "generic defense factory returns layered kits");

  const world = createSmokeWorld();
  const engine = { clock: world.__nexusClock };

  for (const kit of kits) kit.initWorld?.({ world, engine });
  for (const kit of kits) kit.install?.({ world, engine });

  function tick(dt = 1 / 60) {
    world.advance(dt);
    for (const kit of kits) {
      for (const system of kit.systems ?? []) system.system(world);
    }
  }

  return { NexusRealtime, kits, world, engine, tick };
}

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

function assertExpectedEvents(world, events, expectedEventCounts = {}, fixtureId) {
  for (const [eventName, count] of Object.entries(expectedEventCounts)) {
    assert.equal(
      world.getEvents(events[eventName]).length,
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

function countDescriptorKinds(renderState) {
  return (renderState?.descriptors ?? []).reduce((counts, descriptor) => {
    counts[descriptor.kind] = (counts[descriptor.kind] ?? 0) + 1;
    return counts;
  }, {});
}

function assertDescriptorKindCounts(renderState, expectedCounts = {}, fixtureId) {
  const counts = countDescriptorKinds(renderState);
  for (const [kind, count] of Object.entries(expectedCounts)) {
    assert.equal(counts[kind] ?? 0, count, `${fixtureId}: ${kind} descriptor count is deterministic`);
  }
}

function assertBoundaryShape(kits, fixtureId) {
  for (const kit of kits) {
    assert.equal(Boolean(kit.id), true, `${fixtureId}: every layered kit has an id`);
    assert.equal(Boolean(kit.resources && Object.keys(kit.resources).length), true, `${fixtureId}: ${kit.id} exposes resources`);
    assert.equal(Array.isArray(kit.systems), true, `${fixtureId}: ${kit.id} exposes fixed-tick systems`);
    assert.equal(String(kit.metadata?.purpose ?? "").length > 0, true, `${fixtureId}: ${kit.id} documents purpose`);
  }
}

for (const fixture of genericDefenseReplayFixtures) {
  const { kits, engine, world, tick } = installKits(createGenericDefenseKits, fixture.config);
  assertBoundaryShape(kits, fixture.id);
  assert.equal(Boolean(engine.genericDefense?.resources), true, `${fixture.id}: facade exposes resource handles`);
  assert.equal(Boolean(engine.genericDefense?.events), true, `${fixture.id}: facade exposes event handles`);

  for (const step of fixture.steps) {
    if (step.call) callEngine(engine, step.call, step.args ?? []);
    if (step.tick) runTicks(tick, step.tick);
  }

  const snapshot = engine.genericDefense.getSnapshot();
  assertExpectedEvents(world, engine.genericDefense.events, fixture.expected?.eventCounts, fixture.id);
  assertExpectedPaths(snapshot, fixture.expected?.paths, fixture.id);
  assertDescriptorKindCounts(snapshot.render, fixture.expected?.descriptorKindCounts, fixture.id);

  assert.equal(typeof globalThis.document, "undefined", `${fixture.id}: replay does not require DOM state`);
  assert.equal(typeof globalThis.HTMLCanvasElement, "undefined", `${fixture.id}: replay does not require Canvas state`);
}
