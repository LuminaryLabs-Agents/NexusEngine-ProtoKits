# Headless Tick Smoke Tests

Track headless validation coverage for kits, composite kits, domain boundaries, and canonical experiments.

## Standing rules

- Every meaningful domain boundary should become headless-tickable where possible.
- Tests should prove resources, events, methods, snapshots, and descriptors rather than browser rendering.
- Experiments should have headless scenarios that validate the reusable domains they pressure-test.
- Smoke coverage should guide cumulative expansion into higher-level domains.

## Test template

- Domain or route:
- Setup:
- Input events:
- Tick count:
- Assertions:
- Determinism notes:
- Status:

## Current coverage notes

- `tests/generic-promotion-gate-smoke.test.mjs` covers `generic-pressure-loop-kit`, `generic-resource-loop-kit`, `generic-action-window-kit`, and `generic-affordance-descriptor-kit` as renderer-agnostic DSK promotion candidates. It asserts resources, events, systems, metadata boundaries, headless ticks/methods, and observable events for each surface; it now also proves the pressure/resource loops can run through `engine.n.genericPressureLoop` and `engine.n.genericResourceLoop` after broad compatibility facades are poisoned.
- `tests/generic-promotion-replay-smoke.test.mjs` plus `tests/fixtures/generic-promotion-replay-fixtures.mjs` adds deterministic fixed-tick replay coverage for the same four generic DSKs. The replay fixtures assert resource snapshots, event counts, method calls, descriptor availability, and fixed frame/tick results without DOM, Canvas, WebGL, browser input, or renderer ownership.
- `tests/generic-route-progress-kit-smoke.test.mjs` covers `generic-route-progress-kit` as an atomic route/checkpoint/objective-progress boundary. It asserts state resources, checkpoint entered/completed events, route advanced/completed/reset/rejected events, ordered active checkpoint snapshots, out-of-order rejection, deterministic tick stamping, renderer-agnostic `route-checkpoint` descriptors, and the preferred `engine.n.genericRouteProgress` namespace after the legacy `engine.genericRouteProgress` facade is poisoned.
- `tests/generic-route-progress-replay-smoke.test.mjs` plus `tests/fixtures/generic-route-progress-replay-fixtures.mjs` adds deterministic fixed-tick replay coverage for `generic-route-progress-kit`. It runs delivery/checkpoint and rejection/reset fixtures twice, drives only `engine.n.genericRouteProgress` methods after poisoning the broad facade, asserts event counts and route/descriptor snapshots, and guards against wall-clock, RNG, DOM, Canvas, WebGL, browser audio, pointer-lock, and animation-frame leakage in the route-progress source.
- `tests/generic-route-cargo-extraction-kit-smoke.test.mjs` covers `generic-route-cargo-extraction-kit` as a composite delivery/extraction boundary over route progress, resource/cargo ledger, and pressure loop DSKs. It proves namespaced child DSK consumption through `engine.n.genericRouteProgress`, `engine.n.genericResourceLoop`, and `engine.n.genericPressureLoop` after broad child facades are poisoned.
- `tests/generic-route-cargo-extraction-replay-smoke.test.mjs` plus `tests/fixtures/generic-route-cargo-extraction-replay-fixtures.mjs` adds deterministic fixed-tick replay coverage for the delivery/extraction composite. It runs delivery/extraction and rejection/reset fixtures twice, drives only `engine.n.genericRouteCargoExtraction` after poisoning broad route/cargo/resource/pressure facades, asserts route/cargo/pressure snapshots, composite event counts, descriptors, fixed ticks, and fresh-run digest equality.
- `tests/promotion-determinism-guard-smoke.test.mjs` now keeps the promotion-facing generic DSK candidates, route-progress/route-cargo candidates, `generic-defense-dsk-boundaries`/`generic-defense-aaa-dsk-bridge`, and the new `generic-defense-session-command-kit` free of wall-clock, RNG, DOM, Canvas, WebGL, browser audio, pointer, and animation-frame ownership. It also makes the remaining `generic-defense-aaa-kits` wall-clock/browser-timing compatibility exceptions explicit so they cannot be mistaken for Core-promotion-ready surfaces.
- `tests/generic-defense-placement-projector-namespace-smoke.test.mjs` now guards the reusable placement projector's transition from broad compatibility facades to `engine.n.genericDefense.sessionFacade` for snapshot/build semantics. It poisons `engine.genericDefense` and `engine.defenseBuild` after namespace sync and confirms a valid placement through the namespaced DSK session facade without DOM, Canvas, or browser frame timing.
- `tests/generic-defense-session-command-kit-smoke.test.mjs` covers `generic-defense-session-command-kit` as a rendererless command boundary for blueprint selection and structure sell/refund. It installs the seven generic-defense DSK aliases plus the command kit, proves `engine.n.genericDefense.sessionFacade.setBlueprint/sell` and `engine.n.genericDefense.sessionCommands.setBlueprint/sell`, verifies economy refund settlement through the wallet event/resource boundary, and excludes wall-clock, RNG, DOM, Canvas, WebGL, browser audio, and animation-frame APIs.
- `tests/vr-platformer-kit-suite-smoke.test.mjs` covers `vr-platformer-kit-suite` as incubation smoke only. It checks the platformer level/avatar/physics/spatial-board kit ids, basic deterministic `simulatePlatformerStep()` movement/jump behavior, stereoscopic descriptor sibling composition, and the sixteen-kit maximum-feature composition. It is not yet deterministic replay and should not be treated as Core-promotion evidence.

## 2026-06-23 — Headless Tick Smoke Builder findings

- The first durable replay gap for generic promotion candidates is now covered in the default ProtoKits `npm test` script.
- The generic pressure/resource/action-window/affordance surfaces are clearer as DSK boundaries because the new replay fixtures prove state, method, event, snapshot, and descriptor behavior through fixed ticks rather than through a route renderer.
- The safest next smoke patch is still the `generic-defense-kits` compatibility smoke before splitting the composite into path/slot/vital, economy, build-placement, structure runtime, wave/agent, projectile/combat, and render-descriptor wrappers.
- Real Core import coverage remains an integration gap. Current ProtoKit smoke tests use the repo-local Core-compatible smoke harness so they can run without browser or package-level Core dependency coupling.

## 2026-06-23 — API Surface Pruner smoke update

- `tests/generic-defense-dsk-boundaries-smoke.test.mjs` now covers the pruned generic-defense DSK alias surface before the compatibility replay. It asserts the seven named boundaries expose explicit resources, events, methods, snapshots, descriptors, export names, backing kit IDs, DSK metadata, and rendererless headless behavior.
- The default `npm test` script now runs `generic-defense-dsk-boundaries-smoke.test.mjs` before `generic-defense-replay-smoke.test.mjs`, so the API surface is checked before the broader compatibility composite replay.
- This closes the API-boundary visibility gap for `generic-defense-kits` without deleting the compatibility bundle or forcing Experiments to change routes immediately.

## 2026-06-23 — AAA DSK bridge smoke update

- `tests/generic-defense-dsk-boundaries-smoke.test.mjs` now also covers `generic-defense-aaa-dsk-bridge`.
- The bridge smoke checks that the broad AAA compatibility facade is still available, that atomic DSK aliases are exposed beside it, and that a smallest requested DSK subset can be returned without forcing the broad compatibility bundle.
- This creates a safer next step for Signal Bastion-style routes: they can migrate imports toward the bridge before route code swaps broad facade calls for smaller DSK aliases.

## 2026-06-23 — Downstream executable route smoke update

- Experiments now includes `tests/signal-bastion-executable-route-replay-smoke.mjs` in its full check suite.
- The smoke imports real Core plus the package export `@luminarylabs/nexusengine-protokits` generic-defense DSK aliases, composes the Signal Bastion debug preset through the seven named DSK aliases, advances fixed ticks, and compares deterministic resource/snapshot/descriptor digests across fresh runs.
- This gives `generic-defense-dsk-boundaries` route-level consumption proof without moving reusable implementation into Experiments.

## 2026-06-23 — engine.n generic-defense namespace smoke update

- `tests/generic-defense-dsk-boundaries-smoke.test.mjs` now asserts every boundary descriptor includes at least one `engine.n.genericDefense.<boundary>` method alias.
- Individual DSK aliases now carry `metadata.engineNamespace`, and the smoke checks the expected namespace for all seven atomic boundaries.
- The headless install path now verifies `engine.n.genericDefense.map`, `.economyWallet`, `.buildPlacement`, `.waveAgentDirector`, `.combatResolver`, `.sessionFacade`, and `.renderDescriptors` are populated from the installed DSKs, while `resources` and `events` remain discoverable from the session facade.
- The smoke drives the replay through `engine.n.genericDefense.sessionFacade` and reads descriptors from `engine.n.genericDefense.renderDescriptors`, proving the pruned namespace can replace broad call sites without DOM/Canvas ownership.

## 2026-06-23 — Promotion determinism guard update

- `tests/promotion-determinism-guard-smoke.test.mjs` is now part of the default `npm test` script.
- The guard makes promotion review stricter: promotion candidates must not rely on wall-clock time, RNG, browser timing, DOM, Canvas, WebGL, browser audio, pointer, or animation-frame APIs.
- The guard records `generic-defense-aaa-kits` as a known compatibility exception rather than a promotion-ready boundary because its broad facades still use wall-clock/browser-timing in ledger/presentation convenience paths.

## 2026-06-24 — Headless Tick Smoke Builder bridge drift finding

- Experiments now specifies Signal Bastion placement input as `placementProjector.confirm` bridged to `engine.n.genericDefense.sessionFacade.build`, but the reusable `generic-defense-presentation-stack-kit` still resolved placement confirmation through `engine.defenseBuild?.build` and then legacy `engine.genericDefense?.build` internally.
- This was not a route-local simulation leak, but it was namespace drift: the route was ready to shrink toward namespaced DSK calls faster than the reusable presentation projector did.
- The ProtoKits patch is now implemented: `createGenericPlacementProjectorKit()` prefers `engine.n?.genericDefense?.sessionFacade?.getSnapshot()` and `.build(...)`, with compatibility fallbacks still present.
- `tests/generic-defense-placement-projector-namespace-smoke.test.mjs` guards this by installing the DSK aliases plus the projector, poisoning `engine.genericDefense` and `engine.defenseBuild`, and confirming a valid placement through `engine.n.genericDefense.sessionFacade` without DOM/Canvas/browser timing.

## 2026-06-24 — Atomic Domain Kit Expander route-progress smoke update

- `generic-route-progress-kit` now has its first headless smoke in the default `npm test` script.
- The smoke keeps the new route/checkpoint boundary rendererless and deterministic: no DOM, Canvas, WebGL, Three.js, browser audio, pointer lock, browser input, asset loading, wall-clock, or RNG is involved.
- This closes an atomic ProtoKit gap for route/checkpoint/objective-progress state, but it does not yet close local experiment JavaScript shrink because no Experiments host has consumed it yet.
- Safest next smoke patch: add an Experiments manifest/spec smoke for one checkpoint-heavy canonical route, then migrate only the ordered checkpoint ledger into `generic-route-progress-kit` while leaving renderer hit tests and route fiction in the host.

## 2026-06-24 — API Surface Pruner route namespace smoke update

- `tests/generic-route-progress-kit-smoke.test.mjs` now checks `GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE`, `syncGenericRouteProgressEngineNamespace(engine)`, `metadata.engineNamespace`, and all semantic route-progress calls through `engine.n.genericRouteProgress` after poisoning `engine.genericRouteProgress`.
- `tests/generic-promotion-gate-smoke.test.mjs` now checks `engine.n.genericPressureLoop` and `engine.n.genericResourceLoop` for the pressure/resource promotion candidates after poisoning the broad compatibility facades.
- `tests/generic-route-cargo-extraction-kit-smoke.test.mjs` now confirms the route-cargo composite can snapshot, complete checkpoints, pick up/deliver cargo, adjust pressure, tick, complete, and reset through namespaced child DSKs after `engine.genericRouteProgress`, `engine.genericResourceLoop`, and `engine.genericPressureLoop` are poisoned.
- This closes a namespace-drift gap before Experiments route-host migration: the composite delivery/extraction path no longer depends on broad child facades when the smaller `engine.n` boundaries are installed.

## 2026-06-24 — Deterministic Replay QA route-progress replay update

- `tests/generic-route-progress-replay-smoke.test.mjs` is now part of the default `npm test` script immediately after the route-progress atomic smoke.
- The replay pack adds fixture-level expected events/snapshots and fresh-run digest equality for checkpoint completion, route advance/completion, out-of-order rejection, reset, deterministic tick stamps, and route-checkpoint descriptors.
- The replay proves route progress through the namespaced DSK boundary (`engine.n.genericRouteProgress`) instead of the broad compatibility facade, while keeping browser/renderer state out of reusable kit logic.

## 2026-06-24 — Signal Bastion session command smoke update

- `generic-defense-session-command-kit` is now covered by `tests/generic-defense-session-command-kit-smoke.test.mjs` and wired into the default ProtoKits `npm test` script before the generic-defense boundary/replay checks.
- The smoke proves `setBlueprint` and `sell` as namespaced, rendererless session commands that communicate through generic-defense resources/events/methods/snapshots rather than through route-local JavaScript or broad AAA build/wave facades.
- The promotion determinism guard now scans the new kit so any wall-clock, RNG, DOM, Canvas, WebGL, browser audio, pointer, or animation-frame dependency blocks promotion-facing review.

## 2026-06-24 — Route-cargo extraction replay update

- `tests/generic-route-cargo-extraction-replay-smoke.test.mjs` is now part of the default `npm test` script immediately after the route-cargo composite smoke.
- The replay pack adds fixture-level expected events/snapshots and fresh-run digest equality for cargo pickup/delivery, checkpoint completion, pressure adjustment, composite completion, missing-cargo rejection, reset, deterministic tick stamps, and route/cargo/pressure descriptors.
- The replay proves the higher-level delivery/extraction boundary through `engine.n.genericRouteCargoExtraction` while broad `engine.genericRouteCargoExtraction`, `engine.genericRouteProgress`, `engine.genericResourceLoop`, and `engine.genericPressureLoop` are poisoned.
- The promotion determinism guard now scans both `generic-route-progress-kit` and `generic-route-cargo-extraction-kit` so route/cargo promotion-facing surfaces cannot drift into wall-clock or browser/renderer ownership.

## 2026-06-24 — Intent Miner spatial-platformer smoke update

- `tests/vr-platformer-kit-suite-smoke.test.mjs` is wired into the default ProtoKits `npm test` script.
- The smoke checks deterministic `simulatePlatformerStep()` behavior, key platformer and spatial-board kit ids, `stereoscopic-render-domain-kit` descriptor sibling composition, and sixteen-kit maximum-feature composition.
- This is useful incubation coverage, but it is not fixed-tick replay. Add replay fixtures and determinism guard scanning before treating `vr-platformer-kit-suite` or any child platformer/XR boundary as promotion-facing.

## Open gaps

- Replace `generic-defense-aaa-kits` wall-clock ledger/presentation stamps with tick/command-derived deterministic stamps or keep the AAA facade outside promotion-facing surfaces.
- After the placement/projector namespace smoke, session-command smoke, and boundary-alias smoke stay green, keep Signal Bastion browser-host calls on the smallest generic-defense DSK aliases and avoid reintroducing broad build/wave compatibility facades.
- Route-level replay manifests now exist in Experiments, and `signal-bastion` has the first executable route-domain replay. Add equivalent executable replays for other lanes only after a real reusable ProtoKit boundary exists.
- Add a Core-backed integration smoke inside ProtoKits once the repo/package wiring exposes a stable local Core import path in this workspace.
- Add downstream route consumption proof for `generic-route-progress-kit` and `generic-route-cargo-extraction-kit`; until then they have stronger ProtoKit-local replay coverage but only partial or no proven local-JS reduction in Experiments.
- Add deterministic replay and promotion-determinism guard coverage for `vr-platformer-kit-suite` or its child platformer/XR domains before any promotion-facing claim.
