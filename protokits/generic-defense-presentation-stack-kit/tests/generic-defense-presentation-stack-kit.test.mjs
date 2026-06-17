import assert from "node:assert/strict";
import {
  GENERIC_DEFENSE_PRESENTATION_STACK_VERSION,
  createGenericDefensePresentationStackKits,
  createGenericStylizedViewRigKit,
  createGenericCelMaterialKit,
  createGenericInkOutlineKit,
  createGenericDefensePresentationStackKit
} from "../index.js";

const NexusRealtime = {
  defineRuntimeKit(config) { return config; }
};

assert.equal(GENERIC_DEFENSE_PRESENTATION_STACK_VERSION, "0.1.0");

const stack = createGenericDefensePresentationStackKits(NexusRealtime);
assert.equal(stack.length, 19, "all presentation child kits plus stack kit are created");
assert.equal(stack.at(-1).id, "generic-defense-presentation-stack-kit");

const requiredIds = [
  "generic-stylized-view-rig-kit",
  "generic-cel-material-kit",
  "generic-ink-outline-kit",
  "generic-stylized-lighting-kit",
  "generic-defense-ground-readability-kit",
  "generic-placement-projector-kit",
  "generic-range-ring-kit",
  "generic-defense-unit-render-kit",
  "generic-tower-identity-layer-kit",
  "generic-enemy-readability-layer-kit",
  "generic-combat-vfx-kit",
  "generic-hit-feedback-kit",
  "generic-layered-hud-shell-kit",
  "generic-gameplay-stat-strip-kit",
  "generic-tower-selection-panel-kit",
  "generic-upgrade-tree-panel-kit",
  "generic-selection-context-panel-kit",
  "generic-ui-motion-polish-kit",
  "generic-defense-presentation-stack-kit"
];

assert.deepEqual(stack.map((kit) => kit.id), requiredIds);
assert.ok(createGenericStylizedViewRigKit(NexusRealtime).provides.includes("camera:2.5d"));
assert.ok(createGenericCelMaterialKit(NexusRealtime).provides.includes("style:cel-materials"));
assert.ok(createGenericInkOutlineKit(NexusRealtime).provides.includes("style:outline"));
assert.ok(createGenericDefensePresentationStackKit(NexusRealtime).provides.includes("presentation:stack"));

console.log("generic-defense-presentation-stack-kit smoke passed");
