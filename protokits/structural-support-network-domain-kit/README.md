# Structural Support Network Domain Kit

Defines gameplay-level support topology, semantic loads, capacity margins, repair state, and ordered failure propagation above provider-neutral physics observations.

## Boundary

- Owns support nodes/edges, anchors, loads, margins, unsupported-component detection, deterministic failure chains, repairs, snapshots, and risk descriptors.
- Does not own rigid-body integration, collisions, constraints, mesh fracture, debris rendering, placement, asset damage visuals, or scene-specific bridge content.
- Core Physics may supply normalized load/contact observations; the kit never owns provider objects.

## API and state

- Resource: `structuralSupport.state`
- API: `engine.n.structuralSupport.registerNetwork`, `.applyLoad`, `.setSupportState`, `.resolve`, `.getMargin`, `.getDescriptors`, `.getSnapshot`, `.loadSnapshot`, `.reset`
- Events: load applied, support lost/restored, failure propagated, command rejected, and reset under `structure.*`.
- Snapshot: portable graphs, loads, failures, tick, processed commands, and journal.

## Reuse proof

Use it for a storm-damaged bridge or fortress undermining. Bridge Under Siege should replay identical support edits and loads into the same ordered failure chain. Network IDs, observation command IDs, and one-way failure resolution prevent duplicated propagation.
