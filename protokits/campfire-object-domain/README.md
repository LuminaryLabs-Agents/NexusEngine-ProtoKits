# campfire-object-domain

Renderer-agnostic campfire object graph domain.

## Owns

- campfire root object
- firewood ring descriptor
- ember bed descriptor
- flame emitter descriptor
- smoke emitter anchor
- warm light descriptor
- campfire interaction affordances
- campfire collision radius

## Does not own

- Three.js meshes
- actual lights
- actual particles
- DOM, Canvas, WebGL, or sound

Renderer hosts convert the object graph into logs, embers, flame meshes, lights, and smoke systems.
