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

## 2026-07-09 - Spatial placement adapter map update

- Host adapter: `webxr-hit-test-adapter-domain-kit` converts structural WebXR frames/results and plain NexusEngine poses into serializable observations.
- Candidate policy: `spatial-surface-candidate-domain-kit` remains the sole owner of orientation classification, stability, preference, and selection.
- Committed descriptor owner: `generic-anchor-descriptor-kit` now installs as a native DSK at `engine.n.anchorDescriptors` and retains `engine.anchorDescriptors` as an alias.
- Composition proof exists in the default suite; downstream host adoption and real-device proof remain open.

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
- Package export: `@luminarylabs/nexusengine-protokits/generic-defense-aaa-dsk-bridge`.
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
- Boundary: ordered route/checkpoint/objective progress through `genericRouteProgress.state`, checkpoint entered/completed, route advanced/completed/reset/rejected events, host methods on `engine.n.genericRouteProgress` plus compatibility `engine.genericRouteProgress`, snapshots for active/completed checkpoints, and renderer-agnostic `route-checkpoint` descriptors.
- Package exposure: available through the package wildcard as `@luminarylabs/nexusengine-protokits/generic-route-progress-kit`.
- Docs/manifest: `protokits/generic-route-progress-kit/README.md` and `kit.manifest.json` define the renderer/browser exclusion boundary.
- Test coverage: `tests/generic-route-progress-kit-smoke.test.mjs` and `tests/generic-route-progress-replay-smoke.test.mjs` are now wired into `npm test` after the generic promotion replay smoke and before the route-cargo composite smoke.
- Replay coverage: `tests/fixtures/generic-route-progress-replay-fixtures.mjs` covers fixed-tick checkpoint progression plus rejection/reset and validates fresh-run digest equality through `engine.n.genericRouteProgress`.
- Experiment consumers to consider next: Harbor Salvage, Cargo Chain, Sky Courier, Trainyard Switcher, Dungeon Relay, Floodplain Rescue, and survey/extraction routes that currently own ordered checkpoint state locally.
- Higher-level domains unlocked: delivery/extraction loop (`route-progress + cargo + hazards`) and survey pressure loop (`route-progress + scan/survey + zones + pressure`).
- Promotion readiness: incubating only. It has atomic headless smoke plus replay coverage, but needs at least one Experiments route consumption proof before Core-promotion review.

## 2026-06-24 — API Surface Pruner route namespace map update

- `generic-route-progress-kit` now exposes its preferred command/snapshot facade under `engine.n.genericRouteProgress` while preserving `engine.genericRouteProgress` compatibility.
- `generic-resource-loop-kit` now exposes its preferred meter facade under `engine.n.genericResourceLoop` while preserving `engine.genericResourceLoop` compatibility.
- `generic-pressure-loop-kit` now exposes its preferred channel facade under `engine.n.genericPressureLoop` while preserving `engine.genericPressureLoop` compatibility.
- `generic-route-cargo-extraction-kit` now builds snapshots and runs route/cargo/pressure commands through those three namespaced child DSKs first, preserving compatibility fallbacks for older hosts.
- Test coverage: `tests/generic-promotion-gate-smoke.test.mjs`, `tests/generic-route-progress-kit-smoke.test.mjs`, `tests/generic-route-progress-replay-smoke.test.mjs`, and `tests/generic-route-cargo-extraction-kit-smoke.test.mjs` now prove the namespaced DSK surfaces are sufficient for the covered seams.
- Promotion implication: the delivery/extraction loop has a clearer atomic-to-composite API ladder, but no Core-promotion claim should be made until `next-ledge` or another canonical route consumes the namespace and adds route-level fixed-tick replay evidence.

## 2026-06-24 — Intent Miner spatial-platformer map update

- New incubation suite: `vr-platformer-kit-suite`.
- Child boundaries named by the suite README: `platformer-level-domain-kit`, `platformer-avatar-domain-kit`, `platformer-physics-system-kit`, `platformer-collision-domain-kit`, `platformer-object-domain-kit`, `platformer-camera-domain-kit`, `platformer-render-descriptor-kit`, `platformer-effects-domain-kit`, `platformer-parallax-domain-kit`, `platformer-objective-sequence-kit`, `xr-pose-domain-kit`, `xr-input-adapter-kit`, `spatial-anchor-domain-kit`, `spatial-game-board-domain-kit`, `xr-comfort-domain-kit`, and `xr-platformer-render-adapter-kit`.
- Sibling descriptor kit: `stereoscopic-render-domain-kit` should compose beside the suite for left/right eye descriptors.
- Boundary: kits may own platformer state, collision meaning, object events, 2D camera/render descriptors, XR pose/input descriptors, spatial board transforms, comfort policy, and XR render-plan descriptors. Hosts own Canvas/WebGL/Three drawing, actual WebXR/OpenXR sessions, raw runtime handles, frame presentation, assets, DOM input, audio, and route fiction.
- Test coverage: `tests/vr-platformer-kit-suite-smoke.test.mjs` is wired into `npm test`; it checks kit identity, descriptor composition, and maximum-feature composition length.
- Promotion readiness: incubation only. Add deterministic replay and promotion-determinism scanning before treating any child platformer/XR boundary as promotion-facing. Do not promote the maximum-feature suite as a Core DSK.
- Experiment consumers: none yet. Do not add a canonical route only to satisfy the about-20 target; create one only when it proves local route JavaScript shrink or a distinct spatial-platformer validation need.

## 2026-06-24 — Atomic Domain Kit Expander downstream consumption map update

- `next-ledge` is now the first downstream route-progress consumer. Experiments imports `createGenericRouteProgressKit`, derives checkpoints from climb anchors, syncs anchor completion through `engine.n.genericRouteProgress`, and exposes `domain.routeProgress` in route snapshots.
- Route-side guard: `tests/next-ledge-route-progress-replay-spec-smoke.mjs` checks the partial route-progress DSK seam and blocks a premature `generic-route-cargo-extraction-kit` claim.
- Promotion implication: `generic-route-progress-kit` has partial downstream consumption/spec proof now, but still lacks a full traversal/cargo executable route replay and should not move to Core promotion review yet.
- Composite implication: `generic-route-cargo-extraction-kit` has ProtoKits smoke/replay coverage, but still lacks downstream route consumption proof. The safest next delivery/extraction patch is a narrow `next-ledge` cargo/resource/pressure plan, not a new atomic route-progress kit.
