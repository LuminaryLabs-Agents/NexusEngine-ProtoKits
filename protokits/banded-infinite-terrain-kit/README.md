# Banded Infinite Terrain Kit

Top-level ProtoKit bundle for GPU-first infinite terrain rendering.

This kit replaces many tiny exposed terrain GPU kits with a few readable bands:

```txt
banded-infinite-terrain-kit
- terrain-band-policy
- stable-origin-field
- radial-surface-topology
- terrain-shader-field
- terrain-render-contract
```

The goal is simple: CPU/NexusEngine owns terrain intent, while renderer adapters own GPU execution.

## What it solves

- player-centered infinite terrain
- top-level banded density policy
- stable snapped origin
- fractional camera offset tracking
- smoothed terrain sampling pose
- stable radial surface topology
- shader-owned height displacement
- no square patch LOD
- no CPU geometry rebuild on camera movement

## Swimming fix

The kit separates exact camera motion from terrain sampling:

```txt
exact camera position = player/camera motion
snapped terrain origin = stable terrain sampling
smoothed sampling pose = stable density/view scoring
```

Renderers should sample terrain from the snapped origin instead of using raw fractional camera coordinates as the field origin.

## Public API

```js
import { createBandedInfiniteTerrainKit } from "@luminarylabs/nexusengine-protokits/banded-infinite-terrain-kit";
```

The kit installs `engine.bandedInfiniteTerrain` with:

```txt
getState()
getSnapshot()
updateCamera(camera, dt)
setBands(bands)
sampleDensity(point)
getRenderContract()
validate()
reset()
```

## Status

ProtoKit proof domain. Ready for renderer-host composition and smoke validation, not core promotion.
