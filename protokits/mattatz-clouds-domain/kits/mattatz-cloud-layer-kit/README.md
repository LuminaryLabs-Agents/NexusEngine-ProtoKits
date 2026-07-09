# Mattatz Cloud Layer Kit

Altitude-band composition kit for the `mattatz-clouds-domain`.

## Owns

- low, mid, and high cloud layer descriptors
- layer altitude ranges
- layer thickness
- deterministic total cloud distribution from 1 to 20 clouds
- layer coverage, density, and softness
- altitude-specific drift speed
- per-layer render cost policy

## Public implementation

Import from the parent domain entry:

```js
import { createMattatzCloudLayerKit } from "@luminarylabs/nexusengine-protokits/mattatz-clouds-domain";
```
