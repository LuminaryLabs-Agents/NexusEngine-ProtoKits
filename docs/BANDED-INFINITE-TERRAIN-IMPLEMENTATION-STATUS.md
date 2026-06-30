# Banded Infinite Terrain Implementation Status

This note records the implementation status for the top-level `banded-infinite-terrain-kit`.

## Repository

```txt
LuminaryLabs-Agents/NexusRealtime-ProtoKits
```

## Implemented on main

The kit lives at:

```txt
protokits/banded-infinite-terrain-kit/
```

It is exported from the package as:

```txt
./banded-infinite-terrain-kit
```

It is smoke-tested by:

```txt
tests/banded-infinite-terrain-kit-smoke.test.mjs
```

It has a renderer-host proof at:

```txt
apps/banded-infinite-terrain-proof.html
```

## Top-level shape

```txt
banded-infinite-terrain-kit
├─ band policy
├─ stable origin field
├─ radial surface topology
├─ shader field contract
└─ render contract
```

This is the preferred readable terrain bundle. The older granular GPU terrain kit can still exist for lower-level experiments, but hosts should start from this top-level kit when they want banded infinite terrain.

## Swimming fix

The kit fixes terrain swimming at the contract level by requiring renderers to use a snapped terrain origin rather than raw fractional camera coordinates as the terrain sampling origin.

The state separates:

```txt
exactCamera
smoothedCamera
exactForward
smoothedForward
snapped origin
previous origin
fractional offset
```

The renderer contract exposes:

```txt
terrainOriginSnapped
terrainOriginPrevious
cameraExact
cameraSmoothed
cameraForwardSmoothed
fractionalCameraOffset
snapSize
normalEpsilon
```

## Validation contract

The smoke test proves:

```txt
single fixed radial surface
no square patch LOD
no camera-move CPU geometry rebuild
no raw camera float terrain sampling
stable snapped origin inside a snap cell
origin rebase after snap boundary
shader-owned displacement contract
```

## Remaining work

The kit is ready for renderer-host composition. It is not yet a full WebGPU compute terrain engine.

Future adapters should add:

```txt
webgpu-terrain-render-adapter-kit
webgpu-terrain-compute-adapter-kit
gpu-terrain-paint-texture-kit
compute-terrain-normal-pass-kit
compute-terrain-density-field-kit
compute-terrain-paint-apply-kit
```
