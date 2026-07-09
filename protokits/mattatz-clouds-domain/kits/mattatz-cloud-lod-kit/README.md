# Mattatz Cloud LOD Kit

Performance-policy kit for the `mattatz-clouds-domain`.

## Owns

- near volumetric descriptor policy
- mid reduced-cost descriptor policy
- far impostor or horizon-band descriptor policy
- stable descriptor IDs for renderer-side pooling
- distance thresholds for near, mid, and far cloud rendering

## Public implementation

```js
import { createMattatzCloudLodKit } from "@luminarylabs/nexusengine-protokits/mattatz-clouds-domain";
```

The kit does not build renderer objects. It only tells a host what kind of cloud rendering should be used at each distance band.
