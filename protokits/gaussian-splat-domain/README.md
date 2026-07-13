# Gaussian Splat Domain ProtoKit

Experimental composed Domain Service Kit for provider-neutral Gaussian-splat project state, source manifests, deterministic validation, reconstruction jobs, durable assets, and renderer-neutral presentation descriptors.

## Boundary

Owns serializable Gaussian-splat meaning and lifecycle state. It does not own filesystems, ZIP creation, provider HTTP or browser automation, CUDA/Python reconstruction, Three.js objects, workers, GPU uploads, or UI.

## Install

```js
import * as NexusEngine from "nexusengine";
import { createGaussianSplatKits } from "@luminarylabs/nexusengine-protokits/gaussian-splat-domain";

const engine = NexusEngine.createRealtimeGame({ kits: createGaussianSplatKits(NexusEngine) });
engine.n.gaussianSplat.createProject({ id: "museum-room" });
```

## Domain paths

- `n:gaussian-splat`
- `n:gaussian-splat:project`
- `n:gaussian-splat:source`
- `n:gaussian-splat:validation`
- `n:gaussian-splat:reconstruction`
- `n:gaussian-splat:asset`
- `n:gaussian-splat:presentation`

## Adapters

`createManualGaussianSplatProviderAdapter()` normalizes manual provider handoffs. `createThreeGaussianSplatRendererAdapter()` is a host bridge that accepts callbacks and never stores renderer objects in engine snapshots.
