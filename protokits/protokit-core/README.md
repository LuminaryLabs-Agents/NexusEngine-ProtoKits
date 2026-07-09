# protokit-core

Compatibility aggregate for older ProtoKits that imported shared deterministic utilities.

## Classification

- Path: `n:compatibility:protokit-core`
- API: `engine.n.protokitCore`
- Scope: compatibility bridge
- Candidate target: deprecated, not official

This is not a new canonical foundation domain. NexusEngine owns runtime definitions, core utility math, seeded random, serialization, snapshots, and clock/runtime contracts. The compatibility DSK preserves the full old utility API while source kits migrate to those owners or retain narrow local helpers.

## Preserved API

```text
number, clamp, lerp, approach, asList, clone, distance2D
getClockDelta, getClockElapsed
createFallbackDefinition, defineInjectedRuntimeKit, createDefinitionFactory, ensureResource
hashString, scopedSeed, stableId, byId
createSeededRandom, weightedChoice
getSnapshot, loadSnapshot, reset
```

## Boundary

Owns compatibility only. It does not become the owner of gameplay, simulation, input, rendering, host behavior, persistence, random policy, math policy, or NexusEngine runtime definitions.

## Promotion decision

Promote to NexusEngine-Kits only as a deprecated compatibility entry with complete replacement lineage. New kits should import canonical NexusEngine functions directly and must not add new behavior here.
