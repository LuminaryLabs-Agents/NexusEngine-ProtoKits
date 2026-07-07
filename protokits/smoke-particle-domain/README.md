# smoke-particle-domain

Renderer-agnostic smoke particle descriptor domain.

## Owns

- smoke emitter descriptor
- particle count
- spawn radius
- lifespan
- rise speed
- wind response
- turbulence
- opacity and scale curve descriptors
- color ramp
- LOD policy

## Does not own

- Three.js Points or billboards
- actual GPU buffers
- texture creation
- DOM, Canvas, or WebGL

Renderer hosts convert descriptors into particles or billboards and update them with shared wind.
