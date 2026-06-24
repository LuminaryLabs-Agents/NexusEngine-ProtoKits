# Cumulative Cycle State

## Current long-form goal

Grow reusable DSK-based ProtoKits while shrinking local experiment JavaScript.

## Standing cycle constraints

- Review `.agent/` before every decision.
- Only push reusable kit implementation into ProtoKits.
- Harden Experiments toward about 20 canonical routes without treating the number as brittle.
- Merge features and kits into cumulative higher-level domains where possible.
- Keep DSKs as domain communication layers.

## Current expansion focus

Use the generic-defense DSK boundary aliases, AAA DSK bridge, and `engine.n.genericDefense.<boundary>` namespace as compatibility-safe paths from broad composite APIs toward smaller resources/events/methods/snapshots/descriptors surfaces.

The previous Twenty Game Refiner seam in `createGenericPlacementProjectorKit().confirm()` is now closed for the reusable projector path: `protokits/generic-defense-presentation-stack-kit/index.js` prefers `engine.n.genericDefense.sessionFacade.getSnapshot()` for reusable presentation snapshots and `engine.n.genericDefense.sessionFacade.build(...)` for placement confirmation before falling back to compatibility facades.

## Current pruning focus

Keep `generic-defense-kits` and `generic-defense-aaa-kits` compatible while shifting future imports and host calls toward `generic-defense-dsk-boundaries`, `generic-defense-aaa-dsk-bridge`, and the seven named atomic aliases: map, economy wallet, build placement, wave/agent director, combat resolver, session facade, and render descriptors.

New host code should prefer `engine.n.genericDefense.map`, `engine.n.genericDefense.economyWallet`, `engine.n.genericDefense.buildPlacement`, `engine.n.genericDefense.waveAgentDirector`, `engine.n.genericDefense.combatResolver`, `engine.n.genericDefense.sessionFacade`, and `engine.n.genericDefense.renderDescriptors` after DSK install. The older `engine.defense*` and `engine.genericDefense` surfaces remain compatibility aliases.

## Current validation focus

Run `generic-defense-placement-projector-namespace-smoke.test.mjs` before `generic-defense-dsk-boundaries-smoke.test.mjs` and the existing generic-defense replay so the placement projector's namespace preference is checked before broader boundary/replay coverage.

The placement smoke installs the seven DSK aliases plus the reusable projector, syncs `engine.n.genericDefense`, poisons the broad `engine.genericDefense` and `engine.defenseBuild` compatibility facades, then confirms placement through `namespace.sessionFacade.build` and asserts the resulting structure/wallet snapshot without DOM, Canvas, or browser frame timing.

## Current promotion candidates

See `promotion-candidates.md` / `candidate-promotions.md`.

## Current route/canonicalization concerns

See `route-canonicalization.md`.

## Current smoke/replay gaps

See `smoke-tests.md` and `replay-qa.md`.

## Last meaningful cycle report

Latest Cycle Report Push Planner update: `protokits/generic-defense-presentation-stack-kit/index.js`, `tests/generic-defense-placement-projector-namespace-smoke.test.mjs`, and `package.json` now close and guard the placement-projector namespace seam recorded by the prior Twenty Game Refiner/Deterministic Replay QA notes.

Latest Twenty Game Refiner update: `.agent/cycle-reports/2026-06-24-twenty-game-refiner-0328.md` records the cross-repo confirmation that no second canonical executable lane should be claimed yet; the safest next patch was the ProtoKits placement-projector namespace implementation plus smoke/package wiring, now completed.

Previous Deterministic Replay QA update: `.agent/replay-qa.md` recorded the exact placement-projector namespace patch plan and why the implementation/test push should be scoped to ProtoKits.

Previous report: `.agent/cycle-reports/2026-06-23-api-surface-pruner-2030.md`.
