# Extend Kit Rules

Branch scope: `0.0.2`.

This document applies the NexusRealtime cutover rule to the existing ProtoKits package exports.

The rule is:

```txt
Every ProtoKit extends the correct NexusRealtime base contract.
Every ProtoKit may compose other kits through declared dependencies.
A kit may own an internal loop only when the loop is a controlled subsystem under engine lifecycle.
```

## 1. Terms

```txt
Extend
  The kit conforms to an official NexusRealtime base contract.

Compose
  The kit uses other kits as dependencies or collaborators.

Own loop
  The kit runs an internal scheduler, worker, model loop, audio scheduler, polling loop, or render adapter loop.

Global loop
  The NexusRealtime engine tick. Gameplay truth should flow through this unless an exception is explicitly declared.
```

## 2. Mandatory metadata for every ProtoKit

Every existing and future ProtoKit should declare this shape.

```js
export const manifest = {
  id: "n--example-kit",
  packageId: "example-kit",
  domain: "traversal",
  subdomain: "rail",
  layer: "variant",
  extendsBase: "DomainServiceKit",
  extendsDomainBase: "TraversalKit",
  composes: ["LocomotionKit", "PhysicsKit", "RouteFieldKit"],
  provides: ["n:traversal.rail.switch"],
  requires: ["n:runtime.engine", "n:input.intent"],
  ownsLoop: false,
  loopPolicy: "engine-tick-only",
  snapshotPolicy: "serializable",
  resetPolicy: "engine-reset-aware",
  status: "wrap-core-base"
};
```

## 3. Allowed base contracts

```txt
DomainServiceKit
  For domain APIs, rules, validation, events, state transitions, and cross-domain hooks.

RuntimeKit / SystemKit
  For scheduler phase systems, engine-phase processing, simulation systems, and background services.

ObjectKit / ComponentKit
  For concrete actors, props, resources, inventories, structures, vehicles, and entity capabilities.

DescriptorKit / ContentKit
  For render descriptors, material descriptors, presets, recipes, content tables, palette definitions, and static data.

RenderAdapterKit
  For render adapters only. These may own render frame loops if lifecycle controlled.

AudioAdapterKit
  For audio engines or WebAudio scheduler wrappers only. These may own audio scheduling loops if lifecycle controlled.

ModelAdapterKit
  For model loading, tokenizer loading, inference queueing, and embedding/memory services.

HarnessKit
  For smoke tests, QA harnesses, deterministic replay, scenario checks, and validation runners.

CompositionKit
  For domain folders, manifests, bundle exports, and kit stacks that do not own behavior directly.
```

## 4. Loop policy

Default:

```txt
ownsLoop: false
loopPolicy: engine-tick-only
```

Allowed exceptions:

```txt
audio-scheduler-loop
render-adapter-loop
worker-streaming-loop
model-inference-loop
network-polling-loop
physics-micro-solver-loop
sensor-sampling-loop
```

Every loop exception must expose:

```txt
start()
stop()
pause()
resume()
dispose()
getLoopState()
snapshot impact
engine lifecycle bridge
```

Disallowed loops:

```txt
uncontrolled requestAnimationFrame in gameplay kits
setInterval mutating gameplay truth outside engine tick
DOM-owned gameplay loop
hidden async loop with no dispose
renderer loop mutating authoritative game state
```

## 5. Status tags

```txt
aligned-core-extension
  Already follows the expected NexusRealtime contract shape.

wrap-core-base
  Should import or adapt a NexusRealtime base kit and expose a narrower ProtoKit API.

domain-composition
  Should become a manifest/index that composes other kits.

prop-object-variant
  Concrete object/prop behavior. Lowest abstraction.

content-descriptor
  Static content, descriptors, recipes, palettes, or presentation data.

adapter-loop-exception
  May own a loop, but only under lifecycle control.

compatibility-wrapper
  Old flat export path remains but delegates to the new domain location.

promote-to-core-candidate
  Mature enough to consider moving into NexusRealtime core.

replace-with-core
  Duplicates NexusRealtime core behavior and should be deprecated after replacement.

archive
  Historical or obsolete after cutover.
```

## 6. Applied audit by existing ProtoKit group

The following rows cover the current package exports on branch `0.0.2`.

### 6.1 Runtime, foundation, host, and QA

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `foundation-kit`, `domain-foundation`, `domain-kits`, `domain-service-kits` | CompositionKit + DomainServiceKit compatibility | NexusRealtime `defineRuntimeKit`, `defineDomainServiceKit`, `extendDomainServiceKit` | engine-tick-only | compatibility-wrapper | Keep flat exports; move shared helper behavior into `protokits/_core/` and treat these as compatibility surfaces. |
| `gamehost-standard-kit` | HarnessKit + RuntimeKit | Engine lifecycle, state inspection, smoke hooks | engine-tick-only | wrap-core-base | Extend the NexusRealtime runtime/host contract; no separate runtime ownership. |
| `scenario-qa-harness`, `deterministic-replay-harness` | HarnessKit | Engine snapshots, command replay, smoke sequences | engine-tick-only | aligned-core-extension | Keep as harnesses; require lifecycle-aware setup/teardown. |
| `debug-overlay-kit` | HarnessKit / DescriptorKit | Engine surfaces, telemetry, debug descriptors | adapter-loop-exception only if UI polling is isolated | compatibility-wrapper | Debug UI cannot own gameplay truth. |
| `token-registry-kit` | ContentKit / RegistryKit | DSK tokens, package export metadata | engine-tick-only | content-descriptor | Use as token manifest bridge during cutover. |
| `universal-game-domain-kits` | CompositionKit | All domain manifests, projected kit IDs, existing ProtoKit aliases | engine-tick-only | domain-composition | Convert from generated kit catalog into migration manifest/status tracker over time. |

### 6.2 Input and action

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `action-input-kit`, `input-kit` | DomainServiceKit / InputIntentKit | Command queue, action maps, engine input surface | engine-tick-only | wrap-core-base | Align to NexusRealtime input-intent API; no direct DOM listener ownership except host adapter scope. |
| `generic-action-window-kit` | DomainServiceKit | InputIntentKit, timing/resource validators | engine-tick-only | aligned-core-extension | Keep as generic timing service; add `extendsBase` metadata. |
| `generic-affordance-descriptor-kit`, `generic-anchor-descriptor-kit` | DescriptorKit | InteractionTargetKit, spatial/query surfaces | engine-tick-only | content-descriptor | Descriptor only; no state mutation. |

### 6.3 Traversal, racing, vehicles, and movement

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `next-ledge-grapple-kit` | DomainServiceKit / TraversalKit | LocomotionKit, PhysicsKit, InteractionTargetKit, CameraKit | engine-tick-only | wrap-core-base | Become a traversal variant over core locomotion/physics. |
| `slope-traversal-kit` | DomainServiceKit / TraversalKit | TerrainKit, PhysicsKit, LocomotionKit | engine-tick-only | wrap-core-base | Remove any standalone movement assumptions. |
| `racer-contact-kit`, `racer-ai-kit`, `difficulty-curve-kit`, `race-hazard-kit`, `boost-path-kit`, `race-pacing-kit`, `course-director-kit`, `arcade-race-core`, `downhill-race-kit`, `arcade-race-visual-kit` | DomainServiceKit / SystemKit | LocomotionKit, VehicleDynamicsKit, RouteFieldKit, HazardDirectorKit, CameraKit | engine-tick-only | domain-composition + wrappers | Split into traversal, hazard, route, agent, and visual domains; keep old exports as compatibility wrappers. |
| `ocean-boat-kit` | DomainServiceKit / VehicleKit | VehicleDynamicsKit, WaterSurfaceKit, Cargo/Route kits | engine-tick-only | wrap-core-base | Boat motion extends vehicle + water base contracts. |
| `aerial-flight-kits` | DomainServiceKit / TraversalKit | LocomotionKit, CameraKit, RouteFieldKit, atmosphere descriptors | engine-tick-only | domain-composition | Keep as aerial traversal bundle; split subdomain manifests later. |

### 6.4 Spatial, scene, placement, and route structure

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `spatial-interaction-kit` | DomainServiceKit / InteractionTargetKit | Spatial queries, target descriptors, engine command surface | engine-tick-only | aligned-core-extension | Keep as core interaction composition surface. |
| `zone-field-kit` | DomainServiceKit / SpatialLayoutKit | RouteFieldKit, TransferZoneKit, hazard/director domains | engine-tick-only | wrap-core-base | Align zone membership and zone events to NexusRealtime surfaces. |
| `raycast-placement-kit` | DomainServiceKit / PlacementKit | TerrainKit, CameraKit, InteractionTargetKit | engine-tick-only | wrap-core-base | Placement queries only; renderer/host owns actual pointer source. |
| `scene-recipe-kit`, `content-preset-kit`, `asset-descriptor-kit` | ContentKit / DescriptorKit | ProceduralKit, RenderDescriptorKit, domain manifests | engine-tick-only | content-descriptor | Static authoring data; no runtime loop. |
| `route-checkpoint-kit`, `generic-mode-projected-route` | DomainServiceKit / ObjectiveFlowKit | RouteFieldKit, CompletionLedgerKit, SequenceNode | engine-tick-only | wrap-core-base | Checkpoints become objective/route services. |

### 6.5 Objective, completion, progression, and locks

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `objective-flow-kit`, `objective-bridge-kit`, `completion-ledger-kit` | DomainServiceKit / ObjectiveFlowKit | SequenceNode runtime, engine events, completion ledger resources | engine-tick-only | aligned-core-extension | Add explicit NexusRealtime base metadata and `n:` tokens. |
| `lock-group-kit` | DomainServiceKit / PuzzleSignalKit | InteractionTargetKit, ObjectiveFlowKit, ActionWindowKit | engine-tick-only | wrap-core-base | Move under puzzle-signal/lock domain. |

### 6.6 Pressure, resources, hazards, combat, and encounters

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `generic-pressure-loop-kit`, `generic-resource-loop-kit`, `resource-pressure-kit`, `timed-pressure-director-kit` | DomainServiceKit / PressureResourceKit | ScenarioDurationKit, TelemetryKit, PursuitPressureKit, engine resources | engine-tick-only | wrap-core-base | Pressure meters extend core scenario/telemetry timing. |
| `resource-node-kit` | ObjectKit / ResourceNodeKit | InteractionKit, ObjectiveFlowKit, EconomyKit | engine-tick-only | prop-object-variant | Treat as concrete resource object capability provider. |
| `hazard-director-kit`, `encounter-director-kit` | DomainServiceKit / HazardConflictKit | ScenarioDriverKit, PursuitPressureKit, TelemetryKit | engine-tick-only | wrap-core-base | Hazards are scheduled/activated by engine phases. |
| `damage-health-kit` | DomainServiceKit / CombatKit | ECS health resources, events, hazard/combat directors | engine-tick-only | wrap-core-base | Health/damage must become component/resource/event compatible. |

### 6.7 Build, structure, economy, and cargo

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `cargo-delivery-kit` | DomainServiceKit / CargoManifestKit | TransferZoneKit, TransportRouteKit, ObjectiveFlowKit | engine-tick-only | wrap-core-base | Delivery becomes cargo manifest + transfer zone service. |
| `build-placement-kit` | DomainServiceKit / PlacementKit | StructureRuntimeKit, TerrainKit, InteractionTargetKit | engine-tick-only | wrap-core-base | Placement validates, structure kit instantiates state. |
| `structure-runtime-kit` | ObjectKit / StructureKit | ECS structure components, lifecycle/progression kits | engine-tick-only | wrap-core-base | Structures must be engine entities/resources, not standalone state. |

### 6.8 Environment, terrain, atmosphere, vegetation, and water

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `biome-field-kit`, `vegetation-archetype-kit`, `ground-contact-kit`, `vegetation-lod-kit`, `scatter-object-kit` | DescriptorKit / EnvironmentKit | TerrainKit, RealismKit, RenderDescriptorKit, LOD/culling systems | engine-tick-only | wrap-core-base | Environment descriptors only; no renderer ownership. |
| `depth-fog-kit`, `lighting-mood-kit` | DescriptorKit / AtmosphereKit | AtmosphereKit, LightingKit, visual policy kits | engine-tick-only | content-descriptor | Provide descriptors/resources for renderer consumption. |
| `high-fidelity-meadow-kits`, `path-meadow-composition-kit` | CompositionKit | Terrain, vegetation, lighting, atmosphere, audio, visual targets | engine-tick-only | domain-composition | Keep as scene composition; move reusable pieces into environment domain. |
| `fluid-field-kit`, `fluid-motion-kit`, `fluid-shading-kit`, `fluid-effects-kit` | DomainServiceKit / FluidKit | Water kits, physics, material/visual descriptors | engine-tick-only unless solver worker is declared | wrap-core-base | Align fluid field/motion to core water/physics surfaces. |
| `water-data-kit`, `water-stream-kit`, `water-surface-kit`, `water-mesh-kit`, `water-shading-kit`, `water-physics-kit`, `water-behavior-kit`, `water-effects-kit`, `water-audio-kit`, `water-mode-kit` | DomainServiceKit / WaterSurfaceKit | TerrainKit, PhysicsKit, RealismKit, render/audio descriptors | engine-tick-only; stream/audio exceptions allowed with lifecycle | wrap-core-base | Water domain remains composed but must declare base and loop exceptions. |

### 6.9 Visual render and asset quality

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `adaptive-visual-core`, `visual-policy-domain-service-kit`, `render-capability-kit`, `render-quality-budget-kit`, `render-graph-kit`, `asset-quality-kit` | DomainServiceKit / VisualPolicyKit | RealismKit, RenderDescriptorKit, renderer surfaces, telemetry | engine-tick-only | promote-to-core-candidate | These are close to core render policy; consider promotion after stabilization. |
| `material-domain-service-kit`, `lighting-domain-service-kit`, `atmosphere-domain-service-kit`, `environment-content-kit` | DomainServiceKit / DescriptorKit | MaterialKit, LightingKit, AtmosphereKit, EnvironmentKit | engine-tick-only | promote-to-core-candidate | Keep renderer-independent and descriptor-first. |
| `render-culling-system-kit`, `lod-selection-system-kit`, `instance-batching-system-kit` | SystemKit | RenderDescriptorKit, RenderQualityBudgetKit, ECS/query surfaces | engine-tick-only | wrap-core-base | They may run per engine phase, not direct render frame ownership. |
| `canvas-render-adapter-kit`, `webgl-render-adapter-kit`, `webgpu-render-adapter-kit`, `raycaster-render-kit`, `floor-casting-kit` | RenderAdapterKit | Render graph, descriptor resources, engine lifecycle | render-adapter-loop allowed | adapter-loop-exception | May own adapter loop only under start/stop/dispose lifecycle. |
| `procedural-texture-kit`, `surface-material-kit`, `decal-kit`, `billboard-prop-kit` | DescriptorKit / MaterialKit | Material domain, render descriptors, asset quality | engine-tick-only | content-descriptor | Descriptor/preset only unless explicitly adapter scoped. |

### 6.10 Audio and feedback

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `audio-event-feedback-maker-kit`, `diegetic-feedback-signal-kit` | DomainServiceKit / AudioFeedbackKit | Engine events, feedback descriptors, objective/hazard domains | engine-tick-only; audio scheduler exception if adapter scoped | wrap-core-base | Emit descriptors/events; WebAudio scheduling must be adapter-scoped. |
| `generic-particle-background-kit` | DescriptorKit / VisualFeedbackKit | Render descriptors, visual policy | engine-tick-only | content-descriptor | No render loop; renderer consumes particle descriptors. |

### 6.11 Agent, model, perception, and social facts

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `agent-kit`, `agent-group-kit`, `perception-kit`, `affordance-choice-kit`, `rpg-social-fact-kit` | DomainServiceKit / AgentAIKit | Perception surfaces, affordance descriptors, command APIs, telemetry | engine-tick-only or sensor-sampling-loop if declared | wrap-core-base | Agents read engine surfaces and emit validated commands. |
| `model-manifest-kit`, `huggingface-loader-kit`, `model-download-cache-kit`, `model-loader-kit`, `tokenizer-loader-kit`, `onnx-loader-kit`, `embedding-memory-kit` | ModelAdapterKit / ContentKit | AgentKit, cache resources, model manifests, telemetry | model-inference-loop allowed with lifecycle | adapter-loop-exception | Split model loading from agent decision behavior. Must support dispose/reset. |

### 6.12 Generic defense kits

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `generic-defense-kits`, `generic-defense-aaa-kits`, `generic-defense-presentation-stack-kit` | CompositionKit + DomainServiceKit | HazardConflictKit, StructureKit, ObjectiveFlowKit, VisualFeedbackKit | engine-tick-only | domain-composition | Split into hazard, placement, objective, visual-render, and audio-feedback domains. Keep bundle exports for compatibility. |

### 6.13 Blackwake and game-specific composition kits

| Existing exports | Extends | Composes | Loop policy | Status | Cutover action |
|---|---|---|---|---|---|
| `blackwake-kit-registry`, `blackwake-gameplay`, `blackwake-game-isles`, `blackwake-game-stormline-rescue` | CompositionKit / GameModeKit | Ocean/vehicle/cargo/hazard/objective/visual kits | engine-tick-only; renderer adapter exception if isolated | domain-composition | These are not reusable domain primitives. Treat as scenario/game-mode composition bundles. |

## 7. Domain folder target

Target structure after cutover:

```txt
protokits/
├─ _core/
│  ├─ nexus-base.js
│  ├─ define-protokit-extension.js
│  ├─ define-domain-composition.js
│  ├─ define-prop-kit.js
│  └─ loop-policy.js
├─ domains/
│  ├─ runtime/
│  ├─ input-action/
│  ├─ object-capability/
│  ├─ spatial-layout/
│  ├─ traversal/
│  ├─ interaction-affordance/
│  ├─ objective-progression/
│  ├─ pressure-resource/
│  ├─ hazard-conflict/
│  ├─ economy-cargo/
│  ├─ craft-repair/
│  ├─ puzzle-signal/
│  ├─ survey-cartography/
│  ├─ environment/
│  ├─ visual-render/
│  ├─ audio-feedback/
│  ├─ agent-ai/
│  └─ authoring-qa/
└─ legacy-flat-exports/
```

Each domain folder should have:

```txt
manifest.js
index.js
README.md
variants/
props/
adapters/
```

## 8. Migration order

```txt
1. Add _core helpers.
2. Add domain manifests that classify existing exports.
3. Keep flat package exports stable.
4. Move bundles first: universal-game-domain-kits, generic-defense, blackwake, meadow.
5. Wrap runtime/host/QA kits over NexusRealtime base contracts.
6. Wrap input/action/objective/pressure/hazard/economy kits.
7. Wrap traversal/spatial/environment/water/visual/audio/agent kits.
8. Add loop exception manifests for render/audio/model/streaming kits.
9. Add tests that verify every package export has a rule record.
10. Promote stable kits back into NexusRealtime core only after tests and experiment proof.
```

## 9. Acceptance checks

A kit passes the extend-kit rule when:

```txt
It declares extendsBase.
It declares domain and subdomain.
It declares composed dependencies.
It declares provides/requires tokens.
It has no hidden renderer/input/runtime ownership.
It has snapshot/reset behavior.
It has loopPolicy.
If ownsLoop is true, it exposes lifecycle controls.
Existing flat export still works.
Domain import path works.
```

## 10. Hard rule

```txt
No orphan ProtoKits.
No duplicate runtime.
No duplicate renderer ownership.
No unmanaged local loops.
No game-name kits unless they are explicit GameMode/Scenario composition kits.
```
