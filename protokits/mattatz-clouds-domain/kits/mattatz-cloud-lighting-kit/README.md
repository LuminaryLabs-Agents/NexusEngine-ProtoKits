# Mattatz Cloud Lighting Kit

Cloud lighting descriptor kit for the `mattatz-clouds-domain`.

## Owns

- sun direction intent
- sun color and intensity
- rim lighting value
- silver-lining value
- underside darkness value
- atmospheric fade value

## Public implementation

```js
import { createMattatzCloudLightingKit } from "@luminarylabs/nexusrealtime-protokits/mattatz-clouds-domain";
```

Renderers consume these values when shading volumetric cloud boxes, impostor cards, or horizon cloud bands.
