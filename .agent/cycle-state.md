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

The current Twenty Game Refiner seam remains `createGenericPlacementProjectorKit().confirm()` in `protokits/generic-defense-presentation-stack-kit/index.js`: Experiments treats placement confirmation as a semantic bridge into `engine.n.genericDefense.sessionFacade.build`, but the reusable projector still prefers `engine.defenseBuild?.build` before legacy `engine.genericDefense?.build`. The next safe implementation patch should move the shared snapshot helper and projector confirmation to prefer `engine.n.genericDefense.sessionFacade`, then add a headless namespace smoke before claiming the seam is shrunk.

## Current pruning focus

Keep `generic-defense-kits` and `generic-defense-aaa-kits` compatible while shifting future imports and host calls toward `generic-defense-dsk-boundaries`, `generic-defense-aaa-dsk-bridge`, and the seven named atomic aliases: map, economy wallet, build placement, wave/agent director, combat resolver, session facade, and render descriptors.

New host code should prefer `engine.n.genericDefense.map`, `engine.n.genericDefense.economyWallet`, `engine.n.genericDefense.buildPlacement`, `engine.n.genericDefense.waveAgentDirector`, `engine.n.genericDefense.combatResolver`, `engine.n.genericDefense.sessionFacade`, and `engine.n.genericDefense.renderDescriptors` after DSK install. The older `engine.defense*` and `engine.genericDefense` surfaces remain compatibility aliases.

## Current validation focus

Run `generic-defense-dsk-boundaries-smoke.test.mjs` before the existing generic-defense replay so API shape, AAA-bridge compatibility, and `engine.n.genericDefense.<boundary>` namespace mirroring are checked before compatibility behavior.

Next validation patch: add `tests/generic-defense-placement-projector-namespace-smoke.test.mjs` after updating the reusable projector implementation. The smoke should install the seven DSK aliases plus the placement projector, reassign/poison legacy `engine.genericDefense` and `engine.defenseBuild`, confirm a valid placement through the synced namespace, assert the built structure through `namespace.sessionFacade.getSnapshot()`, and keep DOM/Canvas/browser APIs absent.

## Current promotion candidates

See `promotion-candidates.md` / `candidate-promotions.md`.

## Current route/canonicalization concerns

See `route-canonicalization.md`.

## Current smoke/replay gaps

See `smoke-tests.md` and `replay-qa.md`.

## Last meaningful cycle report

Latest Twenty Game Refiner update: `.agent/cycle-reports/2026-06-24-twenty-game-refiner-0328.md` records the cross-repo confirmation that no second canonical executable lane should be claimed yet; the safest next patch is the ProtoKits placement-projector namespace implementation plus smoke/package wiring.

Previous Deterministic Replay QA update: `.agent/replay-qa.md` records the exact placement-projector namespace patch plan and why the implementation/test push should be scoped to ProtoKits.

Previous report: `.agent/cycle-reports/2026-06-23-api-surface-pruner-2030.md`.
