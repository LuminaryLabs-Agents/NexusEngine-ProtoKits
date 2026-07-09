# High-Fidelity Meadow Rendering Stack Kits

Version: `0.0.2`

This module adds the procedural meadow/cottage/sheep scene pieces to the rendering stack without putting WebGL or Three.js objects inside generic kits.

## Factories

- `createMeadowShaderVfxKit`
- `createProceduralGrassKit`
- `createProceduralCottageKit`
- `createProceduralSheepKit`
- `createHighFidelityMeadowSceneKit`
- `createHighFidelityMeadowRuntimeKits`

## Boundary

The kits emit renderer-neutral descriptors:

- custom GLSL shader descriptors
- procedural grass blade mesh and blade instance descriptors
- procedural cottage structure part descriptors
- procedural sheep body/wool-shell/grazing descriptors
- pollen/firefly VFX descriptors
- camera, lighting, fog, and performance budget descriptors

The browser experiment owns WebGL/Three.js material compilation, instancing, meshes, draw loop, and controls.

## Import

```js
import {
  createHighFidelityMeadowSceneKit
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/rendering-stack-kits/high-fidelity-meadow.js";
```

## Example

```js
const meadow = createHighFidelityMeadowSceneKit(null, {
  seed: "aaa-meadow-v002",
  grass: { bladeCount: 18000, radius: 92 },
  sheep: { count: 16 },
  vfx: { count: 1200 }
});

const scene = meadow.createSceneDescriptor();
```

No external art, meshes, textures, or model files are required.
