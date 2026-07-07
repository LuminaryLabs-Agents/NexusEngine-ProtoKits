# camera-mode-domain

Renderer-agnostic camera mode descriptor domain.

## Owns

- orbit / inspection / first-person mode intent
- zoom thresholds
- first-person movement settings
- first-person anchor and bounds references
- inspection focus intent

## Does not own

- Three.js cameras
- DOM input
- pointer lock
- renderer objects

Renderer hosts consume descriptors and implement camera behavior.
