# Render Layer Kit

`render-layer-kit` is a NexusEngine ProtoKit for renderer-agnostic visual composition.

It does **not** draw to Canvas, WebGL, or Three.js. It turns scene descriptors, material descriptors, fog definitions, dynamic visual signals, and optional scatter resources into stable render buckets and visual pipeline resources that a renderer host can consume.

## Purpose

The kit targets three high-fidelity rendering problems:

```txt
Mesh layering / world composition
  Stable render buckets and draw order.

Lighting / atmosphere / quality state
  Fog volume descriptors and cheap volumetric light intent.

Shader/material pipeline
  Material-library descriptors that renderers can map to Canvas, WebGL, or Three.js.
```

## Import

```js
import {
  createRenderLayerKit,
  createVisualPipelineKit,
  createFoglineVisualPreset
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/render-layer-kit/index.js";
```

## Install

```js
const realismKit = NexusEngine.createRealismKit({
  quality: "adaptive",
  preset: createFoglineVisualPreset()
});

const renderLayerKit = createRenderLayerKit(NexusEngine, {
  renderDescriptorResource: NexusEngine.RenderDescriptorState,
  realismSnapshotResource: realismKit.definitions.resources.RealismSnapshot,
  extraObjectResources: [forestKit.resources.ForestPlacementSnapshot],
  preset: createFoglineVisualPreset()
});

const engine = NexusEngine.createRealtimeGame({
  kits: [
    NexusEngine.createRenderDescriptorKit(level),
    realismKit,
    forestKit,
    renderLayerKit
  ]
});
```

## Public engine API

```js
engine.visualPipeline.getState()
engine.visualPipeline.snapshot()
engine.visualPipeline.setViewer({ x, y, z })
engine.visualPipeline.setSignals({ bySource: { "relay-01": { intensity: 1 } } })
engine.visualPipeline.bucket("interactive")
engine.visualPipeline.material("relay-emissive")
engine.visualPipeline.validate()
engine.visualPipeline.rebuild()
```

## Resources

```txt
visual.pipeline.state
visual.renderLayers.state
visual.materialLibrary.state
visual.fogVolumes.state
visual.volumetricLighting.state
visual.signals.state
visual.validation.state
```

## Events

```txt
visual.pipeline.rebuild
visual.signals.updated
```

## Outputs

`visual.renderLayers.state`

```js
{
  layerOrder,
  objects,
  buckets: {
    terrain: [],
    "instanced-scatter": [],
    interactive: [],
    emissive: [],
    "volumetric-light": [],
    "transparent-fog": []
  },
  drawOrder,
  stats
}
```

`visual.materialLibrary.state`

```js
{
  materials,
  byId,
  roles
}
```

`visual.fogVolumes.state`

```js
{
  atmosphere,
  fogVolumes
}
```

`visual.volumetricLighting.state`

```js
{
  quality,
  implementation,
  lights
}
```

## Renderer responsibilities

The renderer host decides how to draw each descriptor.

Examples:

```txt
Canvas 2D
  Use buckets for correct draw order.
  Draw volumetric lights as gradients/cones.
  Draw fog volumes as translucent depth haze.

Custom WebGL
  Compile shaders from material ids.
  Use buckets as render passes.
  Use volumetric descriptors as light/fog meshes.

Three.js
  Map materials to MeshStandardMaterial/ShaderMaterial.
  Map fog volumes to transparent meshes or post-processing.
  Map volumetric lights to cone meshes, light shafts, or bloom sprites.
```

## What this kit does not own

```txt
DOM
Canvas drawing
Three.js objects
WebGL context
requestAnimationFrame
gameplay rules
objective completion
input handling
```

## Known limitations

```txt
The kit produces descriptors only.
True raymarched volumetrics are renderer-specific.
Depth-aware fog requires a renderer with depth information.
The default preset is tuned for Fogline-style dark forests but can be overridden.
```

## Promotion criteria

Promote when:

```txt
The resource names stabilize.
At least two games use the bucket/material/fog descriptor model.
Renderer hosts consume it in both Canvas/WebGL or Canvas/Three configurations.
Headless tests verify sorting, validation, material fallback, fog generation, and volumetric light generation.
```
