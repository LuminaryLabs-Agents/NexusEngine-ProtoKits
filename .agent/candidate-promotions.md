# Candidate Promotions

Record reusable behavior that should move into ProtoKits.

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
