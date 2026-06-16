# DSM Promotion Guide

ProtoKits exist to prove reusable game architecture before stable surfaces are promoted into NexusRealtime core.

A DSM can be experimental, promoted-within-ProtoKits, or stable-candidate-for-core.

## Promotion levels

### Experimental DSM

Allowed to change quickly.

Requirements:

- reusable name
- clear domain/service meaning
- no hidden renderer dependency unless it is a renderer adapter
- basic import/factory smoke

### Promoted ProtoKit DSM

Reusable enough for multiple experiments.

Requirements:

- data-driven
- headless tests
- reset/snapshot behavior if stateful
- documented resources/events/API
- stable `requires` and `provides`
- no game-specific naming
- renderer-agnostic output

### Stable core candidate

Ready to consider for NexusRealtime core.

Requirements:

- used by more than one experiment/game or clearly fundamental
- deterministic fixed-delta behavior
- save/load or snapshot strategy
- replay-safe command/event model
- small public API
- strong tests
- migration notes
- documentation of boundaries and non-ownership

## Promotion gate checklist

```txt
[ ] DSM has a reusable name.
[ ] Domain meaning is documented.
[ ] Services/API are documented.
[ ] Data contract is documented.
[ ] Resources/events are documented.
[ ] Requires/provides tokens are explicit.
[ ] Public engine API is small.
[ ] State is serializable.
[ ] Reset/snapshot behavior is tested.
[ ] Deterministic tick behavior is tested.
[ ] Renderer boundary is clean.
[ ] Headless tests exist.
[ ] Used by at least one real experiment.
[ ] Game-specific bridge/preset code is separate.
```

## What must stay out of core

Core NexusRealtime should not receive:

- game-specific content
- one-off presets
- browser renderer code
- DOM helpers
- experimental APIs without tests
- giant feature blobs with unclear domain boundaries

## What can promote

Good candidates:

```txt
RouteDSM
ScanTargetDSM
ProgressTimerDSM
ResourcePressureDSM
TerrainSamplerDSM
RaycastHitDSM
RenderDescriptorDSM
ReplayHarnessDSM
```

Poor candidates:

```txt
FoglineRelayEverythingKit
SoraBirdOnlyKit
ZombieOrchardSpecificTreeKit
```

## Promotion path

```txt
Experiment behavior
  -> thin bridge/preset in Experiments
  -> reusable DSM in ProtoKits
  -> hardened promoted DSM in ProtoKits
  -> stable NexusRealtime core surface if broadly reusable
```

## Evidence required

Promotion should cite:

- which experiments use the DSM
- tests run
- known consumers
- public API shape
- state/event model
- why it is not game-specific
- what would break if the API changes

## Defer promotion when

- only one game uses it and the domain is still unclear
- it still needs renderer code to function
- data contracts are not stable
- tests are missing
- save/load/replay behavior is unknown
- public API is still growing quickly
