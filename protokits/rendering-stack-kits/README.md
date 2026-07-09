# Rendering Stack ProtoKits

`rendering-stack-kits` is the designated ProtoKits module for high-fidelity, renderer-neutral NexusEngine rendering services.

The module is kit-shaped. Every factory returns an API object with `createRuntimeKit()`, so the stack can be installed through `createRealtimeGame({ kits })`. Generic kits expose descriptors, services, policies, and validation helpers. Renderer hosts still own WebGL, Three.js, WebGPU, Canvas, DOM, asset loading, requestAnimationFrame, and actual draw calls.

## Import

```js
import {
  createRenderingStackKits,
  createMeadowRenderingStackKits,
  createProceduralMeshKit,
  createTriangleWindingKit,
  createTerrainMeshKit,
  createThreeRenderAdapterKit
} from "@luminarylabs/nexusengine-protokits/rendering-stack-kits";
```

CDN path:

```js
import {
  createRenderingStackKits
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/rendering-stack-kits/index.js";
```

## Install

```js
const engine = NexusEngine.createRealtimeGame({
  kits: [
    ...createRenderingStackKits(NexusEngine)
  ]
});
```

For the meadow scene, start narrower:

```js
const engine = NexusEngine.createRealtimeGame({
  kits: [
    ...createMeadowRenderingStackKits(NexusEngine)
  ]
});
```

## Included Kits

### Core render data

```txt
render-descriptor-kit
render-object-registry-kit
transform-hierarchy-kit
dirty-render-set-kit
render-budget-kit
```

### Procedural geometry

```txt
procedural-mesh-kit
triangle-winding-kit
normal-tangent-kit
uv-unwrap-kit
mesh-lod-kit
mesh-instancing-kit
mesh-cache-kit
```

### World generation visuals

```txt
terrain-field-kit
terrain-mesh-kit
biome-field-kit
ground-contact-kit
vegetation-archetype-kit
vegetation-lod-kit
grass-field-kit
rock-formation-kit
structure-placement-kit
```

### Materials and shading

```txt
material-palette-kit
pbr-material-kit
procedural-texture-kit
triplanar-material-kit
vertex-color-kit
shader-variant-kit
cel-shaded-render-kit
```

### Lighting and atmosphere

```txt
lighting-policy-kit
sky-atmosphere-kit
fog-volume-kit
shadow-policy-kit
reflection-probe-kit
time-of-day-kit
weather-visual-kit
```

### Animation and living detail

```txt
wind-field-kit
skeletal-render-descriptor-kit
vertex-animation-kit
fur-shell-render-descriptor-kit
cloth-render-descriptor-kit
particle-field-kit
vfx-event-kit
```

### Camera and composition

```txt
camera-rig-kit
camera-collision-kit
cinematic-framing-kit
postprocess-policy-kit
diegetic-ui-render-kit
```

### Renderer adapters and validation

```txt
webgl-render-adapter-kit
three-render-adapter-kit
webgpu-render-adapter-kit
asset-loader-adapter-kit
browser-smoke-test-kit
performance-budget-kit
```

## Procedural Mesh Example

```js
const meshKit = createProceduralMeshKit();
const normalKit = createNormalTangentKit();
const uvKit = createUvUnwrapKit();

const terrainPatch = meshKit.createPlaneGrid({
  id: "meadow-patch",
  width: 32,
  depth: 32,
  segments: 32,
  heightAt(x, z) {
    return Math.sin(x * 0.08) * 0.5 + Math.cos(z * 0.11) * 0.35;
  }
});

const finalPatch = uvKit.withPlanarUvs({
  ...terrainPatch,
  normals: normalKit.computeVertexNormals(terrainPatch.positions, terrainPatch.indices)
}, { scale: 0.08 });
```

## Adapter Boundary

Adapter kits declare backend capabilities and descriptor expectations:

```js
const adapter = createThreeRenderAdapterKit();
const descriptor = adapter.createAdapterDescriptor();
```

The Three/WebGL/WebGPU renderer host should still do the drawing. The rendering stack provides renderer-neutral state and policy.

## Test

```sh
node protokits/rendering-stack-kits/tests/rendering-stack-kits.test.mjs
```

The test verifies that every factory creates a runtime-shaped kit, procedural mesh helpers produce valid triangle data, terrain descriptors generate normals, and full/meadow stack factories produce installable runtime-kit arrays.

## Promotion Notes

Promote individual kits only after they have stable descriptor names, headless tests, multi-scene validation, a clear adapter boundary, no DOM/Canvas/Three dependency in generic kits, and documented performance budget behavior.
