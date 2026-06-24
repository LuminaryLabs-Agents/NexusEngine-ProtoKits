# Deterministic Replay QA — placement projector namespace seam

Date: 2026-06-24

## Reviewed memory

- ProtoKits `.agent/intent.md`, `.agent/architecture.md`, `.agent/dsk-boundaries.md`, `.agent/cycle-state.md`, `.agent/smoke-tests.md`, and `.agent/replay-qa.md`.
- Experiments `.agent/intent.md`, `.agent/architecture.md`, `.agent/dsk-boundaries.md`, `.agent/cycle-state.md`, `.agent/smoke-tests.md`, and `.agent/replay-qa.md`.
- Core repository was accessible, but Core `.agent/intent.md` and `.agent/architecture.md` were not present through the connector, so Core `.agent` memory remains unverified.

## Finding

The strongest executable replay lane remains Signal Bastion / `strategic-pressure-loop`, backed by the generic-defense DSK aliases and downstream executable route replay. The next drift point is not route-local simulation; it is a reusable presentation bridge seam in ProtoKits:

- Experiments records placement confirmation as `placementProjector.confirm -> engine.n.genericDefense.sessionFacade.build`.
- `protokits/generic-defense-presentation-stack-kit/index.js` still has `createGenericPlacementProjectorKit().confirm()` call `engine.defenseBuild?.build(...)` before `engine.genericDefense?.build(...)`.
- The shared `getSnapshot(engine)` helper in that presentation stack still reads `engine.genericDefense?.getSnapshot?.()` directly.

## Replay QA implication

A deterministic replay or browser-host shrink can only prove the intended DSK communication boundary if placement confirmation survives when the synced `engine.n.genericDefense.sessionFacade` namespace remains available but legacy route/global facades are poisoned or reassigned. Otherwise the route can appear DSK-shaped while reusable presentation logic still depends on broad compatibility facades.

## Exact next main-branch patch plan

1. In `protokits/generic-defense-presentation-stack-kit/index.js`, add a small session-facade resolver that prefers `engine.n?.genericDefense?.sessionFacade` and falls back to `engine.genericDefense`.
2. Change `getSnapshot(engine)` to use that resolver.
3. Change `createGenericPlacementProjectorKit().confirm()` to prefer `sessionFacade.build(...)`, then fall back to `engine.defenseBuild?.build(...)`, then legacy `engine.genericDefense?.build(...)`.
4. Add `tests/generic-defense-placement-projector-namespace-smoke.test.mjs`:
   - install the seven generic-defense DSK aliases plus `createGenericPlacementProjectorKit()` with the existing smoke harness;
   - capture `const namespace = engine.n.genericDefense` after DSK install/sync;
   - poison or reassign `engine.genericDefense` and `engine.defenseBuild` after namespace capture;
   - begin placement, move to a valid slot, confirm with a fixed `commandId`, then assert `namespace.sessionFacade.getSnapshot().structures.structures` contains one tower;
   - assert no DOM, Canvas, WebGL, browser audio, asset loading, pointer lock, or animation-frame state is required.
5. Add the smoke to the default `npm test` command before `generic-defense-replay-smoke.test.mjs`.
6. Update `.agent/smoke-tests.md` and `.agent/replay-qa.md` to mark the seam covered only after the smoke is wired.

## Why no implementation push in this cycle

The required implementation touches a large source file. Without local test execution and with only connector replacement writes available for that file, pushing the implementation would be riskier than preserving the exact patch plan in `.agent` memory for the next scoped main-branch update.
