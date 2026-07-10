# Seed Stream Service

Date: 2026-07-09
Status: candidate validated

## Intention

Resolve the stable `seed-kit` baseline without duplicating the NexusEngine seeded-random primitive or retaining the old generic catch-all runtime.

## Domain graph

```text
nexusengine/foundation seeded-random primitive
  -> n:foundation:seed-stream
     -> engine.n.seedStream
     -> world seed
     -> bounded named streams
     -> deterministic snapshot/replay
```

## Preserved behavior

- `createGenericSeedKit(NexusEngine, config)` remains valid.
- Generic engine aliases remain available.
- Existing `seed:world`, `random:seeded`, and `random:stream` capability tokens remain.
- Deterministic random state is upgraded from one broad generic state object to independently replayable named streams.

## Boundary

The DSK does not own procedural generation, loot or encounter policy, world content, simulation ticks, persistence transport, networking, rendering, input, or entropy.

## Evidence

- Real NexusEngine installation and native DSK metadata.
- 1,000 values match the NexusEngine scoped seeded-random primitive.
- Named streams remain independent of call order in sibling streams.
- Snapshot/load reproduces exact continuation.
- Reset and world-seed replacement are deterministic.
- Duplicate and over-limit state is rejected before mutation.
- 1,000 named streams snapshot and restore.
- Repository-wide consumer search found no active downstream runtime outside the ProtoKit owner, so no compatibility caller required source changes.
