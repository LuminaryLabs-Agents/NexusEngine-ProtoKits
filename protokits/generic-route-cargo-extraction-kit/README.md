# Generic Route Cargo Extraction Kit

`generic-route-cargo-extraction-kit` is a composite Domain Service Kit for routes that combine checkpoint progress, cargo or carried-resource state, and extraction pressure.

It is intentionally not a monolithic game engine. The kit coordinates three smaller renderer-agnostic boundaries:

- `generic-route-progress-kit` for ordered checkpoints, completion events, active objective snapshots, and `route-checkpoint` descriptors.
- `generic-resource-loop-kit` for cargo-like ledgers such as carried crates, salvage weight, extraction capacity, tether charge, or delivery slots.
- `generic-pressure-loop-kit` for extraction pressure such as storm, hazard, alert, oxygen debt, or pursuit heat.

The composite adds a small session facade and stable snapshot over those child DSKs. Hosts still own route fiction, collision or hit testing, DOM, Canvas, WebGL, Three.js, browser audio, asset loading, camera behavior, pointer lock, and browser input bridges.

## Boundary

Owned here:

- Composite snapshot resource: `genericRouteCargoExtraction.state`.
- Composite events for snapshot updates, cargo changes, pressure changes, completion, and rejection.
- Preferred composite facade methods on `engine.n.genericRouteCargoExtraction`.
- Compatibility composite facade methods on `engine.genericRouteCargoExtraction`.
- Child boundary calls prefer `engine.n.genericRouteProgress`, `engine.n.genericResourceLoop`, and `engine.n.genericPressureLoop`, with compatibility fallbacks for older hosts.
- Renderer-agnostic descriptors: `route-checkpoint`, `cargo-resource`, and `extraction-pressure-channel`.

Not owned here:

- Cargo inventory fiction beyond resource-meter values.
- Hazard simulation beyond pressure channel deltas.
- Browser input, collision checks, rendering, camera, assets, audio, DOM, Canvas, WebGL, or Three.js.
- Route-specific success rules beyond composed checkpoint/resource/pressure state.

## Example

```js
import { createGenericRouteCargoExtractionKit } from "@luminarylabs/nexusrealtime-protokits/generic-route-cargo-extraction-kit";

const kit = createGenericRouteCargoExtractionKit(NexusRealtime, {
  routeId: "harbor-salvage-loop",
  checkpoints: [
    { id: "dock", label: "Dock" },
    { id: "crane", label: "Crane" },
    { id: "gate", label: "Gate" }
  ],
  cargoResources: [{ id: "salvage", label: "Salvage", min: 0, max: 4, initial: 0 }],
  pressureChannels: [{ id: "storm", label: "Storm", value: 10, warningAt: 60, failAt: 100 }]
});

engine.n.genericRouteCargoExtraction.pickupCargo("salvage", 1);
engine.n.genericRouteCargoExtraction.completeCheckpoint("dock");
engine.n.genericRouteCargoExtraction.adjustPressure("storm", 5);
const snapshot = engine.n.genericRouteCargoExtraction.getSnapshot();
```

## Composite route candidates

This kit is the first reusable composite target for the traversal/cargo and route-cargo-extraction lanes. Candidate experiment consumers include `next-ledge`, Harbor Salvage, Cargo Chain, Sky Courier, Trainyard Switcher, Dungeon Relay, Floodplain Rescue, and any extraction route that already owns local checkpoint/cargo/pressure ledgers.

The safest downstream Experiments patch is still a thin manifest/spec update for one checkpoint-heavy route before migrating route JavaScript. Do not claim local JavaScript shrink until at least one route consumes this kit and adds route-level fixed-tick smoke or replay evidence.
