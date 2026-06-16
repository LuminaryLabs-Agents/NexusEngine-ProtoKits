# DSM Split Rules

Use this document to decide whether a requested behavior belongs in an existing DSM, a new child DSM, a preset/bridge, or an experiment.

## Default stance

Do not create a new DSM until you prove the domain/service boundary is reusable.

Prefer:

```txt
refine existing DSM
split child DSM
add data preset
add thin bridge
```

before creating a new top-level kit.

## Split when service meaning is reusable

Split a child DSM when one service could be useful outside the parent.

Example:

```txt
TreeDSM wants leaf spawning.
Leaf spawning is useful for trees, bushes, vines, ground cover, and canopy debris.
Create LeafDSM or LeafSpawnDSM instead of hiding it inside TreeDSM.
```

## Split when child domain has its own meaning

A child DSM should exist when the child has its own domain language.

Example:

```txt
TreeDSM
  child: LeafDSM
  child: TrunkDSM
  child: CanopyDSM
```

Leaves are not just implementation details; they have density, color, wind, spawn, and descriptor meaning.

## Split when testing becomes tangled

If a service cannot be tested without constructing unrelated game state, split it.

Bad:

```txt
To test scan progress, test must create fog, relays, wraiths, gates, and objective flow.
```

Better:

```txt
ScanTargetDSM test only creates scanner pose and targets.
RelayDSM composes ScanTargetDSM in a separate composition test.
```

## Split when resources/events multiply

A DSM is getting too large when it owns multiple independent resource/event families.

Warning signs:

```txt
terrain.state
route.state
tree.state
scan.state
objective.state
```

inside one kit.

Those are likely separate DSMs.

## Split when renderer meaning leaks into gameplay

A DSM that starts doing presentation should split descriptors from host rendering.

Good:

```txt
BeaconDSM outputs beacon descriptors.
Renderer draws beams/glow.
```

Bad:

```txt
BeaconDSM creates Three.js lights.
```

## Split when game names appear in generic code

If generic code says `fogline`, `sora`, `hellscape`, or `zombie-orchard`, check whether the behavior belongs in:

- a preset
- a bridge
- a demo
- a test fixture
- a generic DSM with reusable naming

## Do not split pure helpers too far

A helper does not need to be a DSM if it has no domain meaning, no state, no data contract, no events, and no composition value.

Examples that can stay helpers:

```txt
clamp()
lerp()
distance2()
normalizeAngle()
```

Examples that may deserve DSM/service status:

```txt
BezierSampleService
FacingConeService
ProgressTimerService
SeededRandomService
RaycastHitService
```

## Bridge/preset vs DSM

Use a bridge or preset when the logic is game-specific composition.

Bridge/preset examples:

```txt
Fogline survey-pressure bridge
Sora flight preset
Hellscape siege preset
Zombie Orchard survival bridge
```

DSM examples:

```txt
ScanTargetDSM
FogVolumeDSM
RouteDSM
ThreatPressureDSM
ResourcePressureDSM
```

## Atomic DSM test

A DSM is atomic enough when:

- its domain meaning is one coherent thing
- its services are tightly related
- it can be tested headlessly by itself
- it has a useful data contract
- it does not need unrelated parent state
- splitting it further would produce only generic helpers

## Parent DSM rule

A parent DSM should compose child DSMs through public services and data.

It should not read child internals or assume child resource layout unless the child explicitly provides that contract.

## Checklist

Before splitting:

```txt
[ ] The child has reusable domain meaning.
[ ] The child has services that other DSMs could use.
[ ] The child can be tested independently.
[ ] The split reduces coupling.
[ ] The split does not create a tiny meaningless wrapper.
```

Before not splitting:

```txt
[ ] The current DSM still has one coherent domain.
[ ] Services are not drifting into unrelated concerns.
[ ] Tests are still readable.
[ ] Public API is still small.
```
