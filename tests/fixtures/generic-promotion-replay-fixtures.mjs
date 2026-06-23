// Smoke signature: NexusRealtime-generic-promotion-replay::fixtures::2026-06-23

export const promotionReplayFixtures = Object.freeze([
  {
    id: "pressure-oxygen-fixed-rise",
    factory: "genericPressureLoop",
    config: {
      channels: [
        { id: "oxygen", initial: 4, min: 0, max: 10, warningAt: 5, failAt: 7, risePerSecond: 2 }
      ]
    },
    steps: [
      { tick: { count: 2, dt: 1 } }
    ],
    expected: {
      eventCounts: {
        PressureAdjusted: 2,
        PressureWarning: 1,
        PressurePeaked: 1,
        PressureRecovered: 0
      },
      paths: {
        "pressure.status": "failed",
        "pressure.updatedAtTick": 2,
        "pressure.channelsById.oxygen.value": 8,
        "pressure.channelsById.oxygen.status": "failed"
      }
    }
  },
  {
    id: "resource-stamina-spend-restore",
    factory: "genericResourceLoop",
    config: {
      resources: [
        { id: "stamina", initial: 5, min: 0, max: 10, thresholds: [{ id: "low", value: 2, direction: "below" }] }
      ]
    },
    steps: [
      { call: "genericResourceLoop.spend", args: ["stamina", 4, "sprint"] },
      { call: "genericResourceLoop.restore", args: ["stamina", 2, "rest"] },
      { tick: { count: 1, dt: 0 } }
    ],
    expected: {
      eventCounts: {
        SpendRequested: 1,
        RestoreRequested: 1,
        Changed: 2,
        ThresholdCrossed: 1,
        Emptied: 0,
        Filled: 0,
        Rejected: 0
      },
      paths: {
        "resource.tick": 1,
        "resource.resourcesById.stamina.value": 3,
        "resource.resourcesById.stamina.empty": false,
        "resource.resourcesById.stamina.thresholdStates.low": false,
        "resource.resourcesById.stamina.lastChangeReason": "rest"
      }
    }
  },
  {
    id: "action-window-parry-perfect",
    factory: "genericActionWindow",
    config: {
      windows: [
        {
          id: "parry",
          durationSeconds: 1,
          cooldownSeconds: 0.25,
          perfect: { startSeconds: 0.4, endSeconds: 0.6 },
          good: { startSeconds: 0.2, endSeconds: 0.8 }
        }
      ]
    },
    steps: [
      { call: "genericActionWindow.openWindow", args: ["parry"] },
      { tick: { count: 1, dt: 0.5 } },
      { call: "genericActionWindow.requestAction", args: ["parry", { actorId: "player" }] }
    ],
    expected: {
      eventCounts: {
        OpenRequested: 1,
        Opened: 1,
        ActionRequested: 1,
        ActionPerfect: 1,
        ActionAccepted: 1,
        ActionGood: 0,
        ActionMissed: 0,
        Closed: 1,
        CooldownStarted: 1,
        Rejected: 0
      },
      paths: {
        "action.tick": 1,
        "action.windowsById.parry.status": "cooldown",
        "action.windowsById.parry.successes": 1,
        "action.windowsById.parry.misses": 0,
        "action.windowsById.parry.lastResult": "perfect",
        "action.recentResults.0.result": "perfect"
      }
    }
  },
  {
    id: "affordance-gate-use-complete",
    factory: "genericAffordanceDescriptor",
    config: {
      hideCompleted: true,
      affordances: [
        {
          id: "gate",
          label: "Gate",
          actionIds: ["open"],
          descriptor: { prompt: "Open gate", icon: "gate", tone: "safe" }
        }
      ]
    },
    steps: [
      { call: "genericAffordances.requestUse", args: ["gate", "open", { actorId: "player" }] },
      { call: "genericAffordances.setCompleted", args: ["gate", true, "opened"] },
      { tick: { count: 1, dt: 0 } }
    ],
    expected: {
      eventCounts: {
        UseRequested: 1,
        Used: 1,
        CompletedChanged: 1,
        Rejected: 0,
        DescriptorChanged: 0
      },
      paths: {
        "affordance.tick": 1,
        "affordance.affordancesById.gate.completed": true,
        "affordance.affordancesById.gate.hidden": true,
        "affordance.affordancesById.gate.useCount": 1,
        "affordance.affordancesById.gate.descriptor.prompt": "Open gate",
        "available.open.length": 0
      }
    }
  }
]);
