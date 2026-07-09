# Adaptive Visual Core

Shared implementation for the adaptive visual stack kits.

This core exports the factories for the portable visual policy, capability, quality budget, render graph, material, lighting, atmosphere, environment, culling, LOD, batching, asset quality, Canvas adapter, WebGL adapter, and WebGPU adapter kits.

The core exists so each wrapper kit can stay small while all visual descriptor logic remains consistent.

## Install pattern

```js
import { createAdaptiveVisualStackKits } from "@luminarylabs/nexusengine-protokits/adaptive-visual-core";

const kits = createAdaptiveVisualStackKits(NexusEngine, {
  visualPolicy: { preferredProfile: "balanced" },
  renderCapability: { webgl2: true, webgpu: false },
  environmentContent: { seed: "demo", instanceCount: 128 }
});
```

## Boundary

Simulation-neutral and renderer-descriptor-first.

No DOM. No Canvas drawing. No Three.js object mutation. No requestAnimationFrame.
