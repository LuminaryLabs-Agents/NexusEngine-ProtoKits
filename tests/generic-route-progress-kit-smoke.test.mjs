// Smoke signature: NexusRealtime-generic-route-progress::headless::2026-06-24
import { assert, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import {
  GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE,
  createGenericRouteProgressKit,
  syncGenericRouteProgressEngineNamespace
} from "../protokits/generic-route-progress-kit/index.js";

const { kit, engine, world, tick } = installKit(createGenericRouteProgressKit, {
  routeId: "harbor-salvage-loop",
  label: "Harbor salvage loop",
  checkpoints: [
    { id: "dock", label: "Dock", objective: "Leave the dock", x: 0, y: 0, tags: ["start"] },
    { id: "crane", label: "Crane", objective: "Survey the crane", x: 10, y: 4, tags: ["scan"] },
    { id: "gate", label: "Gate", objective: "Deliver cargo to the gate", x: 18, y: 4, tags: ["delivery"] }
  ]
});

assert.equal(kit.id, "generic-route-progress-kit", "route progress kit has stable id");
assert.equal(Boolean(kit.metadata?.boundary), true, "route progress kit documents DSK boundary");
assert.equal(kit.metadata?.engineNamespace, "engine.n.genericRouteProgress", "route progress declares engine namespace");
assert.equal(Boolean(kit.resources?.RouteProgressState), true, "route progress exposes state resource");
assert.equal(Boolean(kit.events?.CheckpointCompleted), true, "route progress exposes checkpoint events");
assert.equal(Array.isArray(kit.systems), true, "route progress exposes headless tick system");
assert.equal(GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE, "genericRouteProgress", "route progress namespace has stable name");
assert.equal(Boolean(engine.n?.genericRouteProgress), true, "route progress mirrors facade under engine.n namespace");
assert.equal(syncGenericRouteProgressEngineNamespace(engine), engine.n.genericRouteProgress, "route progress namespace sync is idempotent");

const routeProgress = engine.n.genericRouteProgress;
engine.genericRouteProgress = null;
assert.equal(routeProgress.getActiveCheckpoint().id, "dock", "first checkpoint is active");

const entered = routeProgress.enter("dock", { actorId: "runner" });
assert.equal(entered.accepted, true, "active checkpoint enter is accepted");
assert.equal(world.getEvents(kit.events.CheckpointEntered).length, 1, "checkpoint enter emits event");

const first = routeProgress.complete("dock", { commandId: "complete:dock", actorId: "runner" });
assert.equal(first.accepted, true, "first checkpoint completion accepted");
assert.equal(first.activeCheckpoint.id, "crane", "completion advances active checkpoint");
assert.deepEqual(routeProgress.getState().completedIds, ["dock"], "completed checkpoint is recorded");
assert.equal(world.getEvents(kit.events.CheckpointCompleted).length, 1, "checkpoint completion emits event");
assert.equal(world.getEvents(kit.events.RouteAdvanced).length, 1, "route advance emits event");

const rejected = routeProgress.complete("gate", { commandId: "out-of-order" });
assert.equal(rejected.accepted, false, "out-of-order checkpoint is rejected by default");
assert.equal(rejected.reason, "inactive-checkpoint", "rejection explains inactive checkpoint");
assert.equal(world.getEvents(kit.events.Rejected).length, 1, "route rejection is observable");

tick(1 / 20);
assert.equal(routeProgress.getState().updatedAtTick, 1, "headless tick refreshes deterministic tick stamp");

routeProgress.advance({ commandId: "complete:crane" });
const done = routeProgress.advance({ commandId: "complete:gate" });
assert.equal(done.completed, true, "final checkpoint completes route");
assert.equal(routeProgress.getState().status, "completed", "route status is completed");
assert.equal(world.getEvents(kit.events.RouteCompleted).length, 1, "route completion emits event");
assert.equal(routeProgress.getDescriptors().every((descriptor) => descriptor.kind === "route-checkpoint"), true, "checkpoint descriptors remain renderer-agnostic");

const reset = routeProgress.reset({ reason: "smoke-reset" });
assert.equal(reset.activeId, "dock", "reset restores first checkpoint");
assert.equal(reset.status, "active", "reset route returns to active state");
assert.equal(world.getEvents(kit.events.RouteReset).length, 1, "reset emits route reset event");
