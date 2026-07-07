# fenced-clearing-domain

Renderer-agnostic fenced clearing object graph domain.

## Owns

- fenced clearing root object
- fence ring descriptor
- fence post descriptors
- fence rail descriptors
- gate descriptor
- walkable area descriptor
- first-person spawn anchor
- circular movement boundary
- grass exclusion zones

## Does not own

- Three.js meshes
- camera input implementation
- DOM or WebGL

Renderer hosts convert the graph to fence meshes and use the movement/camera descriptors for first-person mode.
