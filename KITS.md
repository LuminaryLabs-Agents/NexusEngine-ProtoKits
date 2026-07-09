# KITS.md

## One-Sentence Thesis

NexusEngine kits should be organized as a long-term capability system: stable curated NexusEngine kits form the trusted engine surface, ProtoKits incubate domain-purpose gameplay services and game-family compositions, and Deploy Kits package content/configuration/presets into playable experiences without becoming gameplay engines themselves.

---

## 1. Core Mentality

NexusEngine should grow through kit maturity, not one-off game code.

```txt
Runtime
  deterministic execution

Curated NexusEngine Kits
  stable promoted capabilities

ProtoKits
  experimental domain services, game-family kits, modes, and presets

Deploy Kits
  content/configuration packages that deploy a playable experience

Sequences
  authored player-facing orchestration

Renderer Hosts
  presentation and platform adapters
```

The rule is:

```txt
Reusable behavior becomes a kit.
Unproven reusable behavior becomes a ProtoKit.
Game-specific content becomes data, preset, sequence, or Deploy Kit.
Presentation stays in the host or renderer adapter.
```

Recent incubating generic DSKs:

```txt
generic-pressure-loop-kit
  deterministic multi-channel pressure loops for heat, storm, alert, oxygen debt, radiation, corruption, collapse, and similar pressure systems
```

A game should be:

```txt
Kits + Data + Sequences + Renderer Host
```

not:

```txt
one giant custom update loop
```

---

## 2. Long-Term Kit Classes

There are three major kit classes.

```txt
1. Curated NexusEngine Kits
2. ProtoKits
3. Deploy Kits
```

Each class has a different job.

---

## 3. Curated NexusEngine Kits

Curated NexusEngine Kits are stable promoted engine capabilities.

They live in the core NexusEngine repo.

They should be reliable, documented, deterministic, headless-testable, and broadly reusable.

### Purpose

```txt
Provide the stable trusted gameplay and runtime surfaces that many games can compose.
```

### What belongs here

```txt
objective flow
interaction targets
collectibles
render descriptors
basic movement
camera descriptors
lock/gate primitives
sequence runtime helpers
stable world/query primitives
stable resource/event/component patterns
```

### Promotion standard

A kit belongs in curated NexusEngine only when:

```txt
API is stable.
Behavior is generic.
State is deterministic.
Renderer is decoupled.
Headless tests exist.
Docs exist.
It has been validated in at least one real Experiment.
It composes with other kits.
It is not tied to one game brand.
```

---

## 4. ProtoKits

ProtoKits are the incubation zone.

They live in the NexusEngine-ProtoKits repo.

A ProtoKit is a future-stable kit candidate that has not yet earned promotion.

### Purpose

```txt
Test reusable gameplay APIs before they become stable NexusEngine kits.
```

### ProtoKit requirements

A ProtoKit should have:

```txt
index.js
README.md
demo.html when useful
version constant
createXKit(NexusEngine, config)
resources
events
systems
small public engine API
requires/provides
headless usage example
browser usage example
known limitations
promotion criteria
```

### ProtoKit should not own

```txt
DOM creation
keyboard listeners
requestAnimationFrame
Canvas drawing
Three.js meshes
asset loading
hardcoded tutorial copy
one-off level scripting
renderer object mutation
```

Those belong in host apps, renderers, data, sequences, experiments, or Deploy Kits.

---

## 5. ProtoKit Subtypes

ProtoKits should be divided into four useful subtypes.

```txt
A. Atomic Domain Service Kits
B. Domain-Purpose Game-Family Kits
C. Mode Kits
D. Preset / Theme Kits
```

---

## 6. Atomic Domain Service Kits

Atomic domain services are the most important ProtoKit type.

They each own one reusable gameplay/service domain.

### Purpose

```txt
Provide one composable capability that can work across many game families.
```

### Implemented domain-service surface

The current service bundle lives at:

```txt
protokits/domain-service-kits/index.js
```

It exports:

```txt
createDomainServiceKits
createViewRigKit
createSpatialInteractionKit
createCompletionLedgerKit
createObjectiveBridgeKit
createLockGroupKit
createDamageHealthKit
createEncounterDirectorKit
createResourceNodeKit
createBuildPlacementKit
createStructureRuntimeKit
createDiegeticFeedbackSignalKit
createAssetDescriptorKit
```

`createHazardDirectorKit` remains in `domain-foundation` and is re-exported by the service bundle for convenience.

### Individual import paths

```txt
protokits/view-rig-kit/index.js
protokits/spatial-interaction-kit/index.js
protokits/completion-ledger-kit/index.js
protokits/objective-bridge-kit/index.js
protokits/lock-group-kit/index.js
protokits/damage-health-kit/index.js
protokits/encounter-director-kit/index.js
protokits/resource-node-kit/index.js
protokits/build-placement-kit/index.js
protokits/structure-runtime-kit/index.js
protokits/diegetic-feedback-signal-kit/index.js
protokits/asset-descriptor-kit/index.js
```

### Good shape

```txt
createSpatialInteractionKit
  owns distance/facing/LOS/hold/cooldown/rejection reasons

createCompletionLedgerKit
  owns unique completion tracking

createLockGroupKit
  owns gate/door/socket/portal unlock state

createHazardDirectorKit
  owns hazard modes and threat pressure

createDamageHealthKit
  owns health, damage, recovery, invulnerability, death/failure

createBuildPlacementKit
  owns valid/invalid build preview and placement requests

createStructureRuntimeKit
  owns placed structure runtime state
```

### Bad shape

```txt
createWholeHorrorGameKit
createFoglineEverythingKit
createCanvasActionGameKit
createHellscapeV2Kit
```

If the kit name sounds like an entire game, it is probably not atomic enough.

---

## 7. Domain-Purpose Game-Family Kits

Domain-purpose game-family kits are broader than atomic service kits, but still not one-off games.

They support a family of games with a shared domain.

### Examples

```txt
vertical climb family
arcade race family
watercraft exploration family
open-world flight family
survival defense family
first-person exploration family
```

### Existing examples

```txt
Vertical Climb / Next Ledge family
  ledge-route
  simple-swing
  endless-ascent
  cloud-zone
  climb-input
  climb-camera
  climb-risk
  diegetic-feedback

Arcade Race family
  course-director
  downhill-race
  slope-traversal
  racer-ai
  race-hazard
  boost-path
  racer-contact
  race-pacing
  arcade-race-visual

Open World / Flight family
  data-registry
  performance-budget
  sky-atmosphere
  lighting-descriptor
  material-palette
  terrain-sampler
  world-patch
  scatter-placement

Watercraft family
  surface-field
  wave-spectrum
  current-field
  foam-field
  buoyancy
  vehicle-state
  vehicle-control
  watercraft-physics
  sailing
  wake
  docking
```

### Rule

A game-family kit should still be generic.

Good:

```txt
createSlopeTraversalKit
createLedgeRouteKit
createWatercraftPhysicsKit
createWorldPatchKit
```

Bad:

```txt
createPenguinPhysicsKit
createNextLedgeOnlyRouteKit
createBirdOnlyTerrainKit
```

The game-specific part should be a preset.

---

## 8. Mode Kits

Mode Kits compose several domain services into a playable loop.

They are allowed to be higher-order, but they should still be generic.

### Purpose

```txt
Bundle multiple atomic/domain kits into a recurring gameplay mode.
```

### Examples

```txt
createWatercraftExplorationMode
createSwimDiveRecoveryMode
createPortUpgradeLoopMode
createStormNavigationMode
createVerticalClimbMode
createArcadeRaceMode
createSurvivalDefenseMode
createFirstPersonExplorationMode
```

A mode is reusable gameplay structure.

A preset or deploy package makes it a specific game.

---

## 9. Preset / Theme Kits

Preset Kits configure domain kits and mode kits.

They do not define core gameplay rules.

### Purpose

```txt
Turn generic kits into a themed game configuration.
```

### Examples

```txt
blackwake-preset-kit
next-ledge-preset
penguin-prix-preset
fogline-preset
hellscape-preset
```

A preset should configure kits, not become a kit-shaped game engine.

---

## 10. Deploy Kits

Deploy Kits are content deployment packages.

They are not stable engine kits and not domain simulation kits.

### Purpose

```txt
Package content, data, assets, presets, sequences, and host wiring so a game can be deployed quickly.
```

A Deploy Kit answers:

```txt
What content should be loaded?
Which kit stack should be installed?
Which preset should be used?
Which sequences should run?
Which assets are referenced?
Which host settings are required?
Where does the playable build deploy?
```

### Deploy Kit owns

```txt
game manifest
level manifests
asset manifest
preset selection
sequence bundle
kit stack declaration
host/deploy config
CDN/import paths
build target
demo page metadata
release notes
```

### Deploy Kit does not own

```txt
gameplay simulation
input rules
damage rules
AI behavior
movement physics
objective engine
renderer internals
```

Deploy Kits can be game-specific.

They should not be promoted into core.

---

## 11. Repo Roles

Use this split.

```txt
NexusEngine
  stable runtime
  curated promoted kits
  stable sequence/runtime surfaces

NexusEngine-ProtoKits
  atomic domain service kits
  domain-purpose game-family kits
  mode kits
  preset/theme kits
  experimental renderer adapters
  headless tests and demos

NexusEngine-Experiments
  playable validation games
  tiny Canvas/Three hosts
  data files
  sequence files
  deploy kit consumers
  release demos
```

---

## 12. Recommended ProtoKits Organization

```txt
protokits/

  foundation/
    protokit-core
    seed-kit
    clock-kit
    state-digest-kit
    replay-test-kit
    health-report-kit
    performance-budget-kit

  input/
    action-input-kit
    input-context-kit
    input-buffer-kit
    view-rig-kit

  spatial/
    spatial-index-kit
    interactable-registry-kit
    spatial-interaction-kit
    hold-action-kit
    completion-ledger-kit

  progression/
    objective-bridge-kit
    objective-kit
    mission-phase-kit
    lock-group-kit
    fail-state-kit
    score-summary-kit

  hazard-combat/
    hazard-director-kit
    damage-health-kit
    encounter-director-kit
    light-combat-kit

  economy-resources/
    inventory-kit
    cargo-kit
    currency-kit
    market-kit
    upgrade-kit
    resource-node-kit
    recovery-site-kit
    cargo-transfer-kit

  building/
    build-placement-kit
    structure-runtime-kit
    station-interaction-kit

  camera-feedback/
    camera-state-kit
    camera-mode-kit
    camera-collision-kit
    camera-comfort-kit
    camera-sequence-kit
    diegetic-feedback-signal-kit

  render-descriptors/
    render-descriptor-kit
    asset-descriptor-kit
    visual-pipeline-kit
    render-layer-kit
    material-palette-kit
    lighting-descriptor-kit
    sky-atmosphere-kit

  modes/
    watercraft-exploration-mode
    swim-dive-recovery-mode
    port-upgrade-loop-mode
    storm-navigation-mode
    arcade-race-mode
    vertical-climb-mode
    survival-defense-mode
    first-person-exploration-mode

  presets/
    blackwake-preset
    next-ledge-preset
    penguin-prix-preset
    fogline-preset
    hellscape-preset

  deploy/
    fogline-relay-deploy-kit
    hellscape-siege-deploy-kit
    next-ledge-demo-deploy-kit
```

Existing folders do not need to move immediately. Use individual wrapper files and index exports for backward-compatible migration.

---

## 13. Promotion Path

All reusable behavior should have a fate.

```txt
Experiment
  proves the game idea

ProtoKit
  proves reusable API and state model

Multi-config validation
  proves it works beyond one game

Headless tests
  prove renderer independence

Promotion review
  decide promote / iterate / split / merge / archive / delete

Curated NexusEngine Kit
  stable engine capability
```

A ProtoKit should be promoted when:

```txt
generic behavior is proven
state is deterministic
API is stable
resources/events are clean
headless tests pass
docs exist
renderer is decoupled
multi-config usage works
```

A ProtoKit should be split when:

```txt
it owns too many unrelated domains
it has too many public APIs
it mixes input, simulation, UI, and rendering
it cannot be configured cleanly
```

---

## 14. Kit Decision Rules

When adding a new capability, ask:

```txt
Is it stable and already proven?
  Put it in NexusEngine as curated kit.

Is it reusable but not proven?
  Put it in ProtoKits as an atomic/domain service.

Is it a family-wide pattern?
  Put it in ProtoKits as a game-family kit or mode kit.

Is it just theme/tuning/data?
  Put it in a preset kit.

Is it only content/deployment packaging?
  Put it in a Deploy Kit.

Is it renderer/platform-specific?
  Put it in renderer adapter or host support.

Is it one-off experiment glue?
  Keep it in the Experiment, but mark it for extraction if it grows.
```

---

## 15. Anti-Patterns

Avoid:

```txt
one giant app file
one giant game kit
renderer-owned gameplay
input directly mutating state
game-branded stable kits
ProtoKits with no tests
ProtoKits with no fate
Deploy Kits that implement simulation
presets that become engines
generic kits with one huge domain state
```

Prefer:

```txt
small atomic services
clear domain ownership
small public APIs
resources for durable state
events for tick-scoped facts/commands
sequences for authored flow
presets for theme/config
deploy kits for content packaging
hosts for presentation
```

---

## 16. Final Rule

```txt
NexusEngine grows by turning repeated gameplay needs into clean domain services, not by accumulating one-off game code.
```

## Recent Incubating DSKs

- `generic-pressure-loop-kit`: renderer-agnostic pressure channels, thresholds, and warning/peaked/recovered events.
- `generic-resource-loop-kit`: renderer-agnostic resource meters, rates, locks, empty/full state, threshold crossings, and deterministic reset.
- `generic-action-window-kit`: renderer-agnostic action timing, perfect/good/miss judgment, cooldowns, rejection reasons, and deterministic reset.
- `generic-affordance-descriptor-kit`: renderer-agnostic interactable availability, target descriptors, stable rejection reasons, and usable/blocked/completed state.
