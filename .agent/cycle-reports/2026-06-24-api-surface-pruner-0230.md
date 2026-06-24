# 2026-06-24 — API Surface Pruner 0230

## Lens

Shrink and normalize ProtoKit APIs into clear DSK communication boundaries with resources, events, methods, snapshots, descriptors, headless tickability, and `engine.n.<domain>` surfaces where appropriate.

## Reviewed memory

- `.agent/intent.md` confirms the long-form intent: Core owns stable runtime/promoted contracts, ProtoKits owns reusable domain-service kits before Core promotion, and Experiments stays thin by composing kits, bridging browser input, ticking runtime, and rendering snapshots/descriptors.
- `.agent/protokit-map.md`, `.agent/candidate-promotions.md`, `.agent/smoke-tests.md`, and `.agent/cycle-state.md` already identified `generic-route-progress-kit` and `generic-route-cargo-extraction-kit` as the next traversal/cargo lane after the generic-defense namespace work.
- Experiments `.agent` memory still says `next-ledge` is the safest first route-progress consumer, but local JavaScript shrink must not be claimed until a route consumes the boundary.
- Core `.agent/intent.md` is still unavailable through the repository contents API, so this patch stayed scoped to ProtoKits.

## What changed

- Added `engine.n.genericRouteProgress` as the preferred route/checkpoint/objective-progress API while preserving `engine.genericRouteProgress` compatibility.
- Added `GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE` and `syncGenericRouteProgressEngineNamespace(engine)`.
- Added `engine.n.genericResourceLoop` as the preferred resource/meter API while preserving `engine.genericResourceLoop` compatibility.
- Added `syncGenericResourceLoopEngineNamespace(engine)`.
- Added `engine.n.genericPressureLoop` as the preferred pressure/channel API while preserving `engine.genericPressureLoop` compatibility.
- Added `syncGenericPressureLoopEngineNamespace(engine)`.
- Updated `generic-route-cargo-extraction-kit` so snapshots and route/cargo/pressure commands prefer the three child `engine.n` DSK namespaces before falling back to legacy broad child facades.
- Updated route-progress and route-cargo README docs to document the preferred namespaces.
- Strengthened the generic promotion, route-progress, and route-cargo extraction smokes to poison the broad compatibility child facades for the covered seams and prove the namespaced APIs are sufficient.

## DSK boundary effect

The traversal/cargo lane now has a cleaner atomic-to-composite ladder:

1. `engine.n.genericRouteProgress` for ordered checkpoint/objective progress.
2. `engine.n.genericResourceLoop` for cargo/resource meters.
3. `engine.n.genericPressureLoop` for extraction pressure.
4. `engine.n.genericRouteCargoExtraction` only when a host needs a small composite session facade over all three.

This reduces pressure to consume a composite API when an Experiment only needs route progress, and it prevents the composite from depending on broad `engine.generic*` child facades internally.

## What did not change

- No Experiments code changed.
- No local experiment JavaScript reduction is claimed.
- No Core promotion is claimed.
- No destructive route pruning or route deletion happened.

## Validation status

- Updated tests: `tests/generic-promotion-gate-smoke.test.mjs`, `tests/generic-route-progress-kit-smoke.test.mjs`, and `tests/generic-route-cargo-extraction-kit-smoke.test.mjs`.
- I could not execute `npm test` from this runtime. The patch is guarded by static review and test updates only.

## Next safest main-branch patch plan

1. In Experiments, keep `next-ledge` as the first traversal/cargo consumer candidate.
2. Add or extend a route-level smoke/manifest note that maps `next-ledge` to `generic-route-progress-kit` and `generic-route-cargo-extraction-kit` without claiming executable replay yet.
3. Migrate only the ordered checkpoint/progress ledger in `next-ledge` to `engine.n.genericRouteProgress`; leave browser collision, route fiction, renderer camera, DOM/Canvas/WebGL, asset loading, and input bridges in the host.
4. Add fixed-tick replay evidence before claiming local JavaScript shrink or promoting route/cargo extraction beyond incubating status.
