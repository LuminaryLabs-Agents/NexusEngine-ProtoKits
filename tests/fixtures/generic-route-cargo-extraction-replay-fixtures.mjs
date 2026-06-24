// Smoke signature: NexusRealtime-generic-route-cargo-extraction-replay::fixtures::2026-06-24

export const routeCargoExtractionReplayFixtures = Object.freeze([
  {
    id: "delivery-extraction-composite-fixed-ticks",
    config: {
      routeId: "harbor-salvage-extraction",
      label: "Harbor salvage extraction",
      checkpoints: [
        { id: "dock", label: "Dock", objective: "Load cargo at the dock", x: 0, y: 0, tags: ["pickup"] },
        { id: "crane", label: "Crane", objective: "Move through the crane lane", x: 8, y: 2, tags: ["crossing"] },
        { id: "gate", label: "Gate", objective: "Deliver cargo at the gate", x: 16, y: 2, tags: ["dropoff"] }
      ],
      cargoResources: [{
        id: "cargo",
        label: "Cargo",
        min: 0,
        max: 3,
        initial: 0,
        thresholds: [{ id: "loaded", value: 1, direction: "above" }],
        tags: ["cargo", "extraction"]
      }],
      pressureChannels: [{
        id: "storm",
        label: "Storm",
        min: 0,
        max: 100,
        value: 5,
        warningAt: 60,
        failAt: 100,
        tags: ["pressure", "weather"]
      }]
    },
    steps: [
      { call: "n.genericRouteCargoExtraction.pickupCargo", args: ["cargo", 2, { commandId: "pickup:cargo" }] },
      { call: "n.genericRouteCargoExtraction.completeCheckpoint", args: ["dock", { commandId: "checkpoint:dock", actorId: "runner" }] },
      { tick: { count: 2, dt: 0.25 } },
      { call: "n.genericRouteCargoExtraction.adjustPressure", args: ["storm", 20, { commandId: "pressure:storm" }] },
      { call: "n.genericRouteCargoExtraction.completeCheckpoint", args: ["crane", { commandId: "checkpoint:crane", actorId: "runner" }] },
      { tick: { count: 3, dt: 0.1 } },
      { call: "n.genericRouteCargoExtraction.deliverCargo", args: ["cargo", 1, { commandId: "deliver:cargo" }] },
      { call: "n.genericRouteCargoExtraction.completeCheckpoint", args: ["gate", { commandId: "checkpoint:gate", actorId: "runner" }] },
      { tick: { count: 1, dt: 0 } }
    ],
    expected: {
      eventCounts: { SnapshotUpdated: 7, CargoChanged: 2, PressureChanged: 1, Completed: 1, Rejected: 0 },
      paths: {
        "snapshot.status": "completed",
        "snapshot.route.status": "completed",
        "snapshot.route.activeId": null,
        "snapshot.route.completedIds": ["dock", "crane", "gate"],
        "snapshot.cargo.resourcesById.cargo.value": 1,
        "snapshot.cargo.resourcesById.cargo.thresholdStates.loaded": true,
        "snapshot.pressure.channelsById.storm.value": 25,
        "snapshot.pressure.status": "stable",
        "snapshot.updatedAtTick": 6,
        "descriptors.length": 5,
        "descriptors.0.kind": "route-checkpoint",
        "descriptors.0.higherDomain": "route-cargo-extraction",
        "descriptors.3.kind": "cargo-resource",
        "descriptors.4.kind": "extraction-pressure-channel"
      }
    }
  },
  {
    id: "reject-and-reset-composite-fixed-ticks",
    config: {
      routeId: "ridge-courier-extraction",
      label: "Ridge courier extraction",
      checkpoints: [
        { id: "pickup", label: "Pickup", objective: "Collect cache", tags: ["pickup"] },
        { id: "dropoff", label: "Dropoff", objective: "Deliver cache", tags: ["dropoff"] }
      ],
      cargoResources: [{ id: "cargo", label: "Cargo", min: 0, max: 2, initial: 1, tags: ["cargo"] }],
      pressureChannels: [{ id: "alert", label: "Alert", min: 0, max: 100, value: 30, warningAt: 50, failAt: 90 }]
    },
    steps: [
      { call: "n.genericRouteCargoExtraction.deliverCargo", args: ["missing", 1, { commandId: "deliver:missing" }] },
      { call: "n.genericRouteCargoExtraction.completeCheckpoint", args: ["dropoff", { commandId: "reject:dropoff" }] },
      { tick: { count: 1, dt: 0.5 } },
      { call: "n.genericRouteCargoExtraction.reset", args: [{ reason: "fixture-reset" }] },
      { tick: { count: 2, dt: 0 } }
    ],
    expected: {
      eventCounts: { SnapshotUpdated: 3, CargoChanged: 0, PressureChanged: 0, Completed: 0, Rejected: 1 },
      paths: {
        "snapshot.status": "active",
        "snapshot.route.activeId": "pickup",
        "snapshot.route.completedIds": [],
        "snapshot.route.updatedAtTick": 3,
        "snapshot.cargo.resourcesById.cargo.value": 1,
        "snapshot.pressure.channelsById.alert.value": 30,
        "snapshot.updatedAtTick": 3,
        "descriptors.length": 4,
        "descriptors.0.status": "active",
        "descriptors.1.status": "pending",
        "descriptors.2.kind": "cargo-resource",
        "descriptors.3.kind": "extraction-pressure-channel"
      }
    }
  }
]);
