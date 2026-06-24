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

- `tests/generic-promotion-gate-smoke.test.mjs` covers `generic-pressure-loop-kit`, `generic-resource-loop-kit`, `generic-action-window-kit`, and `generic-affordance-descriptor-kit` as renderer-agnostic DSK promotion candidates. It asserts resources, events, systems, metadata boundaries, headless ticks/methods, and observable events for each surface.
- `tests/generic-promotion-replay-smoke.test.mjs` plus `tests/fixtures/generic-promotion-replay-fixtures.mjs` adds deterministic fixed-tick replay coverage for the same four generic DSKs. The replay fixtures assert resource snapshots, event counts, method calls, descriptor availability, and fixed frame/tick results without DOM, Canvas, WebGL, browser input, or renderer ownership.
- `tests/promotion-determinism-guard-smoke.test.mjs` now keeps the promotion-facing generic DSK candidates and `generic-defense-dsk-boundaries`/`generic-defense-aaa-dsk-bridge` free of wall-clock, RNG, DOM, Canvas, WebGL, browser audio, pointer, and animation-frame ownership. It also makes the remaining `generic-defense-aaa-kits` wall-clock/browser-timing compatibility exceptions explicit so they cannot be mistaken for Core-promotion-ready surfaces.

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
- The smoke imports real Core plus the package export `@luminarylabs/nexusrealtime-protokits/generic-defense-dsk-boundaries`, composes the Signal Bastion debug preset through the seven named DSK aliases, advances fixed ticks, and compares deterministic resource/snapshot/descriptor digests across fresh runs.
- This gives `generic-defense-dsk-boundaries` route-level consumption proof without moving reusable implementation into Experiments.

## 2026-06-23 — engine.n generic-defense namespace smoke update

- `tests/generic-defense-dsk-boundaries-smoke.test.mjs` now asserts every boundary descriptor includes at least one `engine.n.genericDefense.<boundary>` method alias.
- Individual DSK aliases now carry `metadata.engineNamespace`, and the smoke checks the expected namespace for all seven atomic boundaries.
- The headless install path now verifies `engine.n.genericDefense.map`, `.economyWallet`, `.buildPlacement`, `.waveAgentDirector`, `.combatResolver`, `.sessionFacade`, and `.renderDescriptors` are populated from the installed DSKs, while `resources` and `events` remain discoverable from the session facade.
- The smoke drives the replay through `engine.n.genericDefense.sessionFacade` and reads descriptors from `engine.n.genericDefense.renderDescriptors`, proving the pruned namespace can replace broad call sites without DOM/Canvas ownership.

## 2026-06-23 — Promotion determinism guard update

- `tests/promotion-determinism-guard-smoke.test.mjs` is now part of the default `npm test` script.
- The guard makes promotion review stricter: promotion candidates must not rely on wall-clock time, RNG, browser timing, DOM, Canvas, WebGL, browser audio, pointer, or animation-frame APIs.
- The guard records `generic-defense-aaa-kits` as a known compatibility exception rather than a promotion-ready boundary because its broad facades still use wall-clock/browser timing in ledger/presentation convenience paths.

## Open gaps

- Replace `generic-defense-aaa-kits` wall-clock ledger/presentation stamps with tick/command-derived deterministic stamps or keep the AAA facade outside promotion-facing surfaces.
- After the boundary-alias smoke stays green, replace or supplement compatibility facade calls in Experiments with the smallest relevant generic-defense DSK aliases and namespaced `engine.n.genericDefense.<boundary>` calls.
- Route-level replay manifests now exist in Experiments, and `signal-bastion` has the first executable route-domain replay. Add equivalent executable replays for other lanes only after a real reusable ProtoKit boundary exists.
- Add a Core-backed integration smoke inside ProtoKits once the repo/package wiring exposes a stable local Core import path in this workspace.
