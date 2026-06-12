# Next Ledge Kit

Composable click-to-climb and rope-swing rules for NexusRealtime games.

`next-ledge-kit` remains the high-level coordinator for the climb loop. The surrounding vertical-climb ProtoKits provide content palettes, layered objects, route graphs, simple swing, endless ascent, cloud zones, input routing, camera state, risk evaluation, and no-overlay diegetic feedback.

## One-call cloud climb preset

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createNextLedgeCloudClimb
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/next-ledge-kit/cloud-climb-preset.js";

const game = createNextLedgeCloudClimb(NexusRealtime, {
  seed: "clouds-forever-001",
  overlayUi: false,
  mode: "hybrid"
});
```

## Advanced composition

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createNextLedgeCloudClimbKits
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/next-ledge-kit/cloud-climb-preset.js";

const game = NexusRealtime.createRealtimeGame({
  kits: createNextLedgeCloudClimbKits(NexusRealtime, {
    seed: "clouds-forever-001",
    overlayUi: false
  })
});
```

## Preset kit stack

```txt
content-palette-kit
layered-object-kit
vertical-climb-core
ledge-route-kit
simple-swing-kit
endless-ascent-kit
cloud-zone-kit
climb-input-kit
climb-risk-kit
climb-camera-kit
diegetic-feedback-kit
next-ledge-kit
```

## Existing `engine.nextLedge` surface

```js
engine.nextLedge.choose(targetId);
engine.nextLedge.swingAxis(-1); // A / left
engine.nextLedge.swingAxis(1);  // D / right
engine.nextLedge.swingAxis(0);  // released
engine.nextLedge.hover(targetId);
engine.nextLedge.restart();
engine.nextLedge.getState();
engine.nextLedge.getEnabledTargets();
```

## State modes

```txt
ready     waiting for a ledge click
moving    committed jump/climb arc
swinging  hanging from a rope; A/D adds horizontal momentum
falling   stamina failed or grip lost
complete  summit reached
```

## Design notes

- The renderer should draw snapshots; it should not decide gameplay reachability.
- `ledge-route-kit` decides whether targets are reachable.
- `simple-swing-kit` owns A/D momentum and ignores A/D while not attached.
- `layered-object-kit` handles large parent objects with smaller socketed objects.
- `content-palette-kit` lets a game use exact rocks, seeded random rocks, or hybrid overrides.
- `diegetic-feedback-kit` supports `overlayUi: false` for world-space feedback.

## Version

Current prototype version: `0.1.0` for the core `next-ledge-kit`, with `0.0.1` cloud climb preset composition.
