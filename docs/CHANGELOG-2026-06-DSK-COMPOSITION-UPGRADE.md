# June 2026 DSK Composition Upgrade Changelog

## Summary

This changelog records the June 24, 2026 ProtoKits composition upgrade and the documentation pass that followed it. The upgrade moved the repo from a collection of useful experimental kits toward an auditable composition system for multi-scene apps, deploy manifests, host contracts, save deltas, scene graphs, performance contracts, and compatibility bridges.

## Why this happened

The repo needed a durable way to compose multi-scene AAA-feeling desktop and web apps without making each scene its own app. The solution was to keep Electron/browser hosts thin, keep reusable behavior in kits, represent scenes as deploy manifests, track state with save deltas, and make performance, documentation, manifests, and promotion criteria first-class.

## Conversation-to-implementation arc

1. Prototype game ideas were reframed as AAA vertical-slice candidates.
2. AAA candidates were mapped onto familiar popular game templates with one strong gimmick.
3. Electron and DSK feasibility were discussed for AAA-feeling desktop applications.
4. DSKs were reframed as measurable performance units, not just reusable modules.
5. Per-kit documentation and machine-readable manifests became a requirement.
6. A house was clarified as content when specific and a reusable domain when modeled as rooms, doors, locks, safety, utility state, residents, upgrades, or haunting state.
7. Multi-scene apps were reframed as shared domains plus scene/deploy data, not many engines.
8. Runtime-adjacent behavior such as scene lifecycle, save deltas, deploy registry, host shell, and session facade was identified as composition kits.
9. The repo audit found existing DSK doctrine, deploy kit doctrine, spatial scene graph seeds, performance budget seeds, generic defense boundaries, generated route registries, and smoke tests.
10. The additive composition layer was implemented on `main` without removing existing exports or routes.
11. This documentation pass records the change, adds decision records, family docs, coverage checks, and a documentation backlog.

## Added: composition kits

- `domain-boundary-kit` — reusable boundary metadata and registry helpers.
- `deploy-manifest-kit` — deploy/scene manifest normalization and validation.
- `deploy-registry-kit` — scene/app manifest registry and kit-stack resolution.
- `asset-pack-manifest-kit` — lazy asset pack manifest registry.
- `scene-lifecycle-kit` — scene enter, pause, resume, exit, dispose state.
- `scene-transition-kit` — transition and preload intent state.
- `save-delta-kit` — delta-only scene save patches and merge helpers.
- `host-shell-contract-kit` — host/HUD/frame/error/restart/debug contracts.
- `session-facade-kit` — small host-facing dispatch/snapshot/restart/smoke/validation facade.
- `scene-graph-domain-kit` — general scene object graph, transforms, capabilities, and patches.
- `kit-registry` — pure helper registry for kit manifests.
- `aaa-batch-deploy-bridge` — converts AAA batch specs into deploy manifests.
- `gallery-registry-bridge` — converts gallery route entries into deploy manifests.
- `generated-route-host-bridge` — represents generated route hosts as host-shell contracts.

## Added: docs and templates

- `docs/MASTER-UPGRADE-PLAN.md`
- `docs/OWNERSHIP-RULES.md`
- `docs/PERFORMANCE-CONTRACTS.md`
- `docs/ELECTRON-DESKTOP-COMPOSITION.md`
- `docs/COMPOSITION-KITS.md`
- `docs/examples/HOUSE-DOMAIN-BOUNDARIES.md`
- `docs/templates/PROTOKIT-README.md`
- `docs/templates/DOMAIN-BOUNDARY.md`
- `docs/templates/PERFORMANCE-CONTRACT.md`
- `docs/templates/DEPLOY-KIT-MANIFEST.md`
- `docs/templates/DOMAIN-BOUNDARY-REVIEW.md`
- `CHANGELOG.md`
- `docs/README.md`
- `docs/IMPLEMENTATION-NARRATIVE.md`
- `docs/DECISIONS-2026-06-DSK-COMPOSITION.md`
- `docs/DOCUMENTATION-BACKLOG.md`
- `docs/HOW-TO-DOCUMENT-A-PROTOKIT.md`
- `docs/DOCS-PUSH-CHECKLIST.md`
- `docs/COMPATIBILITY-GUARANTEE.md`

## Added: tooling and tests

- `scripts/validate-kit-manifests.mjs`
- `scripts/generate-kit-inventory.mjs`
- `scripts/check-domain-boundaries.mjs`
- `scripts/validate-performance-contracts.mjs`
- `scripts/check-doc-coverage.mjs`
- `tests/composition-layer-smoke.test.mjs`

## Changed

- Package checks now include manifest and performance contract validation.
- Package tests include composition-layer smoke coverage.
- Documentation index now links architecture, composition, inventory, backlog, templates, families, and decision records.
- ProtoKit inventory now separates the new composition layer from legacy families that still need documentation.

## Compatibility

- Existing public exports remain available.
- The wildcard ProtoKit export remains.
- Existing routes and experiments were not rewritten.
- Existing game-specific hosts can be bridged before replacement.
- Legacy kits without READMEs or manifests produce non-blocking documentation warnings.
- New composition-layer kits are expected to have README and manifest coverage.

## Family status

### Composition layer

Status: implemented and documented first. Needs future consumers across experiments and desktop hosts.

### Aerial/flight systems

Status: existing. Documentation pending for individual aerial domain kits, flight motion, terrain, patches, atmosphere, lighting, updrafts, checkpoints, camera, mission, encounter, and combat kits.

### Environment/fidelity systems

Status: existing. Documentation pending for terrain, wind, vegetation, sky, VFX, fidelity, and visual-target families.

### RPG/social systems

Status: existing. Documentation pending for dialogue, relationships, schedules, shops, and quest threads.

### Scoped RPG systems

Status: existing. Documentation pending for enemy, agent, damage, guard, parry, mana, status, vegetation, route, contact, world zone, and interaction boundaries.

### Spatial authoring systems

Status: existing and important seed for scene graph/persistence. Family README added; individual manifests and boundary docs still pending.

### Generic defense systems

Status: existing and reference boundary pattern. Family README added; future docs should align it with `domain-boundary-kit`.

### Experiments, galleries, and bridges

Status: existing route/gallery systems preserved. New bridges convert existing registry shapes into deploy manifests without rewriting routes.

## Next steps

1. Complete per-kit READMEs for all composition kits.
2. Add full manifests for legacy public kits.
3. Document performance/world/flight foundation kits.
4. Document aerial and environment fidelity families.
5. Document RPG/social and scoped RPG families.
6. Convert one real experiment to consume deploy manifests through a compatibility bridge.
7. Add promotion evidence files for stable candidates.
