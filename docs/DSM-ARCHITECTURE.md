# DSM Architecture

DSM means **Domain Service Module**.

DSM is the architecture concept. A **kit** is the implementation unit in this repository.

```txt
DSM = architecture concept
Kit = implementation unit
```

A ProtoKit is the implementation form of a DSM: it defines a domain and exposes services that make that domain usable, composable, testable, and data-driven.

## Core definition

A kit has two inseparable DSM sides:

- **Domain:** what the module means. The domain is defined by the kit that owns it.
- **Services:** the public API that makes the domain happen and lets other modules compose it.

Key sentence:

> In DSM architecture, a domain is defined by the kit that owns it, and services are the API that allows that domain to happen, compose, and be reused.

## Naming rule

Use DSM language when reasoning about architecture. Use `-kit` names in implementation.

```txt
Architecture phrase: Tree domain
Implementation:      tree-kit
Factory:             createTreeKit()
```

Do not create implementation folders named `tree-dsm` or factories named `createTreeDSM()`.

See `docs/DSM-KIT-NAMING.md` for the full naming contract.

## Recursive architecture

A kit may compose child kits. Each child kit also has domain meaning, services, data contracts, resources, events, and optional child kits.

```txt
large-kit
  domain
  services
  child-kit
    domain
    services
    child-kit
      domain
      services
```

This repeats until the module is atomic.

A module is atomic when splitting it further would remove useful domain meaning or create helpers that are too small to own stable resources, events, data contracts, or services.

## Games are not architecture units

Games and experiments should compose kits through data. They should not define reusable architecture by themselves.

Good:

```txt
Fogline-style experiment
  uses route-kit
  uses terrain-sampler-kit
  uses fog-volume-kit
  uses scan-target-kit
  uses beacon-kit
  uses threat-pressure-kit
```

Bad:

```txt
fogline-everything-kit
  owns route, terrain, trees, scan, fog, enemies, rendering, mission logic
```

## DSM and NexusEngine runtime kits

A DSM intended to install into NexusEngine should expose a runtime-kit-compatible factory using normal kit naming:

```txt
createTreeKit()
createRouteKit()
createBiomeFieldKit()
```

The runtime-facing surface should follow the NexusEngine contract:

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

A kit can also expose pure services that do not install into the engine. Pure services still need deterministic behavior and tests.

## What a kit owns

A kit can own:

- serializable state resources
- command/input events
- output/fact events
- deterministic systems
- public engine API installed by the kit
- snapshot/reset/loadSnapshot behavior
- data validation/defaulting
- descriptor output for renderers

A reusable domain/service kit must not own:

- browser input listeners
- DOM state
- Canvas/WebGL/Three.js renderer objects
- game-specific story or level names unless it is a preset/bridge kit
- hidden global state
- unseeded random
- wall-clock time as gameplay state

## Domain/service examples

### Tree domain implemented by `tree-kit`

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

Child kits:

```txt
trunk-kit
canopy-kit
leaf-kit
scatter-placement-kit
```

### Leaf domain implemented by `leaf-kit`

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

### Route domain implemented by `route-kit`

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

1. **Foundation kits:** seeded random, math, timers, clocks, ledger/state utilities.
2. **Spatial kits:** route, terrain, placement, raycast, visibility, volumes.
3. **Object-domain kits:** tree, leaf, branch, gate, beacon, relay, pickup, structure, actor archetype.
4. **Gameplay kits:** scan target, checkpoint, threat pressure, resource pressure, build placement, objective progression.
5. **Presentation descriptor kits:** render descriptors, material palettes, fog descriptors, audio cues, camera descriptors.
6. **Bridge/preset kits:** game-specific data wiring and compatibility. These should stay thin.
7. **Harness kits:** replay, scenario QA, GameHost/debug snapshots.

## Composition rule

A parent kit should use child kit services through explicit data and API contracts. It should not reach into child private state.

```txt
parent-kit
  configures child kit through data
  calls child services or consumes child events
  emits higher-level domain facts
```

## Reliability rules

Every promoted kit should be:

- deterministic under fixed input and fixed delta
- idempotent for repeated install/reset calls where possible
- serializable for snapshots
- replay-friendly
- independent from renderer implementations
- safe in headless tests
- explicit about `requires` and `provides`

## Naming rule summary

Use names that describe reusable domain/service meaning, not the first game that needs it.

Prefer:

```txt
scan-target-kit
beacon-kit
route-kit
scatter-placement-kit
fog-volume-kit
threat-pressure-kit
```

Avoid:

```txt
fogline-scan-kit
aerial-gate-kit
hellscape-tree-kit
```

Game names belong in presets, bridges, test fixtures, and experiment code.
