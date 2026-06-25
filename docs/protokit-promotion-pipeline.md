# ProtoKit Promotion Pipeline

## Goal

Use ProtoKits as the incubation factory for reusable NexusRealtime DSK/domain behavior.

The pipeline is:

```txt
Experiment pressure
→ ProtoKit boundary
→ headless test proof
→ replay / fixed-tick proof where relevant
→ downstream Experiments consumption
→ promotion review
→ Core handoff only when stable
```

Core should receive stable generic kits only after proof. Broad suites, compatibility bridges, presets, deploy kits, and game-family bundles stay in ProtoKits unless their atomic child domains independently earn promotion.

## Status Matrix

The current promotion and classification map lives at:

```txt
protokits/kit-status-matrix.json
```

It classifies high-signal current ProtoKits as:

```txt
atomic-dsk
atomic-dsk-family
composite-dsk
game-family-kit
renderer-descriptor-kit
compatibility-bridge
incubation-suite
```

Each entry must include:

```txt
id
classification
promotionStatus
currentAction
nextLedge
doNotDoNext
```

## Promotion Gate

A ProtoKit can become promotion-facing only when it has:

```txt
generic behavior
deterministic state
stable resources/events/API
renderer independence
headless tests
replay or fixed-tick proof where relevant
downstream Experiments consumption proof
documentation and known limitations
a recorded promotion decision
```

## Split Gate

A ProtoKit should be split when it:

```txt
owns too many unrelated domains
has too many public APIs
mixes input, simulation, UI, and rendering
cannot be configured cleanly
is useful only as a whole game or game-family suite
```

## Hold Gate

A ProtoKit should stay on promotion hold when it is:

```txt
a compatibility bridge
a broad composite coordinator
a maximum-feature suite
a renderer/platform adapter
a preset/deploy package
a game-family stack whose child domains are not independently proven
```

## Current First Promotion-Facing Surfaces

The first promotion-facing surfaces are atomic DSKs after replay and multi-config proof:

```txt
generic-pressure-loop-kit
generic-resource-loop-kit
generic-action-window-kit
generic-affordance-descriptor-kit
generic-route-progress-kit after downstream route replay proof
generic-defense-dsk-boundaries child aliases after per-boundary route proof
```

## Current Composite Holds

These are useful but not Core-ready as bundles:

```txt
generic-route-cargo-extraction-kit
generic-defense-aaa-dsk-bridge
generic-defense-session-command-kit
vertical-climb-family
arcade-race-family
open-world-flight-family
vr-platformer-kit-suite
```

## Required Review Record

Every promotion, split, hold, merge, archive, or Core-handoff decision should leave one of:

```txt
.agent/turn-ledger/<date>-<topic>.md
.agent/cycle-reports/<date>-<topic>.md
.agent/candidate-promotions.md update
protokits/kit-status-matrix.json update
```

## Next Ledge

After this bootstrap, the safest next implementation patches are:

```txt
1. Run node tests/kit-status-matrix-smoke.test.mjs directly.
2. Wire kit-status-matrix-smoke into npm test when the package script can be updated safely.
3. Add downstream next-ledge consumption proof for generic-route-cargo-extraction-kit.
4. Add deterministic replay for one child boundary inside vr-platformer-kit-suite.
5. Add per-boundary promotion reviews for generic-defense DSK child aliases.
```
