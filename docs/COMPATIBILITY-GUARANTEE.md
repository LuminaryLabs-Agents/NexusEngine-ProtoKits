# Compatibility Guarantee

The DSK composition and documentation rollout is additive.

## Guaranteed during this rollout

- No existing public export paths are removed.
- The wildcard ProtoKit export remains available.
- Existing kit factories remain available.
- Existing demos, routes, experiments, and tests remain compatibility consumers.
- New composition kits are added beside existing families.
- Existing game-specific hosts may be bridged before replacement.
- Legacy kits without READMEs or manifests produce non-blocking documentation warnings.
- Documentation should not claim behavior that is not implemented.

## Why warnings are allowed

The repo contains many legacy and experimental kits. Failing all undocumented kits immediately would block useful work and encourage inaccurate rushed docs. The rollout therefore uses warnings for legacy gaps and stricter checks for new composition-layer docs.

## What can fail checks

- Invalid JSON manifests.
- New composition kits missing required README or manifest coverage.
- Boundary manifests that claim renderer ownership incorrectly.
- Documentation tooling errors.

## Migration rule

Bridge first, replace later. Existing route registries, generated hosts, and game-specific hosts should be represented through compatibility bridges before any direct rewrite.
