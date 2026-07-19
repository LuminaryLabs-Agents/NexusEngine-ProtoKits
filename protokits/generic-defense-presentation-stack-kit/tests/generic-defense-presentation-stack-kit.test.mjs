import assert from "node:assert/strict";
import {
  GENERIC_DEFENSE_PRESENTATION_STACK_VERSION,
  createGenericDefensePresentationStackKits,
  createGenericStylizedViewRigKit,
  createGenericCelMaterialKit,
  createGenericInkOutlineKit,
  createGenericUpgradeTreePanelKit,
  createGenericDefensePresentationStackKit
} from "../index.js";

const NexusEngine = {
  defineRuntimeKit(config) { return config; }
};

assert.equal(GENERIC_DEFENSE_PRESENTATION_STACK_VERSION, "0.1.0");

const stack = createGenericDefensePresentationStackKits(NexusEngine);
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
assert.ok(createGenericStylizedViewRigKit(NexusEngine).provides.includes("camera:2.5d"));
assert.ok(createGenericCelMaterialKit(NexusEngine).provides.includes("style:cel-materials"));
assert.ok(createGenericInkOutlineKit(NexusEngine).provides.includes("style:outline"));
assert.ok(createGenericDefensePresentationStackKit(NexusEngine).provides.includes("presentation:stack"));

const upgradeSnapshot = {
  economy: { currency: 87 },
  session: { selectedId: "structure-1", selectedKind: "structure" },
  structures: {
    structures: { "structure-1": { id: "structure-1", blueprintId: "bolt", level: 1 } },
    blueprints: { bolt: { id: "bolt", cost: 45, upgradeCost: 38, maxLevel: 5 } }
  }
};
const upgradeEngine = {
  n: { genericDefense: { sessionFacade: { getSnapshot: () => upgradeSnapshot } } }
};
createGenericUpgradeTreePanelKit(NexusEngine).install({ engine: upgradeEngine });
const upgradeDescriptor = upgradeEngine.upgradeTreePanel.getDescriptor();
assert.equal(upgradeDescriptor.branches.length, 1, "presentation should expose the one implemented upgrade command");
assert.equal(upgradeDescriptor.branches[0].id, "upgrade");
assert.equal(upgradeDescriptor.branches[0].cost, 38, "presentation cost should match the structure DSK command");
assert.equal(upgradeDescriptor.branches[0].affordable, true);

console.log("generic-defense-presentation-stack-kit smoke passed");
