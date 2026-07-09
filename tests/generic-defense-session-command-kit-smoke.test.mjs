// Smoke signature: NexusEngine-generic-defense-session-command-kit::headless::2026-06-24
import { readFileSync } from "node:fs";
import { assert, createMockNexusEngine, createSmokeWorld } from "./aaa-domain-spine-smoke-harness.mjs";
import { createGenericDefenseDskBundle } from "../protokits/generic-defense-dsk-boundaries/index.js";
import {
  GENERIC_DEFENSE_SESSION_COMMAND_ENGINE_NAMESPACE,
  createGenericDefenseSessionCommandKit
} from "../protokits/generic-defense-session-command-kit/index.js";

const NexusEngine = createMockNexusEngine();
const boundaryIds = [
  "map",
  "economyWallet",
  "buildPlacement",
  "waveAgentDirector",
  "combatResolver",
  "sessionFacade",
  "renderDescriptors"
];
const kits = [
  ...createGenericDefenseDskBundle(NexusEngine, {}, boundaryIds),
  createGenericDefenseSessionCommandKit(NexusEngine)
];

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

assert.equal(GENERIC_DEFENSE_SESSION_COMMAND_ENGINE_NAMESPACE, "genericDefense", "session commands share the generic-defense engine.n namespace");
assert.equal(typeof engine.n?.genericDefense?.sessionCommands?.setBlueprint, "function", "session command kit exposes a namespaced setBlueprint command surface");
assert.equal(typeof engine.n?.genericDefense?.sessionCommands?.sell, "function", "session command kit exposes a namespaced sell command surface");
assert.equal(typeof engine.n?.genericDefense?.sessionFacade?.setBlueprint, "function", "session command kit extends the existing session facade boundary");
assert.equal(typeof engine.n?.genericDefense?.sessionFacade?.sell, "function", "sell is available through the route-facing session facade boundary");
assert.equal(kits.at(-1).metadata?.dskBoundary?.id, "sessionCommands", "session command kit declares its DSK boundary metadata");
assert.deepEqual(kits.at(-1).metadata?.apiSurface?.descriptors, [], "session command kit remains renderer-agnostic and descriptor-free");

const blueprintResult = engine.n.genericDefense.sessionFacade.setBlueprint("ember", { commandId: "session-command:set-blueprint" });
assert.equal(blueprintResult.accepted, true, "setBlueprint accepts a known blueprint");
assert.equal(engine.n.genericDefense.sessionFacade.getSnapshot().session.blueprintId, "ember", "setBlueprint updates session state through reusable resources");

const unknownBlueprint = engine.n.genericDefense.sessionFacade.setBlueprint("missing-blueprint", { commandId: "session-command:missing" });
assert.equal(unknownBlueprint.accepted, false, "setBlueprint rejects an unknown blueprint");
assert.equal(unknownBlueprint.reason, "unknown-blueprint", "setBlueprint rejection is explicit and reusable");

engine.n.genericDefense.sessionFacade.build("slot-a", "ember", { commandId: "session-command:build" });
tick();
tick();
const builtSnapshot = engine.n.genericDefense.sessionFacade.getSnapshot();
const builtStructures = Object.values(builtSnapshot.structures.structures ?? {});
assert.equal(builtStructures.length, 1, "build command creates one reusable structure before sell");
assert.equal(builtStructures[0].blueprintId, "ember", "build consumes the blueprint selected by the host command path");
const currencyAfterBuild = builtSnapshot.economy.currency;

const sellResult = engine.n.genericDefense.sessionFacade.sell(builtStructures[0].id, { commandId: "session-command:sell" });
assert.equal(sellResult.accepted, true, "sell accepts an existing structure through the namespaced session facade");
assert.equal(sellResult.refund > 0, true, "sell computes a reusable economy refund without route-local JavaScript");
assert.equal(Object.keys(engine.n.genericDefense.sessionFacade.getSnapshot().structures.structures ?? {}).length, 0, "sell removes structure runtime state immediately");
const duplicateSell = engine.n.genericDefense.sessionFacade.sell(builtStructures[0].id, { commandId: "session-command:sell" });
assert.equal(duplicateSell.duplicate, true, "sell command IDs are deterministic and idempotent");
tick();
assert.equal(
  engine.n.genericDefense.sessionFacade.getSnapshot().economy.currency > currencyAfterBuild,
  true,
  "sell refund is applied through the reusable economy event/resource boundary"
);

const source = readFileSync("protokits/generic-defense-session-command-kit/index.js", "utf8");
for (const forbidden of [
  "Date.now",
  "Math.random",
  "crypto.getRandomValues",
  "document.",
  "window.",
  "HTMLCanvasElement",
  "WebGL",
  "requestAnimationFrame",
  "performance.now",
  "AudioContext"
]) {
  assert.doesNotMatch(source, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `session command kit should not use ${forbidden}`);
}

assert.equal(typeof globalThis.document, "undefined", "session command smoke does not require DOM state");
assert.equal(typeof globalThis.HTMLCanvasElement, "undefined", "session command smoke does not require Canvas state");

console.log("Generic defense session command kit smoke passed.");
