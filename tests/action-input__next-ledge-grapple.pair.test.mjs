import assert from "node:assert/strict";
import { createMiniNexusRuntime } from "./helpers/mini-nexus-runtime.mjs";
import { createActionInputKit } from "../protokits/action-input-kit/index.js";
import { createDefaultNextLedgeGrappleLevel, createNextLedgeGrappleKit } from "../protokits/next-ledge-grapple-kit/index.js";

function routeActionEvents(engine) {
  const events = engine.actionInput.getState().semanticEvents ?? [];
  for (const event of events) {
    if (event.type === "axisChanged") engine.nextLedgeGrapple.swingAxis(event.axis.x);
    if (event.type === "aimChanged") engine.nextLedgeGrapple.setAimVector(event.aim.x, event.aim.y);
    if (event.type === "pressed" && event.action === "primary") engine.nextLedgeGrapple.action();
    if (event.type === "pressed" && event.action === "restart") engine.nextLedgeGrapple.restart();
    if (event.type === "pressed" && event.action === "debugAdvance") engine.nextLedgeGrapple.advanceSector();
  }
}

const NexusRealtime = createMiniNexusRuntime();
const level = createDefaultNextLedgeGrappleLevel({ seed: "pair-test", sector: 1 });
const engine = NexusRealtime.createRealtimeGame({
  kits: [
    createActionInputKit(NexusRealtime, { context: "next-ledge-grapple" }),
    createNextLedgeGrappleKit(NexusRealtime, { level, seed: level.seed })
  ]
});

engine.actionInput.key("d", true);
engine.tick(1 / 60);
let input = engine.actionInput.getState();
assert.equal(input.axis.x, 1);
routeActionEvents(engine);
engine.tick(1 / 60);
assert.equal(engine.nextLedgeGrapple.getState().axis, 1);

engine.actionInput.key("d", false);
engine.tick(1 / 60);
routeActionEvents(engine);
engine.tick(1 / 60);
assert.equal(engine.nextLedgeGrapple.getState().axis, 0);

engine.actionInput.press("primary");
engine.tick(1 / 60);
routeActionEvents(engine);
engine.tick(1 / 60);
let snapshot = engine.nextLedgeGrapple.getSnapshot();
assert.equal(snapshot.mode, "falling");

engine.actionInput.release("primary");
engine.actionInput.aim(0.45, 1);
engine.tick(1 / 60);
routeActionEvents(engine);
engine.tick(1 / 60);

engine.actionInput.press("primary");
engine.tick(1 / 60);
routeActionEvents(engine);
engine.tick(1 / 60);
snapshot = engine.nextLedgeGrapple.getSnapshot();
assert.equal(snapshot.mode, "launched");
assert.equal(snapshot.probe.visible, true);

engine.actionInput.press("restart");
engine.tick(1 / 60);
routeActionEvents(engine);
engine.tick(1 / 60);
snapshot = engine.nextLedgeGrapple.getSnapshot();
assert.equal(snapshot.mode, "swinging");

console.log("action-input + next-ledge-grapple pair smoke passed");
