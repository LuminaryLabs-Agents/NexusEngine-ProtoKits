# DSM Architecture

DSM means **Domain Service Module**.

A DSM is the reusable architecture unit for NexusRealtime ProtoKits. A DSM is not merely a folder or a factory function. It is a module that defines a domain and exposes services that make that domain usable, composable, testable, and data-driven.

## Core definition

A DSM has two inseparable sides:

- **Domain:** what the module means. The domain is defined by the module that owns it.
- **Services:** the public API that makes the domain happen and lets other modules compose it.

Key sentence:

> In DSM architecture, a domain is defined by the module that owns it, and services are the API that allows that domain to happen, compose, and be reused.

## Recursive architecture

A DSM may compose child DSMs. Each child DSM also has domain meaning, services, data contracts, resources, events, and optional child DSMs.

```txt
Large DSM
  domain
  services
  child DSM
    domain
    services
    child DSM
      domain
      services
```

This repeats until the module is atomic.

A module is atomic when splitting it further would remove useful domain meaning or create helpers that are too small to own stable resources, events, data contracts, or services.

## Games are not architecture units

Games and experiments should compose DSMs through data. They should not define reusable architecture by themselves.

Good:

```txt
Fogline-style experiment
  uses RouteDSM
  uses TerrainDSM
  uses FogDSM
  uses ScanTargetDSM
  uses BeaconDSM
  uses ThreatPressureDSM
```

Bad:

```txt
FoglineEverythingKit
  owns route, terrain, trees, scan, fog, enemies, rendering, mission logic
```

## DSM and NexusRealtime runtime kits

A DSM intended to install into NexusRealtime should normally expose a runtime-kit-compatible factory. The runtime-facing surface should follow the NexusRealtime contract:

- `defineRuntimeKit`
- `defineResource`
- `defineEvent`
- `resources`
- `events`
- `systems`
- `requires`
- `provides`
- `initWorld`
- `install`
- `metadata`

A DSM can also expose pure services that do not install into the engine. Pure services still need deterministic behavior and tests.

## What a DSM owns

A DSM can own:

- serializable state resources
- command/input events
- output/fact events
- deterministic systems
- public engine API installed by the kit
- snapshot/reset/loadSnapshot behavior
- data validation/defaulting
- descriptor output for renderers

A DSM must not own:

- browser input listeners
- DOM state
- Canvas/WebGL/Three.js renderer objects
- game-specific story or level names unless it is a preset/bridge DSM
- hidden global state
- unseeded random
- wall-clock time as gameplay state

## Domain/service examples

### TreeDSM

Domain:

```txt
A tree is a woody plant structure with trunk, canopy, foliage density, spatial presence, and optional collision/occlusion meaning.
```

Services:

```txt
sampleTreeVariant()
spawnTreeInstances()
getColliderHints()
getRenderDescriptors()
```

Child DSMs:

```txt
TrunkDSM
CanopyDSM
LeafDSM
ScatterPlacementDSM
```

### LeafDSM

Domain:

```txt
A leaf is a foliage unit that contributes density, color variation, wind response, and canopy silhouette.
```

Services:

```txt
spawnLeaves()
sampleLeafColor()
getWindOffset()
getLeafDescriptors()
```

### RouteDSM

Domain:

```txt
A route is an authored or procedural traversal structure with ordered progress, curve samples, width, lanes, and route-local metadata.
```

Services:

```txt
sampleRoute(t)
nearestPoint(position)
progressAlongRoute(position)
makeRouteCorridor(width)
```

## DSM layering

Use these layers as guidance, not rigid folders:

1. **Foundation DSMs:** seeded random, math, timers, clocks, ledger/state utilities.
2. **Spatial DSMs:** route, terrain, placement, raycast, visibility, volumes.
3. **Object-domain DSMs:** tree, leaf, branch, gate, beacon, relay, pickup, structure, actor archetype.
4. **Gameplay DSMs:** scan target, checkpoint, threat pressure, resource pressure, build placement, objective progression.
5. **Presentation DSMs:** render descriptors, material palettes, fog descriptors, audio cues, camera descriptors.
6. **Bridge/preset DSMs:** game-specific data wiring and compatibility. These should stay thin.
7. **Harness DSMs:** replay, scenario QA, GameHost/debug snapshots.

## Composition rule

A parent DSM should use child DSM services through explicit data and API contracts. It should not reach into child private state.

```txt
Parent DSM
  configures child DSM through data
  calls child services or consumes child events
  emits higher-level domain facts
```

## Reliability rules

Every promoted DSM should be:

- deterministic under fixed input and fixed delta
- idempotent for repeated install/reset calls where possible
- serializable for snapshots
- replay-friendly
- independent from renderer implementations
- safe in headless tests
- explicit about `requires` and `provides`

## Naming rule

Use names that describe reusable domain/service meaning, not the first game that needs it.

Prefer:

```txt
ScanTargetDSM
BeaconDSM
RouteDSM
ScatterPlacementDSM
FogVolumeDSM
ThreatPressureDSM
```

Avoid:

```txt
FoglineScanKit
SoraGateKit
HellscapeTreeKit
```

Game names belong in presets, bridges, test fixtures, and experiment code.
