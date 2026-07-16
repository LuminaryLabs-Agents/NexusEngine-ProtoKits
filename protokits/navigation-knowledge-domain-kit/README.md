# Navigation Knowledge Domain Kit

Defines observer-specific knowledge of places, links, hazards, closures, confidence, provenance, and staleness separately from world truth and pathfinding.

## Boundary

- Owns observers, known navigation facts, confidence decay, versioned sharing/merge rules, provenance, snapshots, and knowledge descriptors.
- Does not own authoritative world truth, pathfinding, navmeshes, movement, map/fog rendering, quest progress, or persistence transport.
- Core World/Scene/Spatial own truth; this kit owns what each observer currently knows.

## API and state

- Resource: `navigationKnowledge.state`
- API: `engine.n.navigationKnowledge.registerObserver`, `.observe`, `.markClosure`, `.share`, `.advance`, `.getKnownGraph`, `.getDescriptors`, `.getSnapshot`, `.loadSnapshot`, `.reset`
- Events: knowledge discovered/updated/shared/stale, command rejected, and reset.
- Snapshot: observers, facts, provenance, tick, command ledger, and journal.

## Reuse proof

Use it for storm-invalidated mountain passages or partial dungeon maps shared by separated explorers. Lost Migration should preserve different observer graphs and replay the same confidence transitions. Fact versions and command IDs make observation/share merges idempotent.
