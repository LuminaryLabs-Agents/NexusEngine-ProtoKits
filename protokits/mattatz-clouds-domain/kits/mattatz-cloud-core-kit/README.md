# Mattatz Cloud Core Kit

Base cloud primitive descriptor for the `mattatz-clouds-domain`.

## Owns

- box-bounded cloud volume intent
- density, softness, opacity, and coverage
- noise seed, octaves, turbulence, and billow policy
- raymarch step policy
- color, underside color, and scattering coefficients
- adapter hint for a `THREE.Cloud`-style renderer implementation

## Does not own

- Three.js objects
- DOM or Canvas setup
- WebGL/WebGPU shader compilation
- scene camera or terrain

## Public implementation

The implementation is exported from the parent domain entry:

```js
import { createMattatzCloudCoreKit } from "@luminarylabs/nexusengine-protokits/mattatz-clouds-domain";
```

Use `createMattatzCloudPrimitiveDescriptor()` when a renderer host only needs the descriptor object.