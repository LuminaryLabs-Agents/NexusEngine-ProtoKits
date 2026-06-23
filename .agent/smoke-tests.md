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

## Open gaps

- Add deterministic replay fixtures for the same four generic DSKs: fixed config, fixed command sequence, fixed ticks, expected resource snapshots, and expected event counts.
- Add Signal Bastion/generic-defense composite smoke that exercises start wave, build, upgrade, kill/reward, vital breach, and renderer descriptor output without Canvas.
- Add compatibility smoke before splitting `generic-defense-kits` into path/slot/vital, economy, build-placement, structure runtime, wave/agent, projectile/combat, and render-descriptor wrappers.
