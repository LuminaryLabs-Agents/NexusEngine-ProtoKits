# VR Platformer Kit Suite

Maximum-feature ProtoKit suite for a simple 2D platformer presented as a 6DOF spatial board in VR.

## Independent kit entrypoints

```txt
platformer-level-domain-kit
platformer-avatar-domain-kit
platformer-physics-system-kit
platformer-collision-domain-kit
platformer-object-domain-kit
platformer-camera-domain-kit
platformer-render-descriptor-kit
platformer-effects-domain-kit
platformer-parallax-domain-kit
platformer-objective-sequence-kit
xr-pose-domain-kit
xr-input-adapter-kit
spatial-anchor-domain-kit
spatial-game-board-domain-kit
xr-comfort-domain-kit
xr-platformer-render-adapter-kit
```

`stereoscopic-render-domain-kit` is composed beside this suite for left/right XR eye descriptors.

## Purpose

The suite keeps the implementation shared, while every capability remains importable as an independent ProtoKit folder.

## Boundary

```txt
Kits own:
  platformer state
  platformer physics helpers
  collision meaning
  object events
  2D camera descriptors
  render descriptors
  sequence state
  XR pose/input descriptors
  spatial board transforms
  comfort policy
  XR render plan descriptors

Host owns:
  Canvas/WebGL/Three drawing
  actual WebXR/OpenXR session
  raw runtime handles
  frame presentation
```

## Headless helpers

```js
simulatePlatformerStep(avatar, level, dt, config)
createVrPlatformerMaximumFeatureKits(NexusRealtime, options)
```

## Smoke test

```txt
node tests/vr-platformer-kit-suite-smoke.test.mjs
```
