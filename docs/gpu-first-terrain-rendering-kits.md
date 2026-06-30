# GPU-First Terrain Rendering Kit Plan

This document codifies the GPU-first terrain architecture for NexusRealtime ProtoKits.

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

## Core architecture change

```txt
Old:
  square terrain patches
  patch distance LOD
  CPU mesh rebuilds
  CPU normal rebuilds
  patch entity churn
  full mesh uploads after edits

New:
  one fixed radial performance-circle mesh
  view-cone density scoring
  stable GPU buffers
  uniform-only camera movement
  shader terrain displacement
  GPU paint/edit dirty regions
  WebGL first, WebGPU compute later
```

## First implemented ProtoKit

```txt
protokits/gpu-terrain-performance-circle-kit
```

This kit owns:

```txt
terrain-performance-circle policy
terrain-density-policy scoring
gpu-terrain-radial-mesh descriptor
shader-terrain-height-displacement contract
shader-terrain-density-debug contract
gpu-terrain-paint-field dirty-region contract
nexus-terrain runtime bridge surface
```

It does not own:

```txt
DOM
Canvas
Three.js
WebGL objects
WebGPU devices
requestAnimationFrame
keyboard listeners
host renderer mutation
```

## Practical first batch

```txt
1. terrain-performance-circle-kit
2. terrain-density-policy-kit
3. gpu-terrain-radial-mesh-kit
4. shader-terrain-height-displacement-kit
5. shader-terrain-density-debug-kit
6. gpu-terrain-paint-field-kit
7. shader-terrain-paint-blend-kit
8. shader-terrain-slope-material-kit
9. webgl-terrain-render-adapter-kit
10. webgpu-terrain-capability-probe-kit
11. validate-terrain-no-cpu-rebuild-kit
12. validate-terrain-single-mesh-kit
13. validate-terrain-performance-circle-kit
14. smoke-terrain-gpu-render-kit
15. nexus-terrain-runtime-bridge-kit
```

## Later WebGPU batch

```txt
16. webgpu-terrain-render-adapter-kit
17. webgpu-terrain-compute-adapter-kit
18. compute-terrain-normal-pass-kit
19. compute-terrain-density-field-kit
20. compute-terrain-paint-apply-kit
21. compute-terrain-visibility-field-kit
22. compute-terrain-screen-error-pass-kit
23. compute-terrain-indirect-draw-plan-kit
24. gpu-terrain-storage-buffer-kit
25. gpu-terrain-storage-texture-kit
26. gpu-pipeline-cache-kit
27. gpu-bind-group-cache-kit
28. gpu-frame-budget-kit
29. gpu-profiler-kit
30. validate-terrain-no-readback-stall-kit
```

## Terrain domain kit inventory

```txt
terrain-performance-circle-kit
terrain-view-cone-density-kit
terrain-screen-error-density-kit
terrain-triangle-budget-kit
terrain-density-policy-kit
terrain-density-field-kit
terrain-radial-topology-kit
terrain-frustum-topology-kit
terrain-clipmap-ring-kit
terrain-horizon-skirt-kit
terrain-lod-morph-policy-kit
terrain-lod-hysteresis-kit
terrain-lod-stitch-policy-kit
terrain-seam-safety-kit
terrain-origin-rebase-kit
terrain-floating-origin-kit
terrain-world-coordinate-kit
terrain-heightfield-source-kit
terrain-height-sampler-kit
terrain-height-edit-field-kit
terrain-paint-field-kit
terrain-brush-command-kit
terrain-brush-falloff-kit
terrain-smooth-brush-kit
terrain-raise-lower-brush-kit
terrain-color-paint-brush-kit
terrain-biome-field-kit
terrain-material-rule-kit
terrain-slope-classifier-kit
terrain-roughness-field-kit
terrain-wetness-field-kit
terrain-drainage-field-kit
terrain-canyon-mask-kit
terrain-terrace-field-kit
terrain-ridge-field-kit
terrain-scree-field-kit
terrain-alluvial-field-kit
terrain-erosion-approximation-kit
terrain-collision-sampler-kit
terrain-raycast-surface-kit
terrain-grounding-sampler-kit
terrain-spawn-surface-kit
terrain-prop-scatter-field-kit
terrain-grass-density-field-kit
terrain-rock-placement-field-kit
terrain-path-mask-field-kit
terrain-trail-decal-field-kit
terrain-waterline-field-kit
terrain-river-spline-field-kit
terrain-debug-snapshot-kit
```

## GPU terrain kit inventory

```txt
gpu-terrain-performance-circle-kit
gpu-terrain-view-cone-density-kit
gpu-terrain-density-field-kit
gpu-terrain-radial-mesh-kit
gpu-terrain-frustum-mesh-kit
gpu-terrain-clipmap-ring-kit
gpu-terrain-horizon-skirt-kit
gpu-terrain-heightfield-kit
gpu-terrain-height-texture-kit
gpu-terrain-height-buffer-kit
gpu-terrain-paint-field-kit
gpu-terrain-paint-texture-kit
gpu-terrain-color-layer-kit
gpu-terrain-height-edit-layer-kit
gpu-terrain-normal-field-kit
gpu-terrain-slope-field-kit
gpu-terrain-roughness-field-kit
gpu-terrain-biome-field-kit
gpu-terrain-material-field-kit
gpu-terrain-wetness-field-kit
gpu-terrain-drainage-field-kit
gpu-terrain-canyon-field-kit
gpu-terrain-terrace-field-kit
gpu-terrain-ridge-field-kit
gpu-terrain-scree-field-kit
gpu-terrain-alluvial-field-kit
gpu-terrain-fog-field-kit
gpu-terrain-horizon-field-kit
gpu-terrain-brush-preview-kit
gpu-terrain-density-debug-kit
gpu-terrain-wire-density-overlay-kit
gpu-terrain-origin-rebase-kit
gpu-terrain-uniform-pack-kit
gpu-terrain-bind-group-kit
gpu-terrain-resource-cache-kit
gpu-terrain-buffer-pool-kit
gpu-terrain-texture-atlas-kit
gpu-terrain-dirty-region-kit
gpu-terrain-frame-budget-kit
gpu-terrain-profiler-kit
```

## Compute-specific terrain kit inventory

Use `compute-*` only when the kit owns a real compute shader/pass.

```txt
compute-terrain-density-field-kit
compute-terrain-normal-pass-kit
compute-terrain-slope-pass-kit
compute-terrain-roughness-pass-kit
compute-terrain-visibility-field-kit
compute-terrain-view-importance-pass-kit
compute-terrain-screen-error-pass-kit
compute-terrain-triangle-budget-pass-kit
compute-terrain-paint-apply-kit
compute-terrain-brush-stamp-kit
compute-terrain-height-edit-pass-kit
compute-terrain-color-edit-pass-kit
compute-terrain-smooth-edit-pass-kit
compute-terrain-erosion-preview-pass-kit
compute-terrain-hydraulic-erosion-pass-kit
compute-terrain-thermal-erosion-pass-kit
compute-terrain-drainage-pass-kit
compute-terrain-wetness-pass-kit
compute-terrain-flow-accumulation-pass-kit
compute-terrain-canyon-carve-pass-kit
compute-terrain-ridge-detect-pass-kit
compute-terrain-terrace-pass-kit
compute-terrain-scree-pass-kit
compute-terrain-alluvial-deposit-pass-kit
compute-terrain-biome-classify-pass-kit
compute-terrain-material-index-pass-kit
compute-terrain-grass-density-pass-kit
compute-terrain-prop-mask-pass-kit
compute-terrain-collision-height-cache-kit
compute-terrain-raycast-height-cache-kit
compute-terrain-indirect-draw-plan-kit
compute-terrain-draw-compaction-kit
compute-terrain-lod-morph-pass-kit
compute-terrain-seam-stitch-pass-kit
compute-terrain-debug-readback-kit
```

## Shader terrain kit inventory

```txt
shader-terrain-height-displacement-kit
shader-terrain-density-debug-kit
shader-terrain-slope-material-kit
shader-terrain-biome-material-kit
shader-terrain-height-gradient-kit
shader-terrain-normal-reconstruct-kit
shader-terrain-triplanar-material-kit
shader-terrain-rock-material-kit
shader-terrain-grass-material-kit
shader-terrain-sand-material-kit
shader-terrain-snow-material-kit
shader-terrain-wetness-material-kit
shader-terrain-canyon-material-kit
shader-terrain-ridge-highlight-kit
shader-terrain-scree-material-kit
shader-terrain-alluvial-material-kit
shader-terrain-horizon-fog-kit
shader-terrain-distance-haze-kit
shader-terrain-atmosphere-blend-kit
shader-terrain-paint-color-blend-kit
shader-terrain-paint-height-blend-kit
shader-terrain-brush-preview-kit
shader-terrain-wire-overlay-kit
shader-terrain-density-band-overlay-kit
shader-terrain-performance-heatmap-kit
shader-terrain-debug-normals-kit
shader-terrain-debug-slope-kit
shader-terrain-debug-biome-kit
shader-terrain-debug-height-kit
shader-terrain-debug-uv-kit
```

## Adapter kit inventory

```txt
webgl-terrain-render-adapter-kit
webgl-terrain-shader-displacement-adapter-kit
webgl-terrain-radial-mesh-adapter-kit
webgl-terrain-paint-texture-adapter-kit
webgl-terrain-debug-overlay-adapter-kit

webgpu-terrain-render-adapter-kit
webgpu-terrain-compute-adapter-kit
webgpu-terrain-storage-buffer-adapter-kit
webgpu-terrain-storage-texture-adapter-kit
webgpu-terrain-bind-group-adapter-kit
webgpu-terrain-pipeline-cache-adapter-kit
webgpu-terrain-indirect-draw-adapter-kit
webgpu-terrain-profiler-adapter-kit
webgpu-terrain-fallback-policy-kit
webgpu-terrain-device-capability-kit

wgpu-terrain-render-adapter-kit
wgpu-terrain-native-vulkan-adapter-kit
wgpu-terrain-native-metal-adapter-kit
wgpu-terrain-native-d3d12-adapter-kit
wgpu-terrain-wasm-webgpu-adapter-kit

vulkan-terrain-render-adapter-kit
vulkan-terrain-hardware-tessellation-adapter-kit
vulkan-terrain-mesh-shader-adapter-kit
vulkan-terrain-compute-adapter-kit
vulkan-terrain-indirect-draw-adapter-kit
```

## Renderer-core kit inventory

```txt
gpu-device-capability-kit
gpu-resource-lifetime-kit
gpu-buffer-pool-kit
gpu-texture-pool-kit
gpu-bind-group-cache-kit
gpu-pipeline-cache-kit
gpu-shader-module-registry-kit
gpu-render-graph-kit
gpu-compute-graph-kit
gpu-pass-scheduler-kit
gpu-frame-budget-kit
gpu-timestamp-query-kit
gpu-profiler-kit
gpu-debug-label-kit
gpu-readback-gate-kit
gpu-dirty-region-kit
gpu-uniform-ring-buffer-kit
gpu-storage-buffer-layout-kit
gpu-texture-format-policy-kit
gpu-fallback-policy-kit
```

## NexusRealtime integration kit inventory

```txt
nexus-terrain-runtime-bridge-kit
nexus-terrain-snapshot-kit
nexus-terrain-command-buffer-kit
nexus-terrain-input-router-kit
nexus-terrain-brush-command-kit
nexus-terrain-render-policy-kit
nexus-terrain-gpu-resource-descriptor-kit
nexus-terrain-debug-inspector-kit
nexus-terrain-smoke-contract-kit
nexus-terrain-deterministic-seed-kit
nexus-terrain-edit-event-kit
nexus-terrain-paint-event-kit
nexus-terrain-density-event-kit
nexus-terrain-profiler-event-kit
nexus-terrain-fallback-event-kit
nexus-renderer-backend-selection-kit
nexus-webgpu-capability-probe-kit
nexus-webgl-fallback-probe-kit
nexus-renderer-snapshot-kit
nexus-renderer-proof-kit
```

## Validation and proof kit inventory

```txt
validate-terrain-single-mesh-kit
validate-terrain-no-cpu-rebuild-kit
validate-terrain-no-square-patch-lod-kit
validate-terrain-performance-circle-kit
validate-terrain-view-cone-density-kit
validate-terrain-density-bands-kit
validate-terrain-stable-buffer-kit
validate-terrain-gpu-displacement-kit
validate-terrain-paint-dirty-region-kit
validate-terrain-normal-generation-kit
validate-terrain-fallback-webgl-kit
validate-terrain-webgpu-capability-kit
validate-terrain-no-readback-stall-kit
validate-terrain-pipeline-cache-kit
validate-terrain-frame-budget-kit
validate-terrain-debug-snapshot-kit
smoke-terrain-runtime-contract-kit
smoke-terrain-gpu-render-kit
smoke-terrain-paint-kit
smoke-terrain-density-debug-kit
```

## Implementation invariants

```txt
No square patch LOD.
No terrain patch ECS entities.
No CPU geometry rebuild on camera movement.
No CPU normal rebuild for the terrain mesh.
No full mesh upload after brush edits.
No GPU readback in the frame loop.
Camera movement updates uniforms only.
Brush edits update dirty GPU paint regions only.
The reusable kit remains renderer-neutral.
The host or adapter owns renderer objects.
```
