# ProtoKit Core Compatibility

Date: 2026-07-09
Status: validated candidate

## Decision

`protokit-core` is an incubation compatibility aggregate, not a canonical stable domain. Preserve its complete utility behavior, but promote it only as deprecated.

## Canonical replacements

- Runtime and DSK definitions: NexusEngine.
- Math: NexusEngine core utility kits.
- Seeded random and scoped seeds: NexusEngine foundation.
- Serialization and snapshots: NexusEngine foundation.
- Narrow list, ID, resource, clock, and weighted-choice helpers: compatibility API until source consumers migrate.

## Proof

- Full old utility surface remains exported.
- Native install exposes `engine.n.protokitCore` and compatibility alias.
- Reset/load/snapshot are exact and stateless.
- 1,000 seeded samples and 1,000 weighted choices replay identically.
- NexusEngine math, hash/seed, clone, and runtime definition parity is exercised.

## Boundary

Do not add gameplay, renderer, host, simulation, persistence, canonical math, canonical random, or canonical runtime-definition ownership.
