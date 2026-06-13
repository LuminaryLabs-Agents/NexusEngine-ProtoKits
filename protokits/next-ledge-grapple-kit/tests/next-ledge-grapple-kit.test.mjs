import assert from "node:assert/strict";
import { createMiniNexusRuntime } from "../../../tests/helpers/mini-nexus-runtime.mjs";
import {
  createDefaultNextLedgeGrappleLevel,
  createNextLedgeGrappleKit
} from "../index.js";

const NexusRealtime = createMiniNexusRuntime();
const level = createDefaultNextLedgeGrappleLevel({ seed: "kit-test", sector: 1 });
const engine = NexusRealtime.createRealtimeGame({
  kits: [createNextLedgeGrappleKit(NexusRealtime, { level, seed: level.seed })]
});

let snapshot = engine.nextLedgeGrapple.getSnapshot();
assert.equal(snapshot.mode, "swinging");
assert.ok(snapshot.ledges.length > 4);
assert.equal(snapshot.alive, true);

const startX = snapshot.player.x;
engine.nextLedgeGrapple.swingAxis(1);
for (let i = 0; i < 12; i += 1) engine.tick(1 / 60);
snapshot = engine.nextLedgeGrapple.getSnapshot();
assert.equal(engine.nextLedgeGrapple.getState().axis, 1);
assert.notEqual(snapshot.player.x, startX);

engine.nextLedgeGrapple.action();
engine.tick(1 / 60);
snapshot = engine.nextLedgeGrapple.getSnapshot();
assert.equal(snapshot.mode, "falling");

engine.nextLedgeGrapple.setAimVector(0.45, 1);
engine.nextLedgeGrapple.action();
engine.tick(1 / 60);
snapshot = engine.nextLedgeGrapple.getSnapshot();
assert.equal(snapshot.mode, "launched");
assert.equal(snapshot.probe.visible, true);

engine.nextLedgeGrapple.restart();
engine.tick(1 / 60);
snapshot = engine.nextLedgeGrapple.getSnapshot();
assert.equal(snapshot.mode, "swinging");
assert.equal(snapshot.sector, 1);

engine.nextLedgeGrapple.advanceSector();
engine.tick(1 / 60);
snapshot = engine.nextLedgeGrapple.getSnapshot();
assert.equal(snapshot.sector, 2);
assert.equal(snapshot.mode, "swinging");

console.log("next-ledge-grapple-kit smoke passed");
