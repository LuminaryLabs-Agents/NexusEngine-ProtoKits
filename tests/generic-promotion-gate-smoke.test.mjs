// Smoke signature: NexusRealtime-generic-promotion-gate::headless::2026-06-23
import { assert, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import { createGenericPressureLoopKit } from "../protokits/generic-pressure-loop-kit/index.js";
import { createGenericResourceLoopKit } from "../protokits/generic-resource-loop-kit/index.js";
import { createGenericActionWindowKit } from "../protokits/generic-action-window-kit/index.js";
import { createGenericAffordanceDescriptorKit } from "../protokits/generic-affordance-descriptor-kit/index.js";

function assertPromotionBoundary(kit, surfaceName) {
  assert.equal(Boolean(kit?.id), true, `${surfaceName}: kit has id`);
  assert.equal(Boolean(kit?.resources && Object.keys(kit.resources).length), true, `${surfaceName}: exposes resources`);
  assert.equal(Boolean(kit?.events && Object.keys(kit.events).length), true, `${surfaceName}: exposes events`);
  assert.equal(Array.isArray(kit?.systems), true, `${surfaceName}: exposes headless systems`);
  assert.equal(Boolean(kit?.metadata?.boundary), true, `${surfaceName}: documents DSK boundary`);
}

{
  const { kit, engine, world, tick } = installKit(createGenericPressureLoopKit, {
    channels: [{ id: "oxygen", initial: 6, min: 0, max: 10, warningAt: 7, failAt: 9, risePerSecond: 4 }]
  });
  assertPromotionBoundary(kit, "generic pressure loop");
  assert.equal(kit.metadata?.engineNamespace, "engine.n.genericPressureLoop", "generic pressure loop declares namespace");
  const pressureLoop = engine.n?.genericPressureLoop;
  assert.equal(Boolean(pressureLoop), true, "generic pressure loop installs namespace alias");
  engine.genericPressureLoop = null;
  tick(1);
  assert.equal(pressureLoop.getChannel("oxygen").status, "failed", "pressure channel peaks deterministically through namespace");
  assert.equal(world.getEvents(kit.events.PressureWarning).length, 1, "pressure emits warning transition");
  assert.equal(world.getEvents(kit.events.PressurePeaked).length, 1, "pressure emits peaked transition");
}

{
  const { kit, engine, world } = installKit(createGenericResourceLoopKit, {
    resources: [{ id: "stamina", initial: 5, min: 0, max: 10, thresholds: [{ id: "low", value: 2, direction: "below" }] }]
  });
  assertPromotionBoundary(kit, "generic resource loop");
  assert.equal(kit.metadata?.engineNamespace, "engine.n.genericResourceLoop", "generic resource loop declares namespace");
  const resourceLoop = engine.n?.genericResourceLoop;
  assert.equal(Boolean(resourceLoop), true, "generic resource loop installs namespace alias");
  engine.genericResourceLoop = null;
  const meter = resourceLoop.spend("stamina", 4, "sprint");
  assert.equal(meter.value, 1, "resource spend updates meter headlessly through namespace");
  assert.equal(world.getEvents(kit.events.ThresholdCrossed).length, 1, "resource threshold crossing is observable");
  resourceLoop.restore("stamina", 3, "rest");
  assert.equal(resourceLoop.getResource("stamina").value, 4, "resource restore is deterministic");
}

{
  const { kit, engine, world, tick } = installKit(createGenericActionWindowKit, {
    windows: [{ id: "parry", durationSeconds: 1, cooldownSeconds: 0.25 }]
  });
  assertPromotionBoundary(kit, "generic action window");
  engine.genericActionWindow.openWindow("parry");
  tick(0.5);
  const result = engine.genericActionWindow.requestAction("parry", { actorId: "player" });
  assert.equal(result.result, "perfect", "action window accepts perfect timing headlessly");
  assert.equal(result.accepted, true, "perfect action is accepted");
  assert.equal(world.getEvents(kit.events.ActionPerfect).length, 1, "action window emits perfect event");
}

{
  const { kit, engine, world } = installKit(createGenericAffordanceDescriptorKit, {
    hideCompleted: true,
    affordances: [{ id: "gate", label: "Gate", actionIds: ["open"], descriptor: { prompt: "Open gate", icon: "gate" } }]
  });
  assertPromotionBoundary(kit, "generic affordance descriptor");
  assert.equal(engine.genericAffordances.getAvailable("open").length, 1, "affordance is available by semantic action");
  const used = engine.genericAffordances.requestUse("gate", "open", { actorId: "player" });
  assert.equal(used.descriptor.prompt, "Open gate", "affordance use carries renderer-facing descriptor data");
  engine.genericAffordances.setCompleted("gate", true, "opened");
  assert.equal(engine.genericAffordances.getAvailable("open").length, 0, "completed affordance hides from available list");
  assert.equal(world.getEvents(kit.events.Used).length, 1, "affordance use emits event");
  assert.equal(world.getEvents(kit.events.CompletedChanged).length, 1, "affordance completion emits event");
}
