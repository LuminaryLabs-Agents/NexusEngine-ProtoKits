# Changelog

All notable ProtoKits documentation, compatibility, and composition-layer changes are recorded here.

## 2026-06-24 — Documentation and changelog operating manual

### Added

- Documentation index at `docs/README.md`.
- Full implementation narrative at `docs/IMPLEMENTATION-NARRATIVE.md`.
- DSK composition decision records at `docs/DECISIONS-2026-06-DSK-COMPOSITION.md`.
- Detailed composition upgrade changelog at `docs/CHANGELOG-2026-06-DSK-COMPOSITION-UPGRADE.md`.
- Documentation backlog and docs push checklist.
- Compatibility guarantee documenting non-breaking rollout rules.
- ProtoKit family overview docs for composition, aerial, environment fidelity, RPG/social, scoped RPG, spatial authoring, generic defense, vertical climb, and arcade race families.
- README stubs for major legacy kit families.
- Documentation coverage checker for README/manifest rollout tracking.

### Why

This pass records the reasoning and implementation path from game ideas to DSK composition architecture, so future agents and engineers can understand why ProtoKits now has deploy manifests, scene lifecycle kits, save deltas, host shell contracts, scene graph state, compatibility bridges, and first-class performance/documentation contracts.

### Compatibility

- No existing public export paths were removed.
- Existing routes, experiments, demos, and kit factories remain compatibility consumers.
- Documentation coverage checks warn on legacy gaps and only fail for required new composition-layer documentation.

## 2026-06-24 — Additive DSK composition layer

### Added

- Master upgrade plan.
- Ownership rules.
- Performance contracts.
- Electron desktop composition guide.
- House domain boundaries example.
- Composition kits documentation.
- ProtoKit inventory seed.
- Documentation templates.
- `domain-boundary-kit`.
- `deploy-manifest-kit`.
- `deploy-registry-kit`.
- `asset-pack-manifest-kit`.
- `scene-lifecycle-kit`.
- `scene-transition-kit`.
- `save-delta-kit`.
- `host-shell-contract-kit`.
- `session-facade-kit`.
- `scene-graph-domain-kit`.
- `kit-registry`.
- `aaa-batch-deploy-bridge`.
- `gallery-registry-bridge`.
- `generated-route-host-bridge`.
- Manifest validators.
- Performance contract validator.
- Domain boundary checker.
- Composition-layer smoke test.

### Changed

- Package scripts now include manifest checks.
- Test script now includes composition-layer smoke coverage.
- Inventory now records the new composition layer.

### Compatibility

- Existing exports retained.
- Wildcard ProtoKit export retained.
- Existing routes and experiments were not rewritten.
- Legacy kits without manifests or READMEs produce non-blocking warnings.

### Why

- Support multi-scene app composition without making each scene an app.
- Keep hosts thin and renderer-specific behavior out of reusable kits.
- Make DSKs measurable, documentable, promotable, and composable.
