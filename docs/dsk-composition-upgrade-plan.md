# DSK Composition Upgrade Plan

This document captures the final composition-first upgrade plan for NexusEngine ProtoKits.

The goal is not to create object-specific kits such as `banana-kit`, `coin-kit`, or `potion-kit`.

The goal is to strengthen existing bounded containers so proof packets can compose them sideways.

## Core Principle

```txt
A DSK is a bounded capability container.

It owns:
  inputs
  outputs
  local state
  descriptor shape
  lifecycle hooks
  internal policy
  validation of its own boundary

It does not own:
  the whole object
  the whole game
  the renderer
  another kit's state
  app-specific meaning
```

## Object-Proof Composition Spine

```txt
object proof
├─ data-registry-kit
├─ content-palette-kit
├─ layered-object-kit
├─ material-palette-kit
├─ render-layer-kit / visual-pipeline-kit
├─ performance-budget-kit
├─ instanced-render-kit
├─ action-input-kit
├─ diegetic-feedback-kit
├─ camera-cinematic-maker-kit
├─ audio-event-feedback-maker-kit
└─ deterministic-replay-harness
```

Objects are specs, presets, or proof packets.

They are not kits.

```txt
banana
coin
button
crate
potion
```

## Final Kit Updates

### data-registry-kit

```txt
Role:
  stable spec + seed containment

Upgrade:
  store object proof specs
  store seed namespaces
  store descriptor schema versions
  store output hashes
  store packet references

Composes with:
  content-palette-kit
  layered-object-kit
  deterministic-replay-harness

Emits:
  ObjectSpecDescriptor
  SeedScopeDescriptor
  SchemaVersionDescriptor
```

### content-palette-kit

```txt
Role:
  bounded variant selection container

Upgrade:
  choose object variants
  choose material palettes
  choose surface palettes
  choose proof pass presets
  choose comparison sets

Composes with:
  data-registry-kit
  material-palette-kit
  layered-object-kit

Emits:
  ContentVariantDescriptor
  PaletteSelectionDescriptor
```

### layered-object-kit

```txt
Role:
  bounded object assembly container

Upgrade:
  become the main object composition spine
  support mesh layers
  support sockets
  support attachments
  support overlay layers
  support visual state layers
  support physical state layers

Composes with:
  data-registry-kit
  content-palette-kit
  material-palette-kit
  action-input-kit
  diegetic-feedback-kit

Emits:
  ObjectAssemblyDescriptor
  ObjectLayerDescriptor
  SocketDescriptor
  StateLayerDescriptor
```

### material-palette-kit

```txt
Role:
  bounded material descriptor container

Upgrade:
  add reusable material families:
    fruit skin
    peel
    blemish
    metal
    plastic
    LED
    wood
    wet wood
    glass
    liquid
    label paper
    cloth
    rope
    stone

Composes with:
  layered-object-kit
  lighting-descriptor-kit
  visual-pipeline-kit

Emits:
  MaterialDescriptor
  MaterialVariantDescriptor
  SurfaceResponseDescriptor
```

### render-layer-kit

```txt
Role:
  bounded render bucket container

Upgrade:
  add object-proof render buckets
  add near / mid / far inspection views
  add material inspection buckets
  add transparent-object buckets
  add emissive-object buckets

Composes with:
  visual-pipeline-kit
  material-palette-kit
  instanced-render-kit
  camera-cinematic-maker-kit

Emits:
  RenderBucketDescriptor
  ObjectRenderDescriptor
  InspectionRenderDescriptor
```

### visual-pipeline-kit

```txt
Role:
  bounded visual validation container

Upgrade:
  validate descriptor completeness
  compare visual passes
  check missing materials
  check bad transparency setup
  check unreadable object states
  produce comparison snapshots

Composes with:
  render-layer-kit
  material-palette-kit
  lighting-descriptor-kit
  deterministic-replay-harness

Emits:
  VisualValidationSnapshot
  ComparisonSnapshot
  FidelityPassDescriptor
```

### performance-budget-kit

```txt
Role:
  bounded budget container

Upgrade:
  track object-level budgets:
    triangle count
    material count
    texture memory
    draw-call expectation
    LOD level cost
    transparency cost
    instancing value
    comparison-pass cost

Composes with:
  layered-object-kit
  material-palette-kit
  instanced-render-kit
  visual-pipeline-kit

Emits:
  BudgetSnapshot
  ObjectBudgetDescriptor
  LODBudgetDescriptor
```

### instanced-render-kit

```txt
Role:
  bounded repeated-object batching container

Upgrade:
  support repeated proof objects:
    coins
    crates
    leaves
    rocks
    buttons
    bottles
    fruit

Composes with:
  layered-object-kit
  render-layer-kit
  performance-budget-kit
  scatter-placement-kit

Emits:
  InstanceBatchDescriptor
  BatchKeyDescriptor
```

### lighting-descriptor-kit

```txt
Role:
  bounded lighting descriptor container

Upgrade:
  add proof lighting rigs:
    neutral inspection
    warm inspection
    cool inspection
    rim-lit material test
    glass/transparency test
    emissive glow test
    low-light readability test

Composes with:
  material-palette-kit
  visual-pipeline-kit
  camera-cinematic-maker-kit

Emits:
  LightingRigDescriptor
  MaterialInspectionLightDescriptor
```

### action-input-kit

```txt
Role:
  bounded semantic input container

Upgrade:
  add object proof actions:
    hover
    inspect
    rotate
    press
    release
    activate
    pickup
    drop
    cycle variant
    reset proof pass

Composes with:
  layered-object-kit
  diegetic-feedback-kit
  checkpoint-volume-kit
  gamehost-standard-kit

Emits:
  ObjectInputEvent
  SemanticActionEvent
```

### diegetic-feedback-kit

```txt
Role:
  bounded world-feedback descriptor container

Upgrade:
  add object feedback:
    hover outline
    glow pulse
    press depression cue
    pickup shimmer
    inspection focus cue
    invalid action cue
    material comparison cue

Composes with:
  action-input-kit
  layered-object-kit
  render-layer-kit
  audio-event-feedback-maker-kit

Emits:
  FeedbackDescriptor
  HighlightDescriptor
  WorldCueDescriptor
```

### checkpoint-volume-kit

```txt
Role:
  bounded spatial trigger container

Upgrade:
  support:
    pickup zones
    proximity zones
    inspection zones
    activation zones
    collection volumes
    hand/object contact volumes

Composes with:
  action-input-kit
  route-checkpoint-kit
  layered-object-kit
  resource-pressure-kit

Emits:
  VolumeTriggerDescriptor
  PickupZoneDescriptor
  ProximityEvent
```

### camera-cinematic-maker-kit

```txt
Role:
  bounded camera descriptor container

Upgrade:
  add object camera modes:
    turntable
    inspection zoom
    material close-up
    near/mid/far readability shot
    before/after comparison shot
    pickup reveal shot

Composes with:
  render-layer-kit
  visual-pipeline-kit
  lighting-descriptor-kit
  scenario-qa-harness

Emits:
  CameraShotDescriptor
  InspectionCameraDescriptor
  ComparisonCameraDescriptor
```

### audio-event-feedback-maker-kit

```txt
Role:
  bounded audio cue descriptor container

Upgrade:
  add object cues:
    button click
    coin pickup
    crate thud
    potion glass clink
    liquid slosh
    hover tick
    invalid action bump
    activation chime

Composes with:
  action-input-kit
  diegetic-feedback-kit
  layered-object-kit

Emits:
  AudioCueDescriptor
  ObjectAudioEventDescriptor
```

### deterministic-replay-harness

```txt
Role:
  bounded same-seed replay container

Upgrade:
  verify object proof idempotency:
    same seed
    same spec
    same variant
    same descriptor shape
    same output hash
    same budget snapshot

Composes with:
  data-registry-kit
  visual-pipeline-kit
  performance-budget-kit
  scenario-qa-harness

Emits:
  ReplaySnapshot
  IdempotencyReport
  OutputHashReport
```

### scenario-qa-harness

```txt
Role:
  bounded proof validation container

Upgrade:
  run object proof scenarios:
    spawn object
    inspect object
    cycle variants
    compare passes
    check budgets
    check descriptor completeness
    verify replay hash

Composes with:
  deterministic-replay-harness
  gamehost-standard-kit
  visual-pipeline-kit
  performance-budget-kit

Emits:
  ScenarioResult
  ProofValidationReport
```

### gamehost-standard-kit

```txt
Role:
  bounded host contract container

Upgrade:
  make every proof packet runnable as a tiny standard experiment:
    load spec
    install kits
    run smoke test
    expose snapshot
    expose restart
    expose validation result

Composes with:
  all proof kits
  scenario-qa-harness
  deterministic-replay-harness

Emits:
  HostSnapshot
  SmokeResult
  StandardProofContract
```

## Secondary Existing Kits To Upgrade Later

### scan-survey-kit

```txt
Role:
  bounded scanning / survey target container

Upgrade:
  scan object surfaces
  identify material layers
  identify missing descriptors
  report visible state
```

### zone-field-kit

```txt
Role:
  bounded spatial field container

Upgrade:
  hold inspection fields
  hold proximity fields
  hold material-test zones
  hold environmental influence zones
```

### route-checkpoint-kit

```txt
Role:
  bounded route/checkpoint container

Upgrade:
  validate object pickup paths
  validate collection order
  validate inspection sequence
```

### cargo-delivery-kit

```txt
Role:
  bounded carry / drop / delivery container

Upgrade:
  test object carrying
  test crate delivery
  test potion placement
  test pickup/drop descriptors
```

### resource-pressure-kit

```txt
Role:
  bounded resource tension container

Upgrade:
  use coins/pickups as resource descriptors
  validate collection pressure
  validate spend/earn loops
```

### hazard-director-kit

```txt
Role:
  bounded hazard placement container

Upgrade:
  place dangerous objects
  place breakable props
  place blocked paths
  place timed object hazards
```

### agent-group-kit

```txt
Role:
  bounded group-agent container

Upgrade:
  make agents notice objects
  make agents pick objects
  make agents avoid hazards
  make agents react to diegetic feedback
```

### content-preset-kit

```txt
Role:
  bounded preset assembly container

Upgrade:
  convert idea packets into preset bundles
  compose proof recipes
  load object proof groups
```

### visual-fidelity-maker-kit

```txt
Role:
  bounded fidelity pass container

Upgrade:
  run visual improvement passes:
    material pass
    texture pass
    lighting pass
    surface overlay pass
    readability pass
    optimization pass
```

## Final Proof Packet Mapping

### banana-fidelity-proof

```txt
banana-fidelity-proof
├─ data-registry-kit
├─ content-palette-kit
├─ layered-object-kit
├─ material-palette-kit
├─ visual-pipeline-kit
├─ render-layer-kit
├─ performance-budget-kit
├─ lighting-descriptor-kit
└─ deterministic-replay-harness
```

### coin-readability-proof

```txt
coin-readability-proof
├─ data-registry-kit
├─ layered-object-kit
├─ material-palette-kit
├─ render-layer-kit
├─ camera-cinematic-maker-kit
├─ performance-budget-kit
├─ checkpoint-volume-kit
├─ diegetic-feedback-kit
└─ deterministic-replay-harness
```

### arcade-button-material-proof

```txt
arcade-button-material-proof
├─ data-registry-kit
├─ layered-object-kit
├─ action-input-kit
├─ material-palette-kit
├─ diegetic-feedback-kit
├─ audio-event-feedback-maker-kit
├─ render-layer-kit
├─ performance-budget-kit
└─ deterministic-replay-harness
```

### wooden-crate-wear-proof

```txt
wooden-crate-wear-proof
├─ data-registry-kit
├─ content-palette-kit
├─ layered-object-kit
├─ material-palette-kit
├─ visual-pipeline-kit
├─ instanced-render-kit
├─ performance-budget-kit
└─ deterministic-replay-harness
```

### potion-glass-material-proof

```txt
potion-glass-material-proof
├─ data-registry-kit
├─ layered-object-kit
├─ material-palette-kit
├─ lighting-descriptor-kit
├─ visual-pipeline-kit
├─ render-layer-kit
├─ diegetic-feedback-kit
├─ audio-event-feedback-maker-kit
├─ performance-budget-kit
└─ deterministic-replay-harness
```

## Final Update Priority

```txt
1. data-registry-kit
2. layered-object-kit
3. material-palette-kit
4. visual-pipeline-kit
5. render-layer-kit
6. performance-budget-kit
7. deterministic-replay-harness
8. action-input-kit
9. diegetic-feedback-kit
10. camera-cinematic-maker-kit
11. audio-event-feedback-maker-kit
12. gamehost-standard-kit
13. scenario-qa-harness
14. content-preset-kit
15. visual-fidelity-maker-kit
```

## Do Not Build

```txt
Do not build:
  banana-kit
  coin-kit
  button-kit
  crate-kit
  potion-kit

Do build:
  stronger bounded containers
  cleaner descriptors
  better composition points
  reusable proof harnesses
```

## Final Architecture Sentence

```txt
NexusEngine object proofs should be packet-driven compositions of bounded DSK containers, where each kit owns one replaceable capability and emits stable descriptors consumed by the next kit or by the renderer.
```
