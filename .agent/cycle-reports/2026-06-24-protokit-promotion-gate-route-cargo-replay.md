# ProtoKit Promotion Gate — route-cargo replay closure

## Decision memory reviewed

Reviewed `.agent/intent.md`, `.agent/cycle-state.md`, `.agent/smoke-tests.md`, `.agent/replay-qa.md`, and `.agent/candidate-promotions.md` before patching. The durable direction remains: grow reusable DSK-based ProtoKits while shrinking route-local experiment JavaScript, and treat DSKs as communication boundaries through resources, events, methods, snapshots, and descriptors.

## What changed

Added deterministic fixed-tick replay coverage for `generic-route-cargo-extraction-kit`:

- `tests/fixtures/generic-route-cargo-extraction-replay-fixtures.mjs`
- `tests/generic-route-cargo-extraction-replay-smoke.test.mjs`
- `package.json` default `npm test` wiring immediately after the existing route-cargo smoke
- `tests/promotion-determinism-guard-smoke.test.mjs` now scans `generic-route-progress-kit` and `generic-route-cargo-extraction-kit`
- `.agent/replay-qa.md` and `.agent/smoke-tests.md` now record the closure

## Promotion implication

`generic-route-cargo-extraction-kit` is stronger as an incubating delivery/extraction ProtoKit because it now has deterministic replay proof, not just a one-shot smoke. The replay drives `engine.n.genericRouteCargoExtraction` after broad route-cargo, route-progress, resource-loop, and pressure-loop facades are poisoned. It validates route, cargo, pressure, composite events, descriptors, fixed ticks, and fresh-run digest equality.

## Boundary status

Clearer. The composite remains a coordinator over:

- `generic-route-progress-kit`
- `generic-resource-loop-kit`
- `generic-pressure-loop-kit`

It should not absorb renderer camera, DOM input, Canvas/WebGL hit testing, asset loading, cargo fiction, hazard simulation, or route-specific traversal physics.

## Experiment implication

No Experiments JavaScript shrink is claimed in this cycle. The next downstream proof should be `next-ledge` or another canonical delivery/extraction route consuming the composite only if it can remove route-local cargo/resource/pressure state. Until then, route-progress has partial downstream consumption and route-cargo remains ProtoKits-local replay proof.

## Safe next patch

Keep `generic-route-cargo-extraction-kit` incubating. The next safe main-branch patch is an Experiments route-level bridge/replay only after a canonical route can consume the composite without inventing filler cargo behavior. If that is not true, keep hardening the atomic children and avoid claiming a second executable route-domain lane.
