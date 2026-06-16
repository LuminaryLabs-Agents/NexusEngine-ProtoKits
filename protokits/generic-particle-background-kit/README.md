# Generic Particle Background Kit

Generic Particle Background Kit provides renderer-neutral descriptors for dynamic ambient particle backgrounds.

It does not draw WebGL, Canvas, DOM, or Three.js particles directly. It defines the background layers, colors, speeds, drift, twinkle, and pulses that a renderer host can draw.

## Install

```js
import { createGenericParticleBackgroundKit } from "./index.js";

const engine = NexusRealtime.createRealtimeGame({
  kits: [
    createGenericParticleBackgroundKit(NexusRealtime, {
      preset: "nexusGallery",
      intensity: 1
    })
  ]
});
```

## Public API

```txt
engine.particleBackground.configure(config, payload)
engine.particleBackground.setPreset(preset, config)
engine.particleBackground.setEnabled(enabled, payload)
engine.particleBackground.pulse(payload)
engine.particleBackground.getState()
engine.particleBackground.getDescriptor()
```

## Pure descriptor helper

```js
const descriptor = createParticleBackgroundDescriptor({ preset: "starfield" });
```

Use the pure helper when a static host wants the same data model without creating a runtime engine.
