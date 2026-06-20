import assert from "node:assert/strict";
import { createConfigurableRenderLayerSnapshot } from "../index.js";

const snapshot = createConfigurableRenderLayerSnapshot({
  defaultStyle: "cliff-default",
  mode: "falling",
  profiles: [
    { id: "cliff-default", layers: { interactive: { glow: 1, readable: true }, character: { contrast: 1 } } },
    { id: "danger-fall", extends: "cliff-default", layers: { interactive: { glow: 1.5 }, character: { rim: "#ff3858" } } }
  ],
  designations: [
    { when: { mode: "falling" }, style: "danger-fall", priority: 80 }
  ],
  targets: [
    { id: "ledge-1", layer: "interactive" },
    { id: "player", layer: "character" }
  ]
});

const ledge = snapshot.targets.find((target) => target.id === "ledge-1");
const player = snapshot.targets.find((target) => target.id === "player");

assert.equal(snapshot.validation.ok, true);
assert.equal(ledge.style.id, "danger-fall");
assert.equal(ledge.resolvedVisual.glow, 1.5);
assert.equal(player.style.values.rim, "#ff3858");
