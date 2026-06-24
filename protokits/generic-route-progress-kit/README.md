# Generic Route Progress Kit

Renderer-agnostic route/checkpoint progress boundary for NexusRealtime experiments.

This kit owns ordered checkpoint state, completion events, active objective snapshots, and checkpoint descriptors. Hosts still own input capture, collision/hit testing, browser rendering, camera, audio, assets, and route fiction.

## Boundary

- Resource: `genericRouteProgress.state`
- Events: `genericRouteProgress.checkpoint.entered`, `genericRouteProgress.checkpoint.completed`, `genericRouteProgress.advanced`, `genericRouteProgress.completed`, `genericRouteProgress.reset`, `genericRouteProgress.rejected`
- Methods: `engine.genericRouteProgress.enter`, `.complete`, `.advance`, `.reset`, `.setRoute`, `.getState`, `.getActiveCheckpoint`, `.getDescriptors`
- Snapshots/descriptors: route id/status, active checkpoint, completed ids, and `route-checkpoint` descriptors

## Example

```js
import { createGenericRouteProgressKit } from "@luminarylabs/nexusrealtime-protokits/generic-route-progress-kit";

const engine = NexusRealtime.createRealtimeGame({
  kits: [
    createGenericRouteProgressKit(NexusRealtime, {
      routeId: "cargo-chain",
      checkpoints: [
        { id: "pickup", label: "Pickup" },
        { id: "switchyard", label: "Switchyard" },
        { id: "dropoff", label: "Dropoff" }
      ]
    })
  ]
});

engine.genericRouteProgress.complete("pickup", { commandId: "pickup:1" });
const descriptors = engine.genericRouteProgress.getDescriptors();
```

Use this kit when a route wants to shrink route-local JavaScript that only tracks ordered objectives, active checkpoint, completion, and checkpoint descriptors. Compose it with cargo, hazard, pressure, scan/survey, or traversal domains rather than embedding those domains here.
