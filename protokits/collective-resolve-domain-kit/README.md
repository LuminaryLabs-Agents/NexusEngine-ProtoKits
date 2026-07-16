# Collective Resolve Domain Kit

Defines group-level readiness, leadership, shock, recovery, break, rally, and steady-state semantics without replacing individual emotions or generic meters.

## Boundary

- Owns collectives, weighted member readiness, leadership anchors, recovering shocks, break/rally thresholds, snapshots, and group-readiness descriptors.
- Does not own individual relationships, agent planning, combat, formations, dialogue, animation, UI, or audio playback.
- Core Agent supplies stable member identity; Core Simulation supplies runtime primitives. Group aggregation remains this kit's distinct meaning.

## API and state

- Resource: `collectiveResolve.state`
- API: `engine.n.collectiveResolve.registerCollective`, `.setMemberReadiness`, `.recordShock`, `.setLeaderState`, `.attemptRally`, `.advance`, `.getDescriptors`, `.getSnapshot`, `.loadSnapshot`, `.reset`
- Events: resolve changed/shaken/broken/rally started/rallied, command rejected, and reset.
- Snapshot: collectives, members, leaders, shocks, score/status, tick, command ledger, and journal.

## Reuse proof

Use it for evacuation teams or defending squads. Bridge Under Siege should reproduce identical breaks and rallies from the same member, leader, and shock facts. Stable member upserts and command IDs prevent duplicated shock or rally facts.
