import assert from "node:assert/strict";
import {
  GENERIC_DEFENSE_AAA_KITS_VERSION,
  createGenericDefenseFoundationKit,
  createGenericDefenseWorldKit,
  createGenericDefenseBuildKit,
  createGenericDefenseCombatKit,
  createGenericDefenseAgentKit,
  createGenericDefenseWaveKit,
  createGenericDefenseEconomyKit,
  createGenericDefenseAbilityKit,
  createGenericDefenseObjectiveKit,
  createGenericDefensePresentationKit,
  createGenericDefenseScaleKit,
  createGenericDefenseAuthoringQaKit
} from "../index.js";

function createMiniRuntime() {
  return {
    defineRuntimeKit(config) { return config; }
  };
}

const NexusEngine = createMiniRuntime();
const factories = [
  createGenericDefenseFoundationKit,
  createGenericDefenseAuthoringQaKit,
  createGenericDefenseWorldKit,
  createGenericDefenseEconomyKit,
  createGenericDefenseBuildKit,
  createGenericDefenseAgentKit,
  createGenericDefenseWaveKit,
  createGenericDefenseCombatKit,
  createGenericDefenseAbilityKit,
  createGenericDefenseObjectiveKit,
  createGenericDefenseScaleKit,
  createGenericDefensePresentationKit
];

assert.equal(GENERIC_DEFENSE_AAA_KITS_VERSION, "0.2.0");
for (const factory of factories) {
  const kit = factory(NexusEngine, {});
  assert.ok(kit.id, "kit has id");
  assert.ok(Array.isArray(kit.provides), `${kit.id} has provides`);
  assert.equal(typeof kit.install, "function", `${kit.id} has install`);
}

console.log("generic-defense-aaa-kits smoke passed");
