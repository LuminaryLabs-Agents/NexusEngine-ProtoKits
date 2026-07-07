# grass-wind-domain

Renderer-agnostic grass wind descriptor domain.

## Owns

- wind direction
- base sway
- gust strength
- gust frequency
- per-patch phase seed
- sheltering hints from trees and paths

## Does not own

- Three.js shaders
- CPU animation loops
- renderer objects

Renderer hosts apply these descriptors through grass vertex shaders or batched instance attributes.
