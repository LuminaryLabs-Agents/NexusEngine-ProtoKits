# Atomic Domain Kit Expander — 2026-06-24 12:28 ET

## Review scope

Reviewed the current NexusEngine ecosystem through the Atomic Domain Kit Expander lens:

- Core `.agent/intent.md` is still unavailable in `LuminaryLabs-Dev/NexusEngine`; the repository is reachable, but Core durable memory cannot be treated as reviewed until `.agent/intent.md` exists.
- ProtoKits `.agent/intent.md`, `.agent/architecture.md`, `.agent/dsk-boundaries.md`, `.agent/domain-backlog.md`, `.agent/protokit-map.md`, `.agent/smoke-tests.md`, `.agent/replay-qa.md`, `.agent/candidate-promotions.md`, and `.agent/scheduled-task-cycle.md` all continue to point toward reusable rendererless DSKs, downstream route proof, and higher-level domain consolidation.
- Experiments `.agent/cycle-state.md`, `.agent/experiment-map.md`, `.agent/replay-qa.md`, `experiments/next-ledge/src/session.js`, and `tests/next-ledge-route-progress-replay-spec-smoke.mjs` now show that `next-ledge` has consumed the atomic route-progress seam through `engine.n.genericRouteProgress`.

## What changed this cycle

No new reusable kit was created. That is intentional: the prior `generic-route-progress-kit` and `generic-route-cargo-extraction-kit` surfaces already cover the immediate route/checkpoint and delivery/extraction boundaries. Building another route/checkpoint kit now would duplicate the existing atomic surface instead of shrinking Experiments.

This cycle records a durable state correction: `generic-route-progress-kit` no longer lacks all downstream route proof. `next-ledge` now imports `createGenericRouteProgressKit`, builds DSK checkpoints from climb anchors, syncs anchor completion through `engine.n.genericRouteProgress`, exposes `domain.routeProgress`, and guards the partial route-progress seam with `tests/next-ledge-route-progress-replay-spec-smoke.mjs`.

## Repo state vs `.agent`

Repo state mostly matches `.agent`, but ProtoKits memory had one stale implication: some open-gap language still treated `generic-route-progress-kit` as having no Experiments consumption proof. The corrected state is:

- `generic-route-progress-kit`: atomic smoke + deterministic replay + partial downstream `next-ledge` consumption/spec proof.
- `generic-route-cargo-extraction-kit`: composite smoke + deterministic replay, but still no downstream route consumption proof.
- `next-ledge`: a partial route-progress consumer, not a full traversal/cargo executable lane.
- `signal-bastion`: still the only canonical route with executable route-domain replay.

## DSK boundary clarity

The boundary is clearer:

- Route-progress owns ordered checkpoints, route state, checkpoint enter/complete methods, route snapshots, and route-checkpoint descriptors.
- The route host keeps climb geometry, tether physics, grapple/collision sweep, camera state, browser input bridging, route fiction, and renderer presentation.
- Delivery/extraction should layer above route-progress only when cargo/resource/pressure consumption can be removed from route host code.

## Local JavaScript shrink

Do not claim a new local-JavaScript reduction from this cycle. The route-progress source migration already exists upstream in Experiments memory, but this cycle only reconciles ProtoKits durable memory with that state. The next measurable shrink target is cargo/resource/pressure in `next-ledge`, not another route-progress atom.

## Higher-level domains emerging

The strongest emerging domain remains the delivery/extraction loop:

```text
generic-route-progress-kit
+ generic-resource-loop-kit
+ generic-pressure-loop-kit
+ generic-route-cargo-extraction-kit
```

The route-progress proof makes the delivery/extraction path more credible, but the full lane should stay unclaimed until `next-ledge` consumes cargo/resource/pressure through the composite and adds executable or stronger fixed-tick replay coverage.

## ProtoKit guidance

Build/keep:

- `generic-route-progress-kit`
- `generic-route-cargo-extraction-kit`
- `generic-resource-loop-kit`
- `generic-pressure-loop-kit`

Do not build now:

- another route/checkpoint/objective kit;
- a monolithic traversal/cargo game kit;
- renderer, browser, DOM, Canvas, WebGL, Three.js, pointer-lock, browser-audio, asset-loading, collision, or route-fiction logic in ProtoKits.

Do not promote yet:

- `generic-route-progress-kit` has downstream partial consumption proof but still lacks full route-level executable replay/local-JS shrink evidence beyond the route-progress seam.
- `generic-route-cargo-extraction-kit` lacks downstream route consumption proof.

## Experiments guidance

Harden first:

- `next-ledge` as the traversal/cargo-pressure seed route.

Keep folded/backlog until they prove distinct reusable pressure:

- Harbor Salvage
- Cargo Chain
- Sky Courier
- Trainyard Switcher
- Dungeon Relay
- Floodplain Rescue

Do not add those as filler canonical routes just to approach the 20-route guidance.

## Missing smoke/replay

Still missing:

- `next-ledge` cargo/resource/pressure consumption through `generic-route-cargo-extraction-kit`.
- A route-host smoke or executable replay proving cargo pickup/delivery, pressure/resource deltas, route progress, and descriptors together.
- A full traversal/cargo-pressure lane digest distinct from Signal Bastion's strategic-pressure executable lane.

## Safest next main-branch patch plan

1. In Experiments, extend `next-ledge` metadata/specs to name the exact cargo/resource/pressure state that remains host-owned.
2. Add a static guard that fails if `next-ledge` claims `generic-route-cargo-extraction-kit` before importing and driving it.
3. In a later source patch, import `createGenericRouteCargoExtractionKit` only after the route has a real cargo/resource/pressure ledger to remove.
4. Keep tether physics, collision/hit testing, camera, browser input, rendering, assets, and route fiction in the route host.
