// Smoke signature: NexusEngine-generic-route-progress-replay::fixtures::2026-06-24

export const routeProgressReplayFixtures = Object.freeze([
  {
    id: "delivery-checkpoints-fixed-ticks",
    config: {
      routeId: "harbor-loop",
      label: "Harbor loop",
      checkpoints: [
        { id: "dock", label: "Dock", objective: "Collect manifest", x: 0, y: 0, radius: 2, tags: ["pickup"], descriptor: { icon: "dock", tone: "safe" } },
        { id: "crane", label: "Crane", objective: "Cross crane lane", x: 10, y: 4, radius: 3, tags: ["crossing"], descriptor: { icon: "checkpoint", tone: "warning" } },
        { id: "gate", label: "Gate", objective: "Deliver manifest", x: 18, y: 4, radius: 2, tags: ["dropoff"], descriptor: { icon: "dropoff", tone: "success" } }
      ]
    },
    steps: [
      { call: "n.genericRouteProgress.enter", args: ["dock", { commandId: "enter:dock", actorId: "runner" }] },
      { call: "n.genericRouteProgress.complete", args: ["dock", { commandId: "complete:dock", actorId: "runner" }] },
      { tick: { count: 2, dt: 0.25 } },
      { call: "n.genericRouteProgress.enter", args: ["crane", { commandId: "enter:crane", actorId: "runner" }] },
      { call: "n.genericRouteProgress.complete", args: ["crane", { commandId: "complete:crane", actorId: "runner" }] },
      { tick: { count: 3, dt: 0.1 } },
      { call: "n.genericRouteProgress.advance", args: [{ commandId: "complete:gate", actorId: "runner" }] },
      { tick: { count: 1, dt: 0 } }
    ],
    expected: {
      eventCounts: { CheckpointEntered: 2, CheckpointCompleted: 3, RouteAdvanced: 2, RouteCompleted: 1, RouteReset: 0, Rejected: 0 },
      paths: {
        "route.status": "completed",
        "route.activeId": null,
        "route.activeIndex": 3,
        "route.updatedAtTick": 6,
        "route.completedIds": ["dock", "crane", "gate"],
        "descriptors.length": 3,
        "descriptors.0.kind": "route-checkpoint",
        "descriptors.0.status": "completed",
        "descriptors.1.tags": ["crossing"],
        "descriptors.1.status": "completed",
        "descriptors.2.status": "completed"
      }
    }
  },
  {
    id: "out-of-order-reject-reset-fixed-tick",
    config: {
      routeId: "courier-loop",
      label: "Courier loop",
      checkpoints: [
        { id: "pickup", label: "Pickup", objective: "Collect cargo", x: 1, y: 1, tags: ["pickup"] },
        { id: "handoff", label: "Handoff", objective: "Transfer cargo", x: 6, y: 2, tags: ["handoff"] },
        { id: "dropoff", label: "Dropoff", objective: "Deliver cargo", x: 12, y: 2, tags: ["dropoff"] }
      ]
    },
    steps: [
      { call: "n.genericRouteProgress.complete", args: ["dropoff", { commandId: "reject:dropoff" }] },
      { tick: { count: 1, dt: 0.5 } },
      { call: "n.genericRouteProgress.complete", args: ["pickup", { commandId: "complete:pickup" }] },
      { tick: { count: 1, dt: 0.25 } },
      { call: "n.genericRouteProgress.reset", args: [{ reason: "fixture-reset" }] },
      { tick: { count: 1, dt: 0 } }
    ],
    expected: {
      eventCounts: { CheckpointEntered: 0, CheckpointCompleted: 1, RouteAdvanced: 1, RouteCompleted: 0, RouteReset: 1, Rejected: 1 },
      paths: {
        "route.status": "active",
        "route.activeId": "pickup",
        "route.activeIndex": 0,
        "route.updatedAtTick": 3,
        "route.completedIds": [],
        "active.id": "pickup",
        "descriptors.length": 3,
        "descriptors.0.status": "active",
        "descriptors.1.status": "pending",
        "descriptors.2.status": "pending"
      }
    }
  }
]);
