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

New Atomic Domain Kit Expander focus: `generic-route-progress-kit` now exists as the smallest reusable route/checkpoint/objective-progress boundary. It has both atomic smoke coverage and fixed-tick replay coverage through `engine.n.genericRouteProgress`; it should now be used to test whether checkpoint-heavy canonical routes can shrink local route JavaScript without mixing in cargo, hazards, pressure, scan/survey, camera, renderer, or browser input responsibilities.

New Composite Domain Kit Builder focus: `generic-route-cargo-extraction-kit` now exists as the first lightweight composite above route progress, cargo/resource ledger, and pressure channels. It should be used to test traversal/cargo and delivery/extraction routes without creating route-local checkpoint/cargo/pressure state machines or a monolithic game engine.

New API Surface Pruner focus: the route/cargo/extraction family now has preferred atomic child namespaces: `engine.n.genericRouteProgress`, `engine.n.genericResourceLoop`, and `engine.n.genericPressureLoop`. The route-cargo composite now uses those child namespaces first, so Experiments can migrate one boundary at a time instead of depending on broad `engine.generic*` facades.

New Intent Miner focus: treat `vr-platformer-kit-suite` as an incubation suite for a possible `spatial-platformer-loop` higher-level domain, not as a Core-promotion-ready maximum-feature blob. Its child platformer/XR/spatial-board/comfort/render-descriptor boundaries need deterministic replay and downstream Experiments consumption proof before promotion-facing claims.

## Current pruning focus

Keep `generic-defense-kits` and `generic-defense-aaa-kits` compatible while shifting future imports and host calls toward `generic-defense-dsk-boundaries`, `generic-defense-aaa-dsk-bridge`, and the seven named atomic aliases: map, economy wallet, build placement, wave/agent director, combat resolver, session facade, and render descriptors.

New route-progress pruning rule: keep `generic-route-progress-kit` atomic. Do not fold cargo ledgers, hazard fields, pressure meters, scan targets, browser collision, DOM input, Canvas hit tests, or route fiction into the route-progress kit. Compose those through higher-level domains only after each boundary has resources/events/methods/snapshots/descriptors and headless coverage.

New route-cargo-extraction pruning rule: keep `generic-route-cargo-extraction-kit` as a composite coordinator only. It may install and snapshot route-progress/resource/pressure child DSKs, but it must not absorb browser collision, route fiction, renderer camera, DOM input, Canvas/WebGL, asset loading, inventory fiction, or hazard simulation.

New spatial-platformer pruning rule: keep the maximum-feature VR platformer suite from becoming a monolithic game kit. Child platformer, XR, spatial-board, comfort, and descriptor domains may incubate in ProtoKits, but hosts must retain Canvas/WebGL/Three drawing, WebXR/OpenXR session handles, raw runtime handles, frame presentation, assets, DOM input, and route fiction.

New host code should prefer `engine.n.genericDefense.map`, `engine.n.genericDefense.economyWallet`, `engine.n.genericDefense.buildPlacement`, `engine.n.genericDefense.waveAgentDirector`, `engine.n.genericDefense.combatResolver`, `engine.n.genericDefense.sessionFacade`, and `engine.n.genericDefense.renderDescriptors` after DSK install. The older `engine.defense*` and `engine.genericDefense` surfaces remain compatibility aliases.

New traversal/cargo host code should prefer `engine.n.genericRouteProgress`, `engine.n.genericResourceLoop`, `engine.n.genericPressureLoop`, and then `engine.n.genericRouteCargoExtraction` only when it needs a composed delivery/extraction session facade. The older `engine.genericRouteProgress`, `engine.genericResourceLoop`, `engine.genericPressureLoop`, and `engine.genericRouteCargoExtraction` surfaces remain compatibility aliases.

## Current validation focus

Run `generic-route-progress-kit-smoke.test.mjs` after the generic promotion replay smoke and before the route-progress replay. It asserts the route-progress boundary exposes state resources, checkpoint enter/complete events, route advance/complete/reset/reject events, active/completed checkpoint snapshots, deterministic tick stamping, renderer-agnostic `route-checkpoint` descriptors, and namespace-only command/snapshot access through `engine.n.genericRouteProgress` after the broad facade is disabled.

Run `generic-route-progress-replay-smoke.test.mjs` immediately after the atomic route-progress smoke. It asserts deterministic delivery/checkpoint and rejection/reset replay fixtures through `engine.n.genericRouteProgress`, expected event counts, route/descriptor snapshots, fresh-run digest equality, and absence of wall-clock/RNG/browser/renderer tokens in the reusable route-progress source.

Run `generic-route-cargo-extraction-kit-smoke.test.mjs` immediately after the route-progress replay smoke. It asserts the composite DSK installs route-progress, resource-loop, and pressure-loop child surfaces; exposes `engine.n.genericRouteCargoExtraction`; drives cargo pickup/delivery, checkpoint completion, pressure adjustment, fixed tick snapshot refresh, completion, reset, and renderer-agnostic route/cargo/pressure descriptors through namespaced child boundaries after broad child facades are disabled.

Run `generic-defense-placement-projector-namespace-smoke.test.mjs` before `generic-defense-dsk-boundaries-smoke.test.mjs` and the existing generic-defense replay so the placement projector's namespace preference is checked before broader boundary/replay coverage.

The placement smoke installs the seven DSK aliases plus the reusable projector, syncs `engine.n.genericDefense`, disables the broad `engine.genericDefense` and `engine.defenseBuild` compatibility facades, then confirms placement through `namespace.sessionFacade.build` and asserts the resulting structure/wallet snapshot without DOM, Canvas, or browser frame timing.

Run `vr-platformer-kit-suite-smoke.test.mjs` near the end of the default suite as incubation coverage only. It checks platformer level/avatar/physics/spatial-board/stereoscopic descriptor composition and the sixteen-kit maximum-feature suite, but it is not deterministic replay and should not be used as a Core-promotion signal by itself.

## Current promotion candidates

See `promotion-candidates.md` / `candidate-promotions.md`.

## Current route/canonicalization concerns

See `route-canonicalization.md`.

## Current smoke/replay gaps

See `smoke-tests.md` and `replay-qa.md`.

## Last meaningful cycle report

Latest Intent Miner update: `.agent/cycle-reports/2026-06-24-intent-miner-1200.md` records the new `vr-platformer-kit-suite` as a spatial-platformer-loop incubation finding. This is ProtoKits map/memory alignment only; no Experiments JavaScript shrink is claimed, no Core promotion is claimed, and Core `.agent/intent.md` is still blocked by integration permissions.

Latest Deterministic Replay QA update: `tests/fixtures/generic-route-progress-replay-fixtures.mjs`, `tests/generic-route-progress-replay-smoke.test.mjs`, `package.json`, and `.agent/cycle-reports/2026-06-24-deterministic-replay-qa-route-progress-replay.md` now close the atomic fixed-tick replay gap for `generic-route-progress-kit`. This is reusable ProtoKit QA only; no Experiments route JavaScript shrink is claimed until a checkpoint-heavy canonical route consumes the boundary.

Latest API Surface Pruner update: `generic-route-progress-kit`, `generic-resource-loop-kit`, and `generic-pressure-loop-kit` now mirror their facades under `engine.n.genericRouteProgress`, `engine.n.genericResourceLoop`, and `engine.n.genericPressureLoop`; `generic-route-cargo-extraction-kit` now prefers those namespaced child boundaries for snapshots and commands. Smoke coverage now disables broad route/resource/pressure facades for the covered seams. This is reusable ProtoKit API pruning only; no Experiments route JavaScript shrink is claimed yet.

Latest Composite Domain Kit Builder update: `protokits/generic-route-cargo-extraction-kit/index.js`, `README.md`, `kit.manifest.json`, `tests/generic-route-cargo-extraction-kit-smoke.test.mjs`, `package.json`, and `.agent/cycle-reports/2026-06-24-composite-domain-kit-builder-0100.md` now add a lightweight composite DSK for route/cargo/extraction over `generic-route-progress-kit`, `generic-resource-loop-kit`, and `generic-pressure-loop-kit`. This is reusable ProtoKit implementation only; no Experiments route has consumed it yet, so local JavaScript shrink remains the next patch rather than a completed claim.

Latest Atomic Domain Kit Expander update: `protokits/generic-route-progress-kit/index.js`, `README.md`, `kit.manifest.json`, `tests/generic-route-progress-kit-smoke.test.mjs`, `package.json`, and `.agent` notes now add an atomic rendererless route/checkpoint/objective-progress DSK surface. This is reusable ProtoKit implementation only; no Experiments route has consumed it yet, so local JavaScript shrink is a clear next patch rather than a completed claim.

Latest Cycle Report Push Planner update: `protokits/generic-defense-presentation-stack-kit/index.js`, `tests/generic-defense-placement-projector-namespace-smoke.test.mjs`, and `package.json` now close and guard the placement-projector namespace seam recorded by the prior Twenty Game Refiner/Deterministic Replay QA notes.

Latest Twenty Game Refiner update: `.agent/cycle-reports/2026-06-24-twenty-game-refiner-0328.md` records the cross-repo confirmation that no second canonical executable lane should be claimed yet; the safest next patch was the ProtoKits placement-projector namespace implementation plus smoke/package wiring, now completed.

Previous Deterministic Replay QA update: `.agent/replay-qa.md` recorded the exact placement-projector namespace patch plan and why the implementation/test push should be scoped to ProtoKits.

Previous API Surface Pruner report: `.agent/cycle-reports/2026-06-23-api-surface-pruner-2030.md`.
