# Contract: Generic Particle Background Kit

## Resource

```txt
genericParticleBackground.state
```

## Events

```txt
genericParticleBackground.configure
genericParticleBackground.setPreset
genericParticleBackground.setEnabled
genericParticleBackground.pulse
genericParticleBackground.updated
```

## Descriptor shape

```js
{
  version,
  id,
  presetId,
  enabled,
  intensity,
  timeScale,
  parallax,
  background: {
    base: [0.006, 0.007, 0.008],
    haze: [0.02, 0.05, 0.065]
  },
  layers: [
    {
      id,
      count,
      scale,
      speed,
      drift: [x, y],
      twinkle,
      size,
      opacity,
      color: [r, g, b],
      seed,
      blend
    }
  ],
  uniforms: {
    layerCount,
    totalParticles
  }
}
```

## State shape

```js
{
  version,
  id,
  descriptor,
  pulses,
  lastReason
}
```

## Renderer boundary

Renderers can draw the descriptor. They must not use this kit to mutate gameplay state.
