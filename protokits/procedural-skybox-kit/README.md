# Procedural Skybox Kit

Renderer-agnostic skybox descriptor state for procedural skies.

## Services

- `engine.proceduralSkybox.getDescriptor()`
- `engine.proceduralSkybox.setTimeOfDay(value)`
- `engine.proceduralSkybox.set(config)`
- `engine.proceduralSkybox.snapshot()`

## Provides

- `sky:procedural-skybox`
- `sky:skybox`
- `lighting:sun-moon-cycle`
- `render:sky-descriptor`

## Boundary

This kit emits descriptors only. It does not create Three.js materials, geometries, renderers, canvases, or shader objects.
