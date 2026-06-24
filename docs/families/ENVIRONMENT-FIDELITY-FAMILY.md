# Environment Fidelity Family

## Purpose

The environment fidelity family contains kits and kit groups for terrain, weather, vegetation, sky, materials, VFX, scene atmosphere, and renderer-agnostic visual targets.

## Representative areas

- `environment-kits`
- terrain and sampler domains
- vegetation placement domains
- lighting and sky descriptors
- material palettes
- visual pipeline / render-layer descriptors
- performance budget integration

## Recommended composition

```txt
performance budget
terrain/surface source
biome or environment data
vegetation placement
material palette
lighting/sky descriptors
render layer or visual pipeline descriptors
host renderer adapter
```

## Boundary rule

Environment fidelity kits may output descriptors, material IDs, and placement data. They should not create renderer objects, load assets, mutate Three.js objects, or own Canvas/WebGL.

## Documentation status

Family overview added. Individual kit docs should be added after the composition layer and open-world/flight foundation docs.
