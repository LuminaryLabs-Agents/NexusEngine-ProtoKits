# DSM Authoring Guide

Use this guide when creating or refining a ProtoKit as a Domain Service Module.

## Authoring target

A good DSM is a reusable module that:

- defines one clear domain
- exposes small services/API that make the domain happen
- accepts serializable data
- emits explicit events
- owns explicit resources
- composes child DSMs only through public contracts
- can run headlessly
- can reset, snapshot, replay, and save-load where relevant

## Step 1: Name the domain, not the game

Start with the reusable concept.

Good:

```txt
RouteDSM
TerrainSamplerDSM
ScanTargetDSM
TreeDSM
LeafDSM
BeaconDSM
ThreatPressureDSM
```

Bad:

```txt
FoglineRouteKit
SoraCheckpointThing
ZombieTreeKit
```

Game-specific names are allowed only for presets, compatibility bridges, demos, and tests.

## Step 2: Define the domain meaning

Write one paragraph:

```txt
This DSM defines ______ as ______.
```

Example:

```txt
TreeDSM defines trees as spatial foliage structures with trunk, canopy, leaf density, variant selection, render descriptors, and optional collision/occlusion hints.
```

If the paragraph contains several unrelated meanings, split the DSM.

## Step 3: Define services as the API

Services are the public API that make the domain usable.

Examples:

```txt
RouteDSM services:
  sampleRoute(t)
  nearestPoint(position)
  progressAlongRoute(position)
  makeRouteCorridor(width)

ScanTargetDSM services:
  registerTarget(data)
  setScannerPose(data)
  pulseScan(command)
  getSnapshot()

TreeDSM services:
  registerSpecies(data)
  spawnTreeInstances(data)
  getColliderHints()
  getRenderDescriptors()
```

Keep services small and verb-based. Do not expose internal resources directly unless the runtime-kit pattern requires it.

## Step 4: Define data contracts

Data configures the DSM. Code defines behavior; data defines the content/tuning.

A data contract should include:

- required fields
- optional fields and defaults
- stable IDs
- units
- ranges
- deterministic seed behavior
- invalid data behavior

Example:

```js
{
  id: "pine-forest",
  seed: "forest-001",
  density: 0.7,
  species: ["pine", "dead-birch"],
  placement: {
    avoidRouteWidth: 4,
    minSpacing: 1.8,
    maxSlope: 0.55
  }
}
```

## Step 5: Define resources and events

Resources are owned state. Events are facts/commands that cross module boundaries.

Use predictable names:

```txt
route.state
route.registered
route.progressed
scanTarget.state
scanTarget.completed
terrainSampler.state
placement.spawned
```

Prefer command/fact separation:

```txt
command: scanTarget.scanRequested
fact: scanTarget.completed
```

## Step 6: Decide child DSMs

Ask:

- Is part of this domain reusable by another domain?
- Does it have its own data contract?
- Does it have its own events/resources?
- Can it be tested without the parent?

If yes, make it a child DSM.

Example:

```txt
TreeDSM
  child DSMs:
    LeafDSM
    TrunkDSM
    CanopyDSM
    ScatterPlacementDSM
    ColliderHintDSM
```

## Step 7: Implement runtime-kit compatibility

A runtime-installed DSM should usually export a factory like:

```js
export function createExampleKit(NexusRealtime, options = {}) {
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  // define resources/events/systems/install/initWorld
  return defineRuntimeKit({ ... });
}
```

Required habits:

- use the supplied NexusRealtime dependency object
- declare `requires` and `provides`
- initialize resources in `initWorld`
- keep systems deterministic
- install a small public engine API only if needed
- expose `getState`, `getSnapshot`, `reset`, and `loadSnapshot` where useful

## Step 8: Keep reusable DSMs renderer-independent

Reusable DSMs can output render descriptors but must not draw.

Allowed:

```txt
render descriptor arrays
material descriptor IDs
instance descriptor batches
camera target descriptors
audio cue descriptors
```

Not allowed in reusable DSMs:

```txt
DOM access
Canvas API
Three.js object creation
WebGL context access
fetch/localStorage
browser input listeners
```

Those belong in hosts, renderer adapters, demos, or bridge/preset code.

## Step 9: Add tests before promotion

Minimum tests:

- import smoke
- factory smoke
- headless state transition
- reset/snapshot
- composition with at least one adjacent DSM if applicable
- data contract defaults

## Step 10: Export and document

Add or update:

- `package.json` export map if this is public
- `protokits/<name>/README.md` if the DSM is significant
- `docs/DSM-CATALOG.md` if this establishes a new family
- tests and smoke coverage

## Authoring checklist

Before coding:

```txt
[ ] Domain meaning is clear.
[ ] Services/API are listed.
[ ] Data contract is explicit.
[ ] Resources/events are named.
[ ] Child DSMs are identified.
[ ] Renderer boundary is clear.
[ ] Tests are planned.
```

Before merging:

```txt
[ ] Reusable code is not game-specific.
[ ] Public API is small.
[ ] State is serializable.
[ ] Reset/snapshot are deterministic.
[ ] No renderer/browser dependencies in reusable DSM.
[ ] Tests pass.
[ ] Exports/docs are updated.
```
