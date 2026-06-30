# GPU Terrain Performance Circle Kit

`gpu-terrain-performance-circle-kit` is the first GPU-first terrain ProtoKit for replacing square patch LOD with a player-centered performance-circle draw plan.

It does **not** own DOM, Canvas, Three.js, WebGL objects, WebGPU devices, or native renderer objects. It owns the reusable terrain-density policy and the renderer-facing descriptor contract that adapters can consume.

## Goal

```txt
CPU/WASM decides what matters.
GPU calculates what it looks like.
```

The kit formalizes this terrain pipeline:

```txt
NexusRealtime runtime intent
  -> terrain performance circle
  -> density policy
  -> one fixed radial mesh descriptor
  -> shader displacement contract
  -> GPU paint/density/material field contracts
  -> WebGL/WebGPU/wgpu/Vulkan adapter
```

## Why this kit exists

The legacy terrain painter shape used logical square patches and rebuilt geometry after camera or edit changes. Even when those patches were merged into one render mesh, the CPU still paid for:

```txt
patch LOD checks
mesh rebuilds
normal recalculation
BufferGeometry disposal/recreation
terrain vertex upload
paint-triggered full geometry churn
```

This kit replaces that with a stable renderer contract:

```txt
one player/camera-centered radial performance mesh
stable GPU buffers
uniform-only camera movement
shader terrain height displacement
shader density debug tint
GPU paint/edit field dirty regions
```

## Naming rule

```txt
terrain-*    = renderer-neutral domain logic
gpu-*        = GPU-resident data/work, not necessarily compute
compute-*    = real compute shader/pass work
shader-*     = vertex/fragment/material shader work
webgpu-*     = WebGPU backend adapter
webgl-*      = WebGL fallback adapter
wgpu-*       = Rust/wgpu native/web adapter
vulkan-*     = native Vulkan adapter
```

## Public API

After install, the engine receives:

```js
engine.gpuTerrainPerformanceCircle.getState()
engine.gpuTerrainPerformanceCircle.getSnapshot()
engine.gpuTerrainPerformanceCircle.updateFrame(frame)
engine.gpuTerrainPerformanceCircle.enqueueFrame(frame)
engine.gpuTerrainPerformanceCircle.setPolicy(policyConfig)
engine.gpuTerrainPerformanceCircle.scoreAt(point, context)
engine.gpuTerrainPerformanceCircle.bandAt(point, context)
engine.gpuTerrainPerformanceCircle.getDrawPlan()
engine.gpuTerrainPerformanceCircle.validate()
engine.gpuTerrainPerformanceCircle.runSmoke()
```

## Density model

Density is scored from:

```txt
player distance
camera forward/view cone
minimum safety circle
brush proximity
roughness priority
movement reserve
horizon degradation
```

The default bands are:

```txt
focus      highest density in front of camera / brush focus
safety     always-available player-centered performance circle
peripheral medium/low side and middle-distance terrain
horizon    very sparse geometry plus shader/fog illusion
```

## Renderer contract

The draw plan explicitly forbids:

```txt
CPU terrain vertex generation per frame
CPU normal generation per frame
chunk LOD systems
mesh disposal/recreation on camera movement
terrain patch entity iteration
full terrain texture readback
```

The draw plan expects the GPU/render adapter to own:

```txt
height sampling
vertex displacement
normal reconstruction
slope/height/biome shading
density debug rendering
paint blend application
```

## First adapter path

Start with:

```txt
webgl-terrain-render-adapter-kit
shader-terrain-height-displacement-kit
shader-terrain-density-debug-kit
gpu-terrain-paint-field-kit
```

Then upgrade to:

```txt
webgpu-terrain-render-adapter-kit
webgpu-terrain-compute-adapter-kit
compute-terrain-normal-pass-kit
compute-terrain-density-field-kit
compute-terrain-paint-apply-kit
```

## Headless smoke

```bash
node tests/gpu-terrain-performance-circle-kit-smoke.test.mjs
```

The smoke confirms:

```txt
front-of-camera terrain scores denser than behind-camera terrain
near terrain scores denser than horizon terrain
the draw plan uses one fixed radial mesh
CPU geometry rebuild is disabled
square patch LOD is disabled
brush edits emit dirty GPU paint regions
```

## Promotion criteria

This kit can promote once it has:

```txt
a WebGL shader-displacement adapter
a WebGPU capability probe
a GPU paint texture adapter
snapshot replay tests
renderer conformance tests
one real terrain painter host using no CPU geometry rebuilds
```
