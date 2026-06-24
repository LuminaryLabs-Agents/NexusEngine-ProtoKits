# Domain Kit Mainline Upgrade Plan

## Status

This document is the mainline implementation plan for expanding NexusRealtime ProtoKits into a complete generalized domain-kit and composition-kit architecture.

This is not a side package, not a new repository, and not a `v3` branch. The upgrade belongs in the current `NexusRealtime-ProtoKits` organization and should land on `main` in as few pushes as practical.

## One-sentence goal

Make ProtoKits the main incubation surface for every reusable NexusRealtime domain capability: atomic domain kits, composition kits, harness kits, manifests, promotion gates, and vertical stacks that can later promote into core NexusRealtime when they are stable.

## North-star mentality

Do not create 1,000 empty folders just to satisfy a catalog. Build the control plane first, then add domain families in tested waves.

The catalog is a map of future ownership boundaries. Implementation must be guided by idempotency, composability, deterministic state, and stable public APIs.

```txt
Atomic kit
  owns one reusable domain state/service boundary

Composition kit
  composes child kits and exposes a stable recipe/facade

Harness kit
  proves deterministic behavior, exports, idempotency, replay, and promotion readiness

Preset/deploy kit
  provides data/config/sequence composition, not reusable domain logic
```

The correct mental model is:

```txt
Core runtime executes.
ProtoKits define reusable domains.
Composition kits arrange domains.
Harnesses prove behavior.
Experiments validate playable use.
Promotion gates decide what moves toward core.
```

## Hard constraints

1. New implementation names use `<pre>-<mid>-kit` whenever possible.
2. Existing `-dsk` exports may remain only as compatibility aliases.
3. Reusable kits must be renderer-agnostic.
4. Reusable kits must not use DOM, Canvas, Three.js, WebGL contexts, browser listeners, `fetch`, `localStorage`, `Date.now` for gameplay state, or unseeded random.
5. Every runtime kit must declare stable `requires` and `provides` tokens.
6. Every runtime kit must support deterministic `getState` or `getSnapshot` and `reset` when it owns mutable state.
7. Every composition kit must be idempotent: installing or reconciling twice must not duplicate resources, events, systems, subscriptions, descriptors, objects, or public APIs.
8. Prefer `ensure`, `upsert`, `set`, `applyPatch`, `reconcile`, `resolve`, and `getSnapshot` API shapes.
9. Avoid anonymous append/create APIs that cannot be replayed or deduped.
10. If a current kit already owns the domain, refine it instead of duplicating it.

## Current repo anchors to preserve

The upgrade should build on the current structure:

```txt
README.md
KITS.md
README-DSM-ADDENDUM.md
docs/START-HERE.md
docs/DSM-ARCHITECTURE.md
docs/DSM-KIT-NAMING.md
docs/DSM-AUTHORING-GUIDE.md
docs/DSM-AGENT-WORKFLOW.md
docs/DSM-SPLIT-RULES.md
docs/DSM-CATALOG.md
docs/DSM-DATA-CONTRACTS.md
docs/DSM-TESTING-GUIDE.md
docs/DSM-PROMOTION-GUIDE.md
docs/MAINLINE-GUIDED-KITS-MASTER-PLAN.md
docs/templates/DSM-SPEC.md
docs/templates/KIT-MANIFEST.md
package.json
protokits/domain-service-kits/index.js
protokits/generic-kit-utils/index.js
protokits/nexus-dsk-adapter/index.js
protokits/foundation-kit/index.js
tests/*.test.mjs
```

These are not side docs. They are the mainline operating surface for this upgrade.

## Files to review before each implementation wave

Before editing a wave, inspect:

```txt
package.json
README.md
KITS.md
README-DSM-ADDENDUM.md
docs/START-HERE.md
docs/DSM-CATALOG.md
docs/DSM-AGENT-WORKFLOW.md
docs/DSM-SPLIT-RULES.md
docs/DSM-TESTING-GUIDE.md
docs/DSM-PROMOTION-GUIDE.md
docs/MAINLINE-GUIDED-KITS-MASTER-PLAN.md
docs/templates/KIT-MANIFEST.md
protokits/domain-service-kits/index.js
protokits/generic-kit-utils/index.js
protokits/nexus-dsk-adapter/index.js
protokits/foundation-kit/index.js
related protokits/<family>/index.js
tests/*related*.test.mjs
```

The rule is simple:

```txt
inspect first
refine existing ownership when possible
add manifest/spec
implement smallest useful version
add tests
update exports/docs
run checks
push one wave
```

## Main organization structure

Do not add a new package workspace unless explicitly approved later. Use this structure:

```txt
docs/
  DOMAIN-KIT-MAINLINE-UPGRADE-PLAN.md
  KIT-CATALOG-MASTER.md
  KIT-COMPOSITION-CATALOG.md
  KIT-IMPLEMENTATION-ORDER.md
  KIT-PROMOTION-MATRIX.md
  templates/
    KIT-MANIFEST.md
    KIT-FAMILY-SPEC.md
    KIT-COMPOSITION-SPEC.md

protokits/
  <pre>-<mid>-kit/
    index.js
    README.md
    manifest.js optional

  domain-service-kits/
    index.js
    catalog.js optional

  kit-catalog/
    atomic-domain-kits.js
    composition-kits.js
    vertical-stack-kits.js
    promotion-matrix.js

tests/
  <pre>-<mid>-kit-smoke.test.mjs
  kit-catalog-integrity.test.mjs
  kit-idempotency-smoke.test.mjs
  kit-export-map-smoke.test.mjs
  kit-composition-smoke.test.mjs
```

## Atomic-vs-composition decision rules

Create or refine an atomic kit when:

```txt
it owns mutable state
it declares a reusable domain service
it has meaningful requires/provides tokens
it can be tested headlessly
its public API is useful outside one game
```

Create a composition kit when:

```txt
it mostly orders, configures, or reconciles child kits
it exposes a useful higher-level facade
it should not own child state directly
it installs no duplicate systems if child kits are already present
it can run with partial child-kit availability when configured to do so
```

Split a kit when:

```txt
one child service becomes reusable elsewhere
one test requires unrelated setup
one resource/event group has an independent lifecycle
one domain name no longer explains the whole module
```

Do not split only because a file is large. Split because ownership changed.

## Idempotency contract

Every new kit and composition kit must pass this conceptual test:

```txt
same config + same world state + same events = same output
```

Runtime install rules:

```txt
install once -> registers definitions and API
install twice -> no duplicate systems, no duplicate subscriptions, no duplicate descriptors
reset -> returns deterministic initial state from config
getSnapshot -> returns JSON-safe state
reconcile -> converges desired/current state without blind appends
```

Public API verbs should look like:

```txt
ensureX(id, data)
upsertX(record)
setX(id, value)
applyPatch(patch)
reconcile(request)
resolve(intent)
getState()
getSnapshot()
reset()
```

Avoid:

```txt
createAnonymousX()
spawnXNow()
appendXBlindly()
registerXWithoutId()
mutateRendererObject()
```

## Main phases

### Phase 0 — Plan on main

Goal: commit this plan to `main` so future agents have a stable implementation target.

Files:

```txt
docs/DOMAIN-KIT-MAINLINE-UPGRADE-PLAN.md
```

Gate:

```txt
PASS when this plan is present on main.
```

### Phase 1 — Control-plane kits

Goal: add the kit governance surface before adding hundreds of domain implementations.

Add or refine:

```txt
protokits/kit-manifest-domain-kit/index.js
protokits/capability-registry-kit/index.js
protokits/domain-family-kit/index.js
protokits/kit-composition-plan-kit/index.js
protokits/kit-boundary-lint-kit/index.js
protokits/promotion-readiness-harness/index.js
```

Docs/tests:

```txt
docs/KIT-IMPLEMENTATION-ORDER.md
docs/KIT-PROMOTION-MATRIX.md
tests/kit-manifest-domain-kit-smoke.test.mjs
tests/capability-registry-kit-smoke.test.mjs
tests/domain-family-kit-smoke.test.mjs
tests/kit-composition-plan-kit-smoke.test.mjs
tests/kit-boundary-lint-kit-smoke.test.mjs
tests/promotion-readiness-harness-smoke.test.mjs
```

Package exports to add:

```txt
./kit-manifest-domain-kit
./capability-registry-kit
./domain-family-kit
./kit-composition-plan-kit
./kit-boundary-lint-kit
./promotion-readiness-harness
```

Gate:

```txt
PASS when manifests, capability tokens, composition plans, boundary lint, and readiness reports can be created headlessly and imported by explicit package paths.
```

### Phase 2 — Catalog manifests

Goal: convert the 1,000 atomic-domain catalog and 1,000 composition catalog into structured data, not immediate empty code folders.

Add:

```txt
protokits/kit-catalog/atomic-domain-kits.js
protokits/kit-catalog/composition-kits.js
protokits/kit-catalog/vertical-stack-kits.js
protokits/kit-catalog/promotion-matrix.js
protokits/kit-catalog/index.js
```

Docs/tests:

```txt
docs/KIT-CATALOG-MASTER.md
docs/KIT-COMPOSITION-CATALOG.md
tests/kit-catalog-integrity.test.mjs
tests/kit-catalog-naming-smoke.test.mjs
tests/kit-catalog-token-smoke.test.mjs
```

Package export:

```txt
./kit-catalog
```

Gate:

```txt
PASS when every catalog entry has id, domain, category, scope, tier, status, provides, requires, composes, sourcePath, exportPath, and promotion readiness fields.
```

### Phase 3 — Foundation and config families

Goal: make all later kits share one deterministic base.

Add or refine:

```txt
protokits/foundation-runtime-kit/index.js
protokits/foundation-contract-kit/index.js
protokits/config-schema-kit/index.js
protokits/config-layer-kit/index.js
protokits/config-preset-kit/index.js
protokits/data-registry-kit/index.js
protokits/data-query-kit/index.js
protokits/data-overlay-kit/index.js
protokits/content-catalog-kit/index.js
protokits/content-palette-kit/index.js
protokits/material-palette-kit/index.js
```

Gate:

```txt
PASS when seed/data/config/material/content services are deterministic, JSON-safe, and reusable by world, object, actor, render, economy, and progression kits.
```

### Phase 4 — World, terrain, environment, and placement

Goal: establish the generalized open-world backbone.

Add or refine:

```txt
protokits/world-registry-kit/index.js
protokits/world-seed-kit/index.js
protokits/world-partition-kit/index.js
protokits/world-stream-kit/index.js
protokits/world-zone-kit/index.js
protokits/world-patch-kit/index.js
protokits/world-query-kit/index.js
protokits/terrain-sampler-kit/index.js
protokits/terrain-surface-kit/index.js
protokits/terrain-biome-kit/index.js
protokits/terrain-lod-kit/index.js
protokits/terrain-ground-kit/index.js
protokits/environment-state-kit/index.js
protokits/environment-zone-kit/index.js
protokits/weather-state-kit/index.js
protokits/weather-pattern-kit/index.js
protokits/daynight-cycle-kit/index.js
protokits/ecology-balance-kit/index.js
protokits/placement-scatter-kit/index.js
protokits/placement-rule-kit/index.js
protokits/placement-reconcile-kit/index.js
```

Composition targets:

```txt
protokits/open-world-kit/index.js
protokits/open-sandbox-kit/index.js
protokits/open-survival-kit/index.js
```

Gate:

```txt
PASS when open-world-kit can compose deterministic terrain, zones, stream windows, placement descriptors, and environment snapshots without renderer dependencies.
```

### Phase 5 — Object, scene, interaction, and authoring

Goal: generalize scene/object ownership and editing without app-specific targets.

Add or refine:

```txt
protokits/object-registry-kit/index.js
protokits/object-archetype-kit/index.js
protokits/object-state-kit/index.js
protokits/object-transform-kit/index.js
protokits/object-bounds-kit/index.js
protokits/object-selection-kit/index.js
protokits/object-mutation-kit/index.js
protokits/scene-graph-kit/index.js
protokits/scene-layer-kit/index.js
protokits/scene-authoring-kit/index.js
protokits/scene-patch-kit/index.js
protokits/scene-snapshot-kit/index.js
protokits/interaction-target-kit/index.js
protokits/interaction-affordance-kit/index.js
protokits/interaction-verb-kit/index.js
protokits/interaction-rule-kit/index.js
protokits/interaction-facade-kit/index.js
```

Composition targets:

```txt
protokits/creator-scene-kit/index.js
protokits/creator-world-kit/index.js
protokits/open-builder-kit/index.js
```

Gate:

```txt
PASS when objects, scenes, patches, selections, interactions, and authoring can be serialized, replayed, and tested headlessly.
```

### Phase 6 — Actors, motion, navigation, AI

Goal: cover generic actor state and behavior without game-specific enemies, vehicles, or NPCs.

Add or refine:

```txt
protokits/actor-registry-kit/index.js
protokits/actor-profile-kit/index.js
protokits/actor-state-kit/index.js
protokits/actor-capability-kit/index.js
protokits/actor-controller-kit/index.js
protokits/actor-intent-kit/index.js
protokits/movement-state-kit/index.js
protokits/movement-policy-kit/index.js
protokits/movement-ground-kit/index.js
protokits/movement-air-kit/index.js
protokits/traversal-mode-kit/index.js
protokits/locomotion-core-kit/index.js
protokits/navigation-graph-kit/index.js
protokits/navigation-query-kit/index.js
protokits/pathfinding-core-kit/index.js
protokits/route-planner-kit/index.js
protokits/avoidance-local-kit/index.js
protokits/crowd-state-kit/index.js
protokits/ai-agent-kit/index.js
protokits/ai-brain-kit/index.js
protokits/ai-perception-kit/index.js
protokits/ai-goal-kit/index.js
protokits/ai-plan-kit/index.js
protokits/director-encounter-kit/index.js
protokits/director-pacing-kit/index.js
```

Composition targets:

```txt
protokits/simulation-agent-kit/index.js
protokits/simulation-director-kit/index.js
protokits/open-traversal-kit/index.js
```

Gate:

```txt
PASS when actors, movement, route planning, AI state, and director state remain deterministic and configurable by data.
```

### Phase 7 — Combat, economy, progression, persistence

Goal: cover core gameplay loops as reusable domains.

Add or refine:

```txt
protokits/conflict-state-kit/index.js
protokits/combat-state-kit/index.js
protokits/combat-action-kit/index.js
protokits/damage-model-kit/index.js
protokits/damage-resolution-kit/index.js
protokits/health-state-kit/index.js
protokits/status-effect-kit/index.js
protokits/projectile-descriptor-kit/index.js
protokits/economy-registry-kit/index.js
protokits/economy-transaction-kit/index.js
protokits/economy-wallet-kit/index.js
protokits/inventory-container-kit/index.js
protokits/inventory-transfer-kit/index.js
protokits/item-registry-kit/index.js
protokits/loot-table-kit/index.js
protokits/quest-registry-kit/index.js
protokits/quest-thread-kit/index.js
protokits/dialogue-registry-kit/index.js
protokits/dialogue-session-kit/index.js
protokits/social-relationship-kit/index.js
protokits/progression-state-kit/index.js
protokits/unlock-rule-kit/index.js
protokits/session-state-kit/index.js
protokits/persistence-snapshot-kit/index.js
protokits/save-slot-kit/index.js
protokits/replay-input-kit/index.js
```

Composition targets:

```txt
protokits/open-combat-kit/index.js
protokits/open-economy-kit/index.js
protokits/open-progression-kit/index.js
protokits/open-adventure-kit/index.js
protokits/simulation-replay-kit/index.js
```

Gate:

```txt
PASS when combat, economy, inventory, quest, dialogue, social, session, save, and replay domains all have deterministic smoke tests and idempotent public APIs.
```

### Phase 8 — Render, camera, audio, sensory

Goal: expose renderer/host-facing descriptors without owning renderers.

Add or refine:

```txt
protokits/camera-rig-kit/index.js
protokits/camera-mode-kit/index.js
protokits/camera-target-kit/index.js
protokits/view-layer-kit/index.js
protokits/presentation-context-kit/index.js
protokits/ui-surface-kit/index.js
protokits/hud-state-kit/index.js
protokits/render-descriptor-kit/index.js
protokits/render-layer-kit/index.js
protokits/render-bucket-kit/index.js
protokits/render-snapshot-kit/index.js
protokits/visual-pipeline-kit/index.js
protokits/mesh-descriptor-kit/index.js
protokits/instance-render-kit/index.js
protokits/material-render-kit/index.js
protokits/particle-descriptor-kit/index.js
protokits/lighting-descriptor-kit/index.js
protokits/vfx-cue-kit/index.js
protokits/audio-descriptor-kit/index.js
protokits/audio-bus-kit/index.js
protokits/music-state-kit/index.js
protokits/haptic-descriptor-kit/index.js
protokits/sensory-feedback-kit/index.js
```

Composition targets:

```txt
protokits/immersive-render-kit/index.js
protokits/immersive-sensory-kit/index.js
protokits/open-sandbox-kit/index.js
```

Gate:

```txt
PASS when host apps can consume descriptors and no reusable kit mutates DOM, Canvas, Three.js, or WebGL objects.
```

### Phase 9 — XR, networking, telemetry, procedural, host/platform

Goal: fill the advanced stacks after the basic domain graph is stable.

Add or refine:

```txt
protokits/xr-session-kit/index.js
protokits/xr-rig-kit/index.js
protokits/xr-reference-kit/index.js
protokits/xr-hand-kit/index.js
protokits/xr-controller-kit/index.js
protokits/spatial-input-kit/index.js
protokits/spatial-anchor-kit/index.js
protokits/spatial-authoring-kit/index.js
protokits/spatial-persistence-kit/index.js
protokits/network-session-kit/index.js
protokits/network-transport-kit/index.js
protokits/replication-state-kit/index.js
protokits/multiplayer-presence-kit/index.js
protokits/sync-clock-kit/index.js
protokits/telemetry-event-kit/index.js
protokits/diagnostic-report-kit/index.js
protokits/performance-budget-kit/index.js
protokits/debug-overlay-kit/index.js
protokits/editor-command-kit/index.js
protokits/procedural-seed-kit/index.js
protokits/procedural-graph-kit/index.js
protokits/generation-world-kit/index.js
protokits/noise-field-kit/index.js
protokits/host-environment-kit/index.js
protokits/platform-profile-kit/index.js
protokits/mod-registry-kit/index.js
protokits/delivery-bundle-kit/index.js
protokits/product-settings-kit/index.js
```

Composition targets:

```txt
protokits/immersive-world-kit/index.js
protokits/immersive-authoring-kit/index.js
protokits/immersive-collaboration-kit/index.js
protokits/simulation-world-kit/index.js
protokits/simulation-observability-kit/index.js
protokits/creator-publish-kit/index.js
```

Gate:

```txt
PASS when XR, network, telemetry, procedural, host, platform, modding, delivery, and product surfaces have clear adapter boundaries and no reusable gameplay kit depends on a platform object.
```

### Phase 10 — Promotion readiness and core handoff

Goal: only stable, tested, broadly reusable kits become core candidates.

Promotion criteria:

```txt
[ ] API stable
[ ] behavior generic
[ ] state deterministic
[ ] renderer decoupled
[ ] headless tests exist
[ ] docs exist
[ ] manifest exists
[ ] export path explicit
[ ] reset/getSnapshot implemented
[ ] replay smoke exists when mutable
[ ] validated by at least one Experiment
[ ] no game-specific naming leaks
[ ] composition with adjacent kits proven
```

Core remains read-only unless explicitly authorized. Promotion work should produce:

```txt
promotion readiness report
API contract summary
migration notes
copy-paste patch or PR plan for core
ProtoKits compatibility alias plan
```

## Push strategy

Use one push per coherent wave, not one push per kit.

Recommended sequence:

```txt
push 0: docs/DOMAIN-KIT-MAINLINE-UPGRADE-PLAN.md
push 1: control-plane kits + tests + exports
push 2: structured catalog manifests + catalog integrity tests
push 3: foundation/config/data/content/material family
push 4: world/terrain/environment/placement family
push 5: object/scene/interaction/authoring family
push 6: actor/movement/navigation/AI/director family
push 7: combat/economy/progression/persistence family
push 8: camera/render/audio/sensory family
push 9: XR/network/telemetry/procedural/host/platform family
push 10: vertical composition kits and promotion matrix hardening
```

If a wave becomes too large to review, split by family, not by arbitrary file count.

## Package export strategy

Every implemented kit gets an explicit package export.

Example:

```json
{
  "exports": {
    "./world-stream-kit": "./protokits/world-stream-kit/index.js",
    "./open-world-kit": "./protokits/open-world-kit/index.js"
  }
}
```

Keep the existing wildcard export for compatibility, but do not rely on it as documentation.

## Test strategy

Every new implemented kit should add at least one smoke test.

Minimum test shape:

```txt
import/factory smoke
runtime install smoke
initial state smoke
idempotent install/reconcile smoke
reset/getSnapshot smoke
same-input deterministic smoke
export-map import smoke
no renderer/host forbidden globals smoke
composition smoke for parent kits
```

Required shared tests:

```txt
tests/kit-catalog-integrity.test.mjs
tests/kit-idempotency-smoke.test.mjs
tests/kit-export-map-smoke.test.mjs
tests/kit-composition-smoke.test.mjs
tests/promotion-readiness-harness-smoke.test.mjs
```

## First implementation batch after this plan

The first code push should be the control plane, not a random set of gameplay kits.

Files to push together:

```txt
package.json
docs/KIT-IMPLEMENTATION-ORDER.md
docs/KIT-PROMOTION-MATRIX.md
protokits/kit-manifest-domain-kit/index.js
protokits/capability-registry-kit/index.js
protokits/domain-family-kit/index.js
protokits/kit-composition-plan-kit/index.js
protokits/kit-boundary-lint-kit/index.js
protokits/promotion-readiness-harness/index.js
tests/kit-manifest-domain-kit-smoke.test.mjs
tests/capability-registry-kit-smoke.test.mjs
tests/domain-family-kit-smoke.test.mjs
tests/kit-composition-plan-kit-smoke.test.mjs
tests/kit-boundary-lint-kit-smoke.test.mjs
tests/promotion-readiness-harness-smoke.test.mjs
```

Why this first:

```txt
The catalog is too large to implement safely without a manifest, token registry, family registry, composition planner, boundary lint, and promotion gate.
```

## Second implementation batch

Files to push together:

```txt
package.json
docs/KIT-CATALOG-MASTER.md
docs/KIT-COMPOSITION-CATALOG.md
protokits/kit-catalog/index.js
protokits/kit-catalog/atomic-domain-kits.js
protokits/kit-catalog/composition-kits.js
protokits/kit-catalog/vertical-stack-kits.js
protokits/kit-catalog/promotion-matrix.js
tests/kit-catalog-integrity.test.mjs
tests/kit-catalog-naming-smoke.test.mjs
tests/kit-catalog-token-smoke.test.mjs
```

## Third implementation batch

Files to push together:

```txt
package.json
protokits/foundation-runtime-kit/index.js
protokits/foundation-contract-kit/index.js
protokits/config-schema-kit/index.js
protokits/config-layer-kit/index.js
protokits/config-preset-kit/index.js
protokits/data-registry-kit/index.js
protokits/data-query-kit/index.js
protokits/data-overlay-kit/index.js
protokits/content-catalog-kit/index.js
protokits/content-palette-kit/index.js
protokits/material-palette-kit/index.js
tests/foundation-runtime-kit-smoke.test.mjs
tests/config-schema-kit-smoke.test.mjs
tests/data-registry-kit-smoke.test.mjs
tests/content-catalog-kit-smoke.test.mjs
tests/material-palette-kit-smoke.test.mjs
```

## Review checklist before every push

```txt
[ ] Does each new kit use a reusable domain name?
[ ] Does each new kit use `<pre>-<mid>-kit` naming where possible?
[ ] Does each new kit have explicit requires/provides tokens?
[ ] Does each new kit have deterministic initial state?
[ ] Does each stateful kit expose reset/getSnapshot?
[ ] Does each public API use idempotent verbs?
[ ] Does each composition kit only compose/reconcile child kits?
[ ] Are renderer/platform concerns excluded?
[ ] Are package exports explicit?
[ ] Are tests added and included in package scripts?
[ ] Are docs/catalogs updated?
[ ] Did `npm run check` pass, or are failures documented?
```

## What not to do

```txt
Do not create 1,000 untested folders.
Do not create a side package.
Do not create game-branded generic kits.
Do not add renderer objects to reusable kits.
Do not let composition kits secretly own child state.
Do not rely on wildcard exports as the primary public surface.
Do not push core changes unless explicitly authorized.
```

## Done condition for the massive upgrade

The upgrade is complete when:

```txt
[ ] All implemented domain kits have explicit package exports.
[ ] The catalog differentiates planned, scaffolded, experimental, stable-candidate, and promoted kits.
[ ] Every composition kit declares child kit dependencies and idempotent reconciliation behavior.
[ ] The main vertical stacks exist: open-world-kit, immersive-world-kit, simulation-world-kit, creator-world-kit, and their sibling stacks.
[ ] Every mutable kit has deterministic tests, reset, and snapshot support.
[ ] Every promoted-candidate kit has a readiness report.
[ ] Experiments can compose large worlds through data/config without writing new architecture.
```
