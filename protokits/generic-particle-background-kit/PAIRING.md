# Pairing: Generic Particle Background Kit

## Upstream kits

- `GenericSeedKit` can provide deterministic seed values.
- `GenericWeatherWindKit` can inform drift and ambient motion.
- `CameraCinematicMakerKit` can trigger pulse or intensity changes.
- `VisualFidelityMakerKit` can switch quality profiles.

## Downstream renderers

- WebGL fragment shaders can read descriptor-like constants for particle layers.
- Canvas renderers can draw particles from layer descriptors.
- Three.js renderers can map layers to instanced point sprites.
- HUD/menu/gallery hosts can use this as a background-only visual layer.

## Provides

```txt
render:particle-background
background:particles
visual:ambient-particles
```

## Requires

None.

## Bad pairings

Do not put game rules, objective logic, or collision logic in this kit.

Do not make this kit own a canvas, animation loop, DOM node, WebGL context, or Three.js scene.

## Example stack

```txt
GenericSeedKit
→ GenericParticleBackgroundKit
→ Gallery shader / Canvas host / Three renderer
```
