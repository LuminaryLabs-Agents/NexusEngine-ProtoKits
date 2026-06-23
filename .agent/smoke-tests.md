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

## 2026-06-23 — Headless Tick Smoke Builder findings

- The first durable replay gap for generic promotion candidates is now covered in the default ProtoKits `npm test` script.
- The generic pressure/resource/action-window/affordance surfaces are clearer as DSK boundaries because the new replay fixtures prove state, method, event, snapshot, and descriptor behavior through fixed ticks rather than through a route renderer.
- The safest next smoke patch is still the `generic-defense-kits` compatibility smoke before splitting the composite into path/slot/vital, economy, build-placement, structure runtime, wave/agent, projectile/combat, and render-descriptor wrappers.
- Real Core import coverage remains an integration gap. Current ProtoKit smoke tests use the repo-local Core-compatible smoke harness so they can run without browser or package-level Core dependency coupling.

## Open gaps

- Add Signal Bastion/generic-defense composite smoke that exercises start wave, build, upgrade, kill/reward, vital breach, and renderer descriptor output without Canvas.
- Add compatibility smoke before splitting `generic-defense-kits` into path/slot/vital, economy, build-placement, structure runtime, wave/agent, projectile/combat, and render-descriptor wrappers.
- Add a Core-backed integration smoke once the repo/package wiring exposes a stable local Core import path in this workspace.
