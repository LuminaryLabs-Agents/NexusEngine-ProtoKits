# Banded Infinite Terrain Kit

`banded-infinite-terrain-kit` is the preferred top-level ProtoKit for player-centered, GPU-first infinite terrain.

It bundles the terrain pieces that were previously discussed as many smaller GPU, shader, and compute kits into one readable domain surface.

```txt
banded-infinite-terrain-kit
├─ band policy
├─ stable origin field
├─ radial surface topology
├─ shader field contract
└─ render contract
```

## Why this kit exists

Use this kit when a renderer needs a massive terrain surface without turning every terrain patch into ECS state.

The kit describes:

- banded terrain density
- snapped origin rebasing
- smoothed camera/density pose
- radial topology descriptor
- shader-owned terrain displacement
- renderer-facing uniforms
- validation for no square patch LOD

It does not own:

- DOM
- Canvas
- Three.js
- WebGL or WebGPU commands
- player input listeners
- app UI
- game-specific terrain content

Those belong in renderer hosts, experiments, or backend adapters.

## Swimming fix

The terrain swimming issue comes from letting raw fractional camera coordinates become the terrain sampling origin.

The kit separates:

```txt
exactCamera
  used for player/camera motion

snapped origin
  used for terrain sampling and mesh placement

smoothedCamera / smoothedForward
  used for density and view-cone scoring

fractionalOffset
  exposed for diagnostics and future clipmap/paint work
```

Renderers should sample terrain from `terrainOriginSnapped`, not from `cameraExact`.

## Default bands

```txt
focus      radius 96    spacing 2
safety     radius 280   spacing 6
peripheral radius 720   spacing 18
horizon    radius 1400  spacing 52
```

These are intent bands, not ECS patch entities.

## Renderer contract

`getRenderContract()` returns data for renderer adapters:

```txt
topology
uniforms
bands
shaderField
constraints
```

The important constraints are:

```txt
single fixed radial surface
no square patch LOD
no CPU geometry rebuild on camera movement
no raw camera float sampling
shader owns displacement
```

## Import

```js
import { createBandedInfiniteTerrainKit } from "@luminarylabs/nexusrealtime-protokits/banded-infinite-terrain-kit";
```

## Validation

Run:

```bash
node tests/banded-infinite-terrain-kit-smoke.test.mjs
```

The smoke test proves origin snapping, in-cell stability, snap-boundary rebasing, density sampling, and render contract validation.
