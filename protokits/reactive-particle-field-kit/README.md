# Reactive Particle Field Kit

Status: protokit

Renderer-facing particle descriptor kits for reactive, shader-style visual effects. These kits provide particle state, burst APIs, lifecycle updates, and GLSL-like fragment shader snippets for renderers that want to compile or emulate GPU particle effects.

## Includes

- `reactive-particle-field-kit`
- `gpu-spark-burst-kit`
- `gpu-dust-cloud-kit`
- `gpu-water-mist-kit`
- `gpu-bubble-column-kit`
- `gpu-rune-spark-kit`
- `gpu-sound-wave-particle-kit`
- `gpu-lantern-mote-kit`
- `gpu-impact-chip-kit`
- `gpu-creature-alert-pulse-kit`
- `gpu-door-awakening-kit`
- `gpu-water-surface-shimmer-kit`
- `gpu-shadow-flicker-kit`
- `gpu-ambient-cave-dust-kit`
- `gpu-foam-line-kit`

## Boundary

These kits own renderer-facing particle descriptors, shader snippets, and particle lifetimes. They do not own gameplay truth, hit damage, sound propagation, input handling, DOM, Canvas drawing, or WebGL context setup.

## Usage

```js
import { createGpuSparkBurstKit } from "@luminarylabs/nexusengine-protokits/gpu-spark-burst-kit";

const kit = createGpuSparkBurstKit(NexusEngine);
```

The renderer consumes `getDescriptors()` and decides whether to draw via Canvas, WebGL, Three.js, or native GPU pipelines.
