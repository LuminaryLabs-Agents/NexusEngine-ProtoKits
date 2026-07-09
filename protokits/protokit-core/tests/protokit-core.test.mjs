import assert from "node:assert/strict";
import {
  cloneSerializableState,
  createRealtimeGame,
  createScopedSeed,
  hashSeed
} from "nexusengine";
import {
  clamp as coreClamp,
  expSmoothingAlpha,
  lerp as coreLerp
} from "nexusengine/core-kits/core-utility-kit";
import {
  PROTOKIT_CORE_VERSION,
  approach,
  asList,
  byId,
  clamp,
  clone,
  createDefinitionFactory,
  createProtokitCore,
  createSeededRandom,
  defineInjectedRuntimeKit,
  distance2D,
  ensureResource,
  getClockDelta,
  getClockElapsed,
  hashString,
  lerp,
  number,
  scopedSeed,
  stableId,
  weightedChoice
} from "../index.js";

assert.equal(number("4", 0), 4);
assert.equal(number("not-a-number", 7), 7);
assert.equal(clamp(12, 0, 10), coreClamp(12, 0, 10));
assert.equal(lerp(2, 6, 0.5), coreLerp(2, 6, 0.5));
assert.equal(approach(2, 6, 3, 0.5), lerp(2, 6, expSmoothingAlpha(3, 0.5)));
assert.deepEqual(asList(null), []);
assert.deepEqual(asList("one"), ["one"]);
assert.deepEqual(clone({ nested: [1, 2] }), cloneSerializableState({ nested: [1, 2] }));
assert.equal(distance2D({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
assert.equal(getClockDelta({ __nexusClock: { delta: 1 } }), 0.1);
assert.equal(getClockElapsed({ __nexusClock: { elapsed: 4 } }), 4);
assert.equal(hashString("seed"), hashSeed("seed"));
assert.equal(scopedSeed("root", "child"), createScopedSeed("root", "child"));
assert.equal(stableId("item", "a"), stableId("item", "a"));
assert.deepEqual(byId([{ id: "a", value: 1 }, { id: "b", value: 2 }]), { a: { id: "a", value: 1 }, b: { id: "b", value: 2 } });

const first = createSeededRandom("repeat");
const second = createSeededRandom("repeat");
assert.deepEqual(Array.from({ length: 1000 }, () => first.next()), Array.from({ length: 1000 }, () => second.next()));
const weightedA = createSeededRandom("weighted");
const weightedB = createSeededRandom("weighted");
const choices = [{ id: "a", weight: 1 }, { id: "b", weight: 4 }];
assert.deepEqual(Array.from({ length: 1000 }, () => weightedChoice(choices, weightedA).id), Array.from({ length: 1000 }, () => weightedChoice(choices, weightedB).id));

const fallback = defineInjectedRuntimeKit({}, { id: "fallback", systems: [() => {}], provides: ["fallback:test"] });
assert.equal(fallback.id, "fallback");
assert.equal(fallback.systems[0].phase, "simulate");
const definitions = createDefinitionFactory({});
assert.deepEqual(definitions.resource("state"), { kind: "resource", name: "state" });

const resource = definitions.resource("resource");
const resources = new Map();
const world = {
  hasResource: (key) => resources.has(key),
  getResource: (key) => resources.get(key),
  setResource: (key, value) => resources.set(key, value)
};
assert.deepEqual(ensureResource(world, resource, () => ({ count: 1 })), { count: 1 });
assert.deepEqual(ensureResource(world, resource, () => ({ count: 2 })), { count: 1 });

const engine = createRealtimeGame({ kits: [createProtokitCore()] });
assert.equal(typeof engine.n.protokitCore.weightedChoice, "function");
assert.equal(engine.n.protokitCore, engine.protokitCore);
const snapshot = engine.n.protokitCore.getSnapshot();
assert.equal(snapshot.version, PROTOKIT_CORE_VERSION);
assert.deepEqual(engine.n.protokitCore.loadSnapshot(snapshot), snapshot);
assert.deepEqual(engine.n.protokitCore.reset(), snapshot);

console.log("protokit-core compatibility tests passed");
