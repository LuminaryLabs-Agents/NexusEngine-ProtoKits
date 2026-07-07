# grass-texture-domain

Renderer-agnostic grass texture descriptor domain.

## Owns

- blade color ramp
- root-to-tip gradient intent
- dry/yellow variation intent
- alpha profile descriptor
- normal hint descriptor
- atlas layout descriptor

## Does not own

- Three.js textures
- CanvasTexture creation
- DOM or WebGL

Renderer hosts convert descriptors into textures, uniforms, or material variants.
