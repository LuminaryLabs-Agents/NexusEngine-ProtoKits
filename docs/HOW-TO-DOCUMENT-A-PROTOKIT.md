# How to Document a ProtoKit

Use this guide when adding or improving documentation for any kit under `protokits/`.

## Steps

1. Read the source file and adjacent tests.
2. Identify the reusable domain.
3. Identify public factory or factories.
4. Extract `requires` and `provides` tokens.
5. Extract resources and events.
6. Extract public engine API methods.
7. Identify whether the kit outputs descriptors.
8. Identify renderer boundary and non-ownership.
9. Identify what the kit scales with for performance.
10. Identify snapshot, reset, and loadSnapshot behavior.
11. Add or update `README.md` using `docs/templates/PROTOKIT-README.md`.
12. Add or update `kit.manifest.json` when the kit is public or significant.
13. Update `docs/PROTOKIT-INVENTORY.md` or rerun the inventory generator.
14. Add tests or document missing tests.
15. Add promotion notes if the kit is stable or approaching promotion.

## Required caution

Do not claim support for reset, loadSnapshot, replay, save/load, telemetry, performance degradation, renderer descriptors, or deterministic behavior unless the source actually provides it.

## README minimum

A significant kit README should include:

```txt
Domain
Purpose
Kit type
Factory
Requires
Provides
Resources
Events
Public API
Data contract
Renderer boundary
Performance contract
Snapshot/reset behavior
Compatible kits
Headless example
Browser/host example
Tests
Known limitations
Promotion status
Promotion criteria
```

## Manifest minimum

A significant `kit.manifest.json` should include:

```txt
id
domain
type
status
factory
requires
provides
resources
events
publicApi
descriptors
rendererBoundary
performance
snapshot
promotion
```

## Renderer boundary rule

Reusable kits may output descriptors. They must not own DOM, Canvas, WebGL, Three.js objects, browser globals, asset loading, input listeners, or `requestAnimationFrame` unless they are explicitly host or renderer adapters.
