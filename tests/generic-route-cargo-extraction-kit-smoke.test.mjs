import { assert, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import { createGenericRouteCargoExtractionKit } from "../protokits/generic-route-cargo-extraction-kit/index.js";

const { kit, engine, world, tick } = installKit(createGenericRouteCargoExtractionKit, {
  routeId: "harbor-salvage-extraction",
  checkpoints: [
    { id: "dock", label: "Dock" },
    { id: "crane", label: "Crane" },
    { id: "gate", label: "Gate" }
  ],
  cargoResources: [{ id: "cargo", label: "Cargo", min: 0, max: 3, initial: 0 }],
  pressureChannels: [{ id: "storm", label: "Storm", min: 0, max: 100, value: 5, warningAt: 60, failAt: 100 }]
});

assert.equal(kit.id, "generic-route-cargo-extraction-kit");
assert.equal(kit.metadata?.domain, "route-cargo-extraction");
assert.equal(kit.metadata?.ownsLoop, false);
assert.deepEqual(kit.metadata?.composes, ["generic-route-progress-kit", "generic-resource-loop-kit", "generic-pressure-loop-kit"]);
assert.equal(Boolean(engine.genericRouteProgress), true);
assert.equal(Boolean(engine.genericResourceLoop), true);
assert.equal(Boolean(engine.genericPressureLoop), true);
assert.equal(Boolean(engine.n?.genericRouteCargoExtraction), true);

const facade = engine.n.genericRouteCargoExtraction;
assert.equal(facade.getSnapshot().route.activeId, "dock");
assert.equal(facade.getSnapshot().cargo.resourcesById.cargo.value, 0);
assert.equal(facade.getSnapshot().pressure.channelsById.storm.value, 5);

const pickup = facade.pickupCargo("cargo", 2, { commandId: "pickup:cargo" });
assert.equal(pickup.accepted, true);
assert.equal(pickup.snapshot.cargo.resourcesById.cargo.value, 2);
assert.equal(world.getEvents(kit.events.CargoChanged).length, 1);

const first = facade.completeCheckpoint("dock", { commandId: "checkpoint:dock" });
assert.equal(first.accepted, true);
assert.equal(first.snapshot.route.activeId, "crane");

const pressure = facade.adjustPressure("storm", 20, { commandId: "pressure:storm" });
assert.equal(pressure.accepted, true);
assert.equal(pressure.snapshot.pressure.channelsById.storm.value, 25);
assert.equal(world.getEvents(kit.events.PressureChanged).length, 1);

tick(1 / 20);
assert.equal(facade.getSnapshot().updatedAtTick, 1);

facade.completeCheckpoint("crane", { commandId: "checkpoint:crane" });
const delivery = facade.deliverCargo("cargo", 1, { commandId: "deliver:cargo" });
assert.equal(delivery.accepted, true);
assert.equal(delivery.snapshot.cargo.resourcesById.cargo.value, 1);
const done = facade.completeCheckpoint("gate", { commandId: "checkpoint:gate" });
assert.equal(done.accepted, true);
assert.equal(done.snapshot.status, "completed");
assert.equal(world.getEvents(kit.events.Completed).length, 1);

const descriptorKinds = new Set(facade.getDescriptors().map((descriptor) => descriptor.kind));
assert.equal(descriptorKinds.has("route-checkpoint"), true);
assert.equal(descriptorKinds.has("cargo-resource"), true);
assert.equal(descriptorKinds.has("extraction-pressure-channel"), true);
assert.equal(facade.getDescriptors().some((descriptor) => descriptor.higherDomain === "route-cargo-extraction"), true);

const reset = facade.reset({ reason: "smoke-reset" });
assert.equal(reset.route.activeId, "dock");
assert.equal(reset.cargo.resourcesById.cargo.value, 0);
assert.equal(reset.pressure.channelsById.storm.value, 5);

console.log("generic route cargo extraction composite smoke passed");
