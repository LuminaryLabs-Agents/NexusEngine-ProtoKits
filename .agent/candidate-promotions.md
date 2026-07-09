# Candidate Promotions

Record reusable behavior that should move into ProtoKits.

## 2026-07-09 - Registry control-plane purge and promotion gate

Three native DSKs are ready for stable Kits promotion as an approved addition set:

- `kit-registry-domain-kit`: canonical repository, kit, domain, and bundle metadata state.
- `capability-graph-domain-kit`: dependency graph, missing requirements, cycles, clusters, and deterministic ordering.
- `composition-planning-domain-kit`: kit/domain/bundle expansion, status gates, plans, and validation.

The purge merges ProtoKits `kit-registry`, `kit-manifest-domain-kit`, `domain-manifest-registry-domain-kit`, the Editor registry, and the stable Kits catalog into one registry owner. The two old runtime registry factories and pure helper remain compatibility exports without separate state ownership.

Repository transport, immutable-ref resolution, integrity verification, lockfiles, module loading, and installation are intentionally deferred to stable installer adapters. They are not registry-domain behavior.

## 2026-07-09 - Resource-meter experiment purge and promotion gate

`generic-resource-loop-kit` is ready for stable NexusEngine-Kits promotion as the canonical runtime-installed resource-meter collection. The feature union covers NexusEngine's pure meter semantics, the existing runtime resource-pressure mutations, and Gold Rush's resource-loop usage without absorbing pressure policy or game fiction.

- Purge target: replace only the NexusEngine-Kits `generic-resource-loop-kit` placeholder.
- Retain: `generic-pressure-loop-kit` and `pressure-domain-kit` as pressure-policy owners; retain the old resource-pressure surface as a compatibility migration candidate until parity is proven.
- Proven: native NexusEngine install, deterministic tick/reset/replay, versioned snapshot restore, aliases, threshold modes, duplicate rejection, bounded history, and 1,000-meter scale.
- Proposals: make pressure policy compose `engine.n.resourceMeter`; add inventory/economy bridge policies only when a second consumer proves reusable meaning; add named threshold presets without moving policy into the meter owner.

## 2026-06-25 — ProtoKits master pipeline bootstrap

`protokits/kit-status-matrix.json` is now the current classification layer for high-signal ProtoKits. It turns the broad inventory into a gated pipeline: atomic DSKs, atomic DSK families, composite coordinators, compatibility bridges, game-family kits, renderer-descriptor kits, and incubation suites.

Promotion/pruning implications:

- Promotion-facing after proof: `generic-pressure-loop-kit`, `generic-resource-loop-kit`, `generic-action-window-kit`, and `generic-affordance-descriptor-kit` remain the cleanest atomic DSK candidates after replay, multi-config usage, docs, and promotion review.
- Incubating with downstream proof needed: `generic-route-progress-kit` stays atomic and must not absorb cargo, hazard, pressure, collision, DOM input, Canvas hit testing, renderer camera, or route fiction.
- Blocked until downstream route consumption: `generic-route-cargo-extraction-kit` remains a composite coordinator over route progress, resource loop, and pressure loop. Do not claim it as a full traversal/cargo-pressure lane until a route such as `next-ledge` consumes cargo/resource/pressure through it and adds route replay proof.
- Strongest promotion pipeline, not one bundle: `generic-defense-dsk-boundaries` gives the atomic map/economy/build/wave/combat/session/render child surfaces. The broad generic-defense compatibility and AAA bridge surfaces remain migration tools, not Core-promotion candidates.
- Split required: vertical climb, arcade race, open-world flight, and other game-family stacks should promote only proven child domains, not branded or family-wide bundles.
- Promotion hold: `vr-platformer-kit-suite` remains an incubation suite for a possible spatial-platformer-loop; child domains need deterministic replay and downstream proof before promotion-facing claims.
- Promotion hold: the `webxr-hit-test-adapter` -> `spatial-surface-candidate` -> `anchor-descriptor` stack has real NexusEngine replay/composition proof, but still needs two executable host consumers and device-level WebXR proof.

Safest next patch: run `tests/kit-status-matrix-smoke.test.mjs`, then either add downstream `next-ledge` consumption proof for `generic-route-cargo-extraction-kit` or add deterministic replay for one child boundary inside `vr-platformer-kit-suite`.

## 2026-06-23 — ProtoKit Promotion Gate

Promotion lens: reusable behavior is ready for ProtoKits when it forms a renderer-agnostic domain communication boundary through resources, events, methods, snapshots/descriptors, presets/config, and headless tick coverage.

### Promoted/incubating in ProtoKits and now covered by generic promotion-gate smoke

- `generic-pressure-loop-kit` — stable enough as a reusable DSK for heat, storm, alert, oxygen debt, radiation, collapse, corruption, and similar pressure channels. Boundary owns channel state, passive rates, threshold transitions, warning/peaked/recovered events, and reset; hosts own fiction and rendering.
- `generic-resource-loop-kit` — stable enough as a reusable DSK for stamina, oxygen, charge, fuel, hull, tether, currency-like meters, and similar resource drains/restores. Boundary owns meter state, locks, rates, threshold events, empty/full events, and deterministic reset; hosts own controls and presentation.
- `generic-action-window-kit` — stable enough as a reusable DSK for parry, timing, repair, scan, reload, dodge, charge-release, and cooldown windows. Boundary owns opened/closed/cooldown state, perfect/good/miss judgment, accepted/rejected events, and reset; hosts only bridge semantic input.
- `generic-affordance-descriptor-kit` — stable enough as a reusable DSK for target availability, prompt descriptors, blocked/completed/hidden state, and use/rejection events. Boundary owns affordance state and renderer-facing descriptors without DOM/Canvas/WebGL ownership.

### Candidate promotion that still needs splitting before further promotion

- `generic-defense-kits` currently validates Signal Bastion well, but it is a composite bundle. It should be split or aliased into clearer atomic DSK boundaries before Core promotion consideration: path/slot/vital-target, economy wallet, build-placement, structure runtime, wave/agent director, projectile/combat resolver, and render-descriptor output.

### Emerging higher-level domains

- Strategic pressure loop: defense + resources + agents + hazards.
- Delivery/extraction loop: route/checkpoint + cargo/resource + hazards.
- Survey pressure loop: scan/affordance + zone fields + timed/pressure loops.

### Next safest patch direction

- Keep generic pressure/resource/action-window/affordance smoke coverage in the default ProtoKits test script.
- Add replay fixtures for the same four DSKs with fixed seeds/ticks and expected resource/event snapshots.
- Begin extracting Signal Bastion's generic-defense composite into named atomic DSK wrappers without deleting the compatibility bundle.

## 2026-06-23 — API Surface Pruner

`generic-defense-kits` now has a non-destructive DSK boundary alias surface in `protokits/generic-defense-dsk-boundaries/index.js`. The compatibility bundle remains intact, but hosts and future Core promotion reviews can now address seven named atomic boundaries instead of one broad game-flavored API:

- `map` / `createGenericDefenseMapDsk` — path, build-slot, and vital-target resources plus reset/vital damage events.
- `economyWallet` / `createGenericDefenseEconomyWalletDsk` — wallet resource, credit/debit events, rejection events, and small credit/debit/getState methods.
- `buildPlacement` / `createGenericDefenseBuildPlacementDsk` — build/upgrade requests, structure runtime state, and build/upgrade/rejection events.
- `waveAgentDirector` / `createGenericDefenseWaveAgentDirectorDsk` — wave start/completion, spawn queue, active agents, path following, and vital breach output.
- `combatResolver` / `createGenericDefenseCombatResolverDsk` — targeting, projectile motion, damage resolution, kill rewards, and combat feedback descriptors.
- `sessionFacade` / `createGenericDefenseSessionFacadeDsk` — small host-input facade and cumulative snapshot surface.
- `renderDescriptors` / `createGenericDefenseRenderDescriptorDsk` — renderer-agnostic HUD/world descriptors with DOM, Canvas, WebGL, audio, and asset loading outside the kit.

This is a pruning/alias step, not a destructive split. It should reduce route pressure to import the whole composite when a host only needs a specific boundary, and it gives the next promotion gate a clearer path toward Core-ready DSK contracts.

## 2026-06-23 — AAA DSK bridge pruning note

`generic-defense-aaa-dsk-bridge` now combines broad AAA compatibility exports with the pruned `generic-defense-dsk-boundaries` exports. This does not make the AAA facade a Core-promotion candidate; it is a migration bridge for routes that still need compatibility methods while the API surface shrinks.

Promotion/pruning implications:

- Build/keep: `generic-defense-dsk-boundaries` as the atomic alias surface.
- Keep compatible: `generic-defense-aaa-kits` for existing Signal Bastion-style hosts.
- Prune through migration: `generic-defense-aaa-dsk-bridge` should be the next import target for hosts that need both broad facade calls and atomic DSK aliases.
- Do not promote yet: the broad AAA facade remains too large and game-host flavored for Core promotion.
- Promote later only after proof: atomic map/economy/build/wave/combat/session/render boundaries once they have stable package/Core integration coverage and route consumption evidence.

## 2026-06-23 — engine.n generic-defense namespace pruning note

`generic-defense-dsk-boundaries` now mirrors installed atomic aliases into `engine.n.genericDefense.<boundary>` and exports `syncGenericDefenseDskEngineNamespace(engine)` for manual sync after custom install flows. This is still a compatibility-safe pruning step: it does not delete `engine.defense*` or `engine.genericDefense`, but it gives hosts and promotion review a smaller domain-shaped call surface.

Promotion/pruning implications:

- Build/keep: `engine.n.genericDefense.map`, `.economyWallet`, `.buildPlacement`, `.waveAgentDirector`, `.combatResolver`, `.sessionFacade`, and `.renderDescriptors` as the preferred future host call seams.
- Keep compatible: legacy `engine.defenseMap`, `engine.defenseEconomy`, `engine.defenseStructures`, `engine.defenseAgents`, `engine.defenseCombat`, `engine.genericDefense`, and `engine.defenseRender` until browser hosts finish migration.
- Prune through migration: the next Experiments patch should switch remaining Signal Bastion host convenience calls to `engine.n.genericDefense.<boundary>` where the facade guard and executable replay stay green.
- Do not promote yet: generic defense remains a composite validation stack, and the broad AAA facade remains too large.
- Promote later only after proof: atomic boundaries that have namespaced method calls, route consumption, smoke/replay coverage, and no browser/renderer ownership.

## 2026-06-23 — Promotion determinism guard

`tests/promotion-determinism-guard-smoke.test.mjs` now keeps promotion-facing generic DSKs and the generic-defense DSK bridge on the deterministic/headless side of the promotion gate.

Promotion/pruning implications:

- Promote/keep incubating: generic pressure, resource, action-window, affordance, and generic-defense DSK boundary aliases only while they stay free of wall-clock, RNG, DOM, Canvas, WebGL, browser audio, pointer, and animation-frame ownership.
- Keep compatible but do not promote: `generic-defense-aaa-kits` still has wall-clock/browser-timing convenience paths in broad ledger/presentation facades. It should remain a migration/host compatibility surface, not a Core-promotion candidate.
- Safest next patch: replace the AAA compatibility timestamps with tick/command-derived deterministic stamps, or keep pruning browser hosts toward `engine.n.genericDefense.<boundary>` and route-level presentation descriptors so the AAA facade becomes less necessary.

## 2026-06-24 — Atomic route-progress promotion note

`generic-route-progress-kit` is now an incubating ProtoKit for ordered route/checkpoint/objective progress. It is not a Core-promotion candidate yet, but it is the cleanest atomic boundary for several canonical experiment lanes that currently need route-local progress ledgers.

Promotion/pruning implications:

- Build/keep: `generic-route-progress-kit` as the smallest reusable route/checkpoint/objective-progress DSK surface.
- Merge later: combine with future cargo/logistics, hazards, pressure, scan/survey, or camera descriptor kits only through higher-level domains such as delivery/extraction loop or survey pressure loop.
- Do not overgrow: do not add browser collision, DOM input, canvas hit testing, renderer camera, cargo inventory, hazard simulation, or route fiction to this kit.
- Promote later only after proof: at least one Experiments route must consume it, show local JavaScript reduction, and add deterministic route-level replay or manifest/spec smoke coverage.
- Safest next patch: use Experiments to mark one checkpoint-heavy canonical route as the first consumer candidate, then migrate only its ordered checkpoint ledger while preserving renderer-only host presentation.

## 2026-06-24 — API Surface Pruner route namespace note

The route/cargo/extraction family now has smaller `engine.n` surfaces for the atomic child boundaries before browser hosts consume the composite:

- `generic-route-progress-kit` mirrors its ordered checkpoint facade under `engine.n.genericRouteProgress` and exports `GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE` plus `syncGenericRouteProgressEngineNamespace(engine)`.
- `generic-resource-loop-kit` mirrors its meter facade under `engine.n.genericResourceLoop` and exports `syncGenericResourceLoopEngineNamespace(engine)`.
- `generic-pressure-loop-kit` mirrors its channel facade under `engine.n.genericPressureLoop` and exports `syncGenericPressureLoopEngineNamespace(engine)`.
- `generic-route-cargo-extraction-kit` now prefers the three namespaced child DSK facades when building snapshots and handling route/cargo/pressure commands, with legacy `engine.generic*` fallbacks preserved.

Promotion/pruning implications:

- Build/keep: route progress, resource loop, and pressure loop as independent atomic namespaces; do not require the route-cargo composite when a host only needs one boundary.
- Keep compatible: legacy `engine.genericRouteProgress`, `engine.genericResourceLoop`, `engine.genericPressureLoop`, and `engine.genericRouteCargoExtraction` facades while Experiments migrate.
- Prune through migration: `next-ledge` should consume `engine.n.genericRouteProgress` first, then consider the route-cargo composite only if its cargo/pressure state can be removed from the host.
- Do not promote yet: route progress and route-cargo extraction still need downstream Experiments route consumption proof and executable fixed-tick replay evidence.

## 2026-06-24 — Signal Bastion session command promotion note

`generic-defense-session-command-kit` now exists as a narrow reusable command boundary for the remaining Signal Bastion browser-host convenience seams: blueprint selection and structure sell/refund. It extends `engine.n.genericDefense.sessionFacade` and also exposes `engine.n.genericDefense.sessionCommands`, without owning DOM, Canvas, renderer state, assets, audio, browser timing, or route-local collections.

Promotion/pruning implications:

- Build/keep: `generic-defense-session-command-kit` as an incubating generic-defense command extension while Signal Bastion consumes it downstream.
- Merge later: fold `setBlueprint` and `sell` into the core `sessionFacade` DSK only if compatibility risk is low and smoke/replay stays green; until then the standalone command kit is a safer additive boundary.
- Prune now: Signal Bastion no longer needs the broad `createGenericDefenseBuildKit` or `createGenericDefenseWaveKit` compatibility facades for setBlueprint, sell, or wave preview.
- Keep compatible: `generic-defense-aaa-kits` remains available but should not be used as a promotion-facing dependency for route-host command seams.
- Promote later only after proof: route-level executable replay should keep importing the package export and proving `n.genericDefense.sessionFacade.setBlueprint/sell` before any Core promotion consideration.

## 2026-06-24 — Intent Miner spatial-platformer promotion hold

`vr-platformer-kit-suite` is a useful incubation suite for a possible `spatial-platformer-loop`, but it is not a Core-promotion candidate as a maximum-feature bundle. Review child domains separately after they have resources/events/methods/snapshots/descriptors, deterministic replay, promotion-determinism guard coverage, and downstream Experiments consumption proof.

Promotion/pruning implications:

- Build/keep: child platformer/XR/spatial-board/comfort/render-descriptor boundaries in ProtoKits while they remain rendererless and deterministic.
- Merge later: combine platformer physics/progression, spatial-board/XR pose/input, comfort policy, and stereo/render descriptors as a higher-level `spatial-platformer-loop` only after child boundaries are independently clear.
- Do not promote: the full `vr-platformer-kit-suite` maximum-feature composition, Canvas/WebGL/Three drawing, actual WebXR/OpenXR session handling, raw runtime handles, frame presentation, DOM input, assets, audio, route fiction, or product routes.
- Safest next patch: add deterministic replay for one child platformer boundary or a suite-level fixed-tick replay fixture, then add the suite source to a promotion-determinism guard only when promotion-facing.
