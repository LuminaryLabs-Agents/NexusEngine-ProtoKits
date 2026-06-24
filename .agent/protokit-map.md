# ProtoKit Map

This file tracks current and target reusable kits.

## Standing constraints

- Reusable kit implementation changes should be pushed only to ProtoKits.
- ProtoKits should define domain communication boundaries through resources, events, methods, snapshots, and descriptors.
- Experiments should consume ProtoKits instead of owning reusable gameplay logic.
- When multiple kits combine, look for a higher-level domain above them.

## Current map

Scheduled tasks should keep this file current by recording:

- Existing atomic kits.
- Existing composite kits.
- Candidate higher-level domains.
- Experiment consumers.
- Headless test coverage.
- Promotion readiness.

## Target direction

Move toward composable DSK-style kits that let hosts stay close to import/configure/tick/render.

## 2026-06-23 — API Surface Pruner map update

### Generic promotion candidates with clear atomic surfaces

- `generic-pressure-loop-kit` — pressure channels through resources/events/methods/snapshots.
- `generic-resource-loop-kit` — reusable meter/resource loop through resources/events/methods/snapshots.
- `generic-action-window-kit` — timing/action acceptance windows through resources/events/methods/snapshots.
- `generic-affordance-descriptor-kit` — interaction availability and renderer-agnostic descriptors.

### Generic defense composite and pruned aliases

- Compatibility composite: `generic-defense-kits` remains the safe all-in-one Signal Bastion validation bundle.
- Pruned DSK alias surface: `generic-defense-dsk-boundaries` exports descriptors and factory aliases for `map`, `economyWallet`, `buildPlacement`, `waveAgentDirector`, `combatResolver`, `sessionFacade`, and `renderDescriptors`.
- Package aliases now point to the pruned surface: `generic-defense-map-dsk`, `generic-defense-economy-wallet-dsk`, `generic-defense-build-placement-dsk`, `generic-defense-wave-agent-director-dsk`, `generic-defense-combat-resolver-dsk`, `generic-defense-session-facade-dsk`, and `generic-defense-render-descriptor-dsk`.
- Test coverage: `tests/generic-defense-dsk-boundaries-smoke.test.mjs` asserts the alias descriptors expose resources, events, methods, snapshots, descriptors, export names, backing kit IDs, DSK metadata, and rendererless headless behavior before the existing defense replay runs.

### Higher-level domain pressure

The defense split is pointing toward a higher-level `strategic-pressure-loop` domain above defense map/slots, economy, build placement, waves/agents, combat, render descriptors, generic resources, and hazard pressure.

## 2026-06-23 — AAA DSK bridge pruning map update

- Compatibility bridge: `generic-defense-aaa-dsk-bridge` now re-exports the broad `generic-defense-aaa-kits` facade and the pruned `generic-defense-dsk-boundaries` aliases from one module.
- Purpose: let Signal Bastion-style hosts keep current AAA facade methods while migrating one seam at a time to smaller map/economy/build/wave/combat/session/render DSK aliases.
- Package export: `@luminarylabs/nexusrealtime-protokits/generic-defense-aaa-dsk-bridge`.
- Docs: `docs/generic-defense-api-surface-pruner.md` records the migration rule: prefer the smallest boundary before writing route-local state machines.
- Test coverage: `tests/generic-defense-dsk-boundaries-smoke.test.mjs` now verifies the bridge keeps compatibility exports and can return a smallest requested DSK subset without forcing the broad compatibility bundle.

## 2026-06-23 — engine.n generic-defense namespace pruning map update

- `generic-defense-dsk-boundaries` now exports `GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE` and `syncGenericDefenseDskEngineNamespace(engine)`.
- Each installed atomic DSK alias mirrors its compatibility method surface under `engine.n.genericDefense.<boundary>` while preserving older `engine.defenseMap`, `engine.defenseEconomy`, `engine.defenseStructures`, `engine.defenseAgents`, `engine.defenseCombat`, `engine.genericDefense`, and `engine.defenseRender` surfaces.
- The AAA bridge re-exports the namespace helper so browser hosts that already import `generic-defense-aaa-dsk-bridge` do not need a second module to move calls toward the smaller DSK namespace.
- Test coverage: `tests/generic-defense-dsk-boundaries-smoke.test.mjs` now asserts the namespaced methods, metadata, resources, events, semantic commands, snapshots, descriptors, and DOM/Canvas exclusion.
- Promotion implication: the atomic boundaries are clearer, but the broad AAA facade is still not a Core-promotion candidate. Promotion review should look at the seven `engine.n.genericDefense.<boundary>` seams after route consumption proves them.

## 2026-06-24 — Atomic route-progress map update

- New atomic kit: `generic-route-progress-kit`.
- Boundary: ordered route/checkpoint/objective progress through `genericRouteProgress.state`, checkpoint entered/completed, route advanced/completed/reset/rejected events, host methods on `engine.genericRouteProgress`, snapshots for active/completed checkpoints, and renderer-agnostic `route-checkpoint` descriptors.
- Package exposure: available through the package wildcard as `@luminarylabs/nexusrealtime-protokits/generic-route-progress-kit`.
- Docs/manifest: `protokits/generic-route-progress-kit/README.md` and `kit.manifest.json` define the renderer/browser exclusion boundary.
- Test coverage: `tests/generic-route-progress-kit-smoke.test.mjs` is now wired into `npm test` after the generic promotion replay smoke and before promotion determinism/defense smokes.
- Experiment consumers to consider next: Harbor Salvage, Cargo Chain, Sky Courier, Trainyard Switcher, Dungeon Relay, Floodplain Rescue, and survey/extraction routes that currently own ordered checkpoint state locally.
- Higher-level domains unlocked: delivery/extraction loop (`route-progress + cargo + hazards`) and survey pressure loop (`route-progress + scan/survey + zones + pressure`).
- Promotion readiness: incubating only. It has atomic headless smoke coverage, but needs at least one Experiments route consumption proof before Core-promotion review.

## 2026-06-24 — API Surface Pruner route namespace map update

- `generic-route-progress-kit` now exposes its preferred command/snapshot facade under `engine.n.genericRouteProgress` while preserving `engine.genericRouteProgress` compatibility.
- `generic-resource-loop-kit` now exposes its preferred meter facade under `engine.n.genericResourceLoop` while preserving `engine.genericResourceLoop` compatibility.
- `generic-pressure-loop-kit` now exposes its preferred channel facade under `engine.n.genericPressureLoop` while preserving `engine.genericPressureLoop` compatibility.
- `generic-route-cargo-extraction-kit` now builds snapshots and runs route/cargo/pressure commands through those three namespaced child DSKs first, preserving compatibility fallbacks for older hosts.
- Test coverage: `tests/generic-promotion-gate-smoke.test.mjs`, `tests/generic-route-progress-kit-smoke.test.mjs`, and `tests/generic-route-cargo-extraction-kit-smoke.test.mjs` now poison the broad compatibility surfaces for the covered seams and prove the namespaced DSK surfaces are sufficient.
- Promotion implication: the delivery/extraction loop has a clearer atomic-to-composite API ladder, but no Core-promotion claim should be made until `next-ledge` or another canonical route consumes the namespace and adds route-level fixed-tick replay evidence.
