# API Surface Pruner Cycle Report — 2026-06-23 20:30 America/New_York

## Lens

Shrink and normalize ProtoKit APIs into clear DSK communication boundaries while keeping compatibility safe.

## What changed

- Added `GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE = "genericDefense"` to `generic-defense-dsk-boundaries`.
- Added `syncGenericDefenseDskEngineNamespace(engine)` so installed defense DSK aliases are mirrored to `engine.n.genericDefense.<boundary>`.
- Wrapped atomic DSK alias `install()` calls so namespace sync happens automatically after each install.
- Added `metadata.engineNamespace` to each annotated atomic boundary kit.
- Re-exported the namespace constant and sync helper from `generic-defense-aaa-dsk-bridge`.
- Strengthened `tests/generic-defense-dsk-boundaries-smoke.test.mjs` to assert namespaced method descriptors, metadata, namespace mirroring, resources/events discovery, semantic commands through `engine.n.genericDefense.sessionFacade`, descriptor reads through `engine.n.genericDefense.renderDescriptors`, and DOM/Canvas exclusion.
- Updated `docs/generic-defense-api-surface-pruner.md` with the preferred namespaced call surface.

## Long-form intent from `.agent/`

Core owns stable runtime primitives and promoted contracts. ProtoKits owns reusable domain-service kits before Core promotion. Experiments should remain thin hosts that compose kits, bridge browser input, tick runtime, and render snapshots/descriptors. DSKs are layered communication boundaries through resources, events, methods, snapshots, and descriptors, not gap fillers.

## Repo state vs `.agent/`

ProtoKits now matches `.agent/` better: generic defense still keeps compatibility surfaces, but the preferred call surface is smaller and boundary-shaped. The broad compatibility APIs remain intact; no destructive route or kit deletion happened.

Core still lacks the expected `.agent/intent.md` in this run, so Core memory drift remains external to this ProtoKits patch.

Experiments already has Signal Bastion executable route replay and browser-host facade guard coverage, so the new namespace creates the next safe host-shrink seam without pushing reusable implementation into Experiments.

## DSK clarity

The seven atomic generic-defense boundaries now have three levels of clarity:

1. factory aliases: `createGenericDefense*Dsk()`
2. metadata descriptors: resources/events/methods/snapshots/descriptors plus `metadata.engineNamespace`
3. runtime namespace: `engine.n.genericDefense.<boundary>`

This should make future route code and promotion review less dependent on broad game-flavored facades.

## Local experiment JavaScript

No Experiments files changed in this patch, so local experiment JavaScript did not shrink in this run. The new namespace is explicitly intended to allow a later safe Signal Bastion host reduction.

## Emerging higher-level domains

- Strategic pressure loop: defense + resources + agents + hazards.
- Delivery/extraction loop: route/checkpoint + cargo/resource + hazards.
- Survey pressure loop: scan/affordance + zone fields + timed pressure.

## ProtoKit build / merge / prune / promote status

- Build/keep: `generic-defense-dsk-boundaries` with `engine.n.genericDefense.<boundary>` aliases.
- Keep compatible: `generic-defense-kits` and `generic-defense-aaa-kits`.
- Prune through migration: `generic-defense-aaa-dsk-bridge` should move hosts to the namespaced DSK seams while keeping compatibility exports.
- Do not promote yet: broad AAA facade and full generic defense composite remain too large/game-host flavored.
- Promote later only after proof: atomic map/economy/build/wave/combat/session/render boundaries after namespaced host consumption and stable smoke/replay coverage.

## Experiments canonical / fold / harden status

- Keep `signal-bastion` as the canonical strategic-pressure proof lane.
- Do not delete defense/survival/action variants based on this patch alone.
- Next hardening should switch remaining Signal Bastion browser host convenience calls to `engine.n.genericDefense.<boundary>` where the existing bridge/spec/executable/facade smokes stay green.

## Missing smoke/replay

- I could not run `npm test` in this runtime.
- Still missing: Core-backed integration smoke inside ProtoKits with stable local Core package wiring.
- Still missing: Experiments patch that proves the browser Signal Bastion host can call the namespaced DSK seams without adding local simulation state.
- Still missing: executable route-domain replays for other canonical lanes; do not add them until real reusable ProtoKit boundaries exist.

## Safest next main-branch patch plan

In Experiments, update the Signal Bastion browser host to call `engine.n.genericDefense.sessionFacade` and `engine.n.genericDefense.renderDescriptors` for the seams already guarded by replay/facade smokes. Keep compatibility facades in place for foundation/build/wave/scale only where current UI/input bridges still require them. Add or update the static facade guard so it requires the namespaced call surface and still blocks route-local simulation, browser-owned state machines, and broad `createGenericDefenseKits()` imports.
