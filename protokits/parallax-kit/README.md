# parallax-kit

`parallax-kit` is the core 2D / 2.5D visual-depth motion Domain Service Kit.

It keeps parallax out of renderer code by owning depth planes, parallax layers, camera-relative offsets, ambient scroll, wrapping/tile descriptors, depth fog hints, foreground occlusion hints, validation, and debug reports.

## Domain boundary

```txt
parallax
  = visual depth motion for 2D and 2.5D worlds.
```

## Internal service breakdown

```txt
parallax-kit
├─ DepthPlaneService
├─ LayerService
├─ CameraOffsetService
├─ ScrollService
├─ WrapService
├─ BindingService
├─ OcclusionService
├─ FogDepthService
├─ CullingService
├─ DescriptorService
└─ DebugService
```

These are internal services, not separate physical kits.

## Public API

```js
engine.parallax.configure(config);
engine.parallax.setCamera({ x, y, zoom, trauma });
engine.parallax.setProfile("default-parallax");
engine.parallax.bindObject("cloud-01", { layerId: "far-clouds" });
engine.parallax.getState();
engine.parallax.getDescriptors();
engine.parallax.getDebugReport();
```

## Renderer boundary

This kit does not draw to Canvas, WebGL, SVG, or Three.js.

A host renderer reads `engine.parallax.getDescriptors()` and draws the returned layer/tile/object descriptors.
