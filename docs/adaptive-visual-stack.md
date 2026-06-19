# Adaptive Visual Stack

The adaptive visual stack is a 0.0.2 ProtoKit layer for high-fidelity rendering policy, descriptors, and backend adapters.

It is not a single high-end renderer. It is a portable visual domain that can scale from Canvas to WebGL to WebGPU.

## Kits

- `adaptive-visual-core` — shared helpers and factory exports.
- `visual-policy-domain-service-kit` — visual intent, target frame budget, quality limits, and accessibility preferences.
- `render-capability-kit` — browser/device capability profile and fallback reason.
- `render-quality-budget-kit` — adaptive render scale, LOD, shadows, particles, and vegetation density.
- `render-graph-kit` — backend-neutral render pass descriptors.
- `material-domain-service-kit` — normalized PBR-style material descriptors from simple visual inputs.
- `lighting-domain-service-kit` — sun, ambient, exposure, probes, and shadow policy descriptors.
- `atmosphere-domain-service-kit` — fog, sky, clouds, wind, precipitation, and visibility descriptors.
- `environment-content-kit` — seeded terrain, biome, and vegetation content descriptors.
- `render-culling-system-kit` — visible-set filtering for renderables and world instances.
- `lod-selection-system-kit` — distance/profile based LOD selection.
- `instance-batching-system-kit` — stable instance batching by mesh, material, and LOD.
- `asset-quality-kit` — texture, mesh, impostor, atlas, and fallback variant selection.
- `canvas-render-adapter-kit` — Canvas-safe frame planning.
- `webgl-render-adapter-kit` — WebGL/Three-compatible frame planning.
- `webgpu-render-adapter-kit` — WebGPU/compute frame planning.

## Boundary

These kits own visual meaning, descriptors, and adaptive policy.

They do not own DOM nodes, requestAnimationFrame, Three.js scene objects, or browser input.

Renderer hosts consume the descriptors and decide how to draw them.

## Import

```js
import {
  createAdaptiveVisualStackKits,
  createMaterialDomainServiceKit,
  createLightingDomainServiceKit,
  createAtmosphereDomainServiceKit
} from "@luminarylabs/nexusrealtime-protokits/adaptive-visual-core";
```

Or import a wrapper directly:

```js
import { createRenderQualityBudgetKit } from "@luminarylabs/nexusrealtime-protokits/render-quality-budget-kit";
```

## Promotion notes

Promote only after at least two standalone experiments consume the descriptors through different renderer adapters.
