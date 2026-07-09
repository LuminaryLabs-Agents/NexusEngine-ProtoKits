# Cohesive Core DSK Implementation Plan

Branch: `0.0.1`

## One-sentence thesis

Build a cohesive generic Domain Service Kit core by upgrading overlapping ProtoKits into atomic, idempotent, renderer-independent services that can power tower defense, survival, tactics, racing, flight, first-person exploration, building games, and other NexusEngine experiments without becoming game-specific engines.

## Non-negotiable rules

```txt
Runtime executes.
DSKs own deterministic reusable state and rules.
Mode kits compose DSKs into reusable loops.
Presets/data/theme kits configure content.
Sequences own authored player-facing flow.
Renderer hosts present descriptors only.
```

Do not create a `tower-defense-game-kit` as the core. Create generic services that tower defense can compose.

## Existing overlap review

| Existing surface | Keep / upgrade | Overlap / action |
|---|---|---|
| `generic-kit-utils` | Keep as bootstrap utility only | Useful for fast generic state-command kits, but final core DSKs should graduate into bespoke resources/events/systems when behavior matters. |
| `domain-foundation` | Split and stabilize | Already contains timed pressure, zone, scan, route, cargo, agent, resource pressure, hazard, content preset, visual/audio/camera maker, QA, replay, gamehost, token registry, and Fogline bridge. Keep generic pieces; keep Fogline bridge experiment-specific. |
| `domain-service-kits` | Upgrade from definition wrappers into true atomic DSKs | View rig, spatial interaction, completion ledger, objective bridge, lock group, damage/health, encounter director, resource node, build placement, structure runtime, diegetic feedback, asset descriptor already match the core direction. |
| `action-input-kit` | Promote toward core input DSK family | Good semantic input surface. Add input contexts, command modes, idempotent command IDs, and selection/cursor world adapters as adjacent kits. |
| `generic-kits/index.js` | Keep as aggregation point | It already exports seed/clock/spatial/input/world/surface/vehicle/avatar/interaction/economy/objective/camera/render/QA/performance kits. Use it as the public generic bundle. |
| first-person / raycaster / floor / texture / fog / lighting kits | Keep as renderer or visual descriptor support | Do not let them own gameplay. Separate descriptor kits from renderer adapter kits. |
| environment kits: biome, vegetation, ground contact, LOD | Keep and generalize | Good for high-fidelity worlds. Rename/compose under world placement + render descriptor categories. |
| race / watercraft / climb / aerial kits | Keep as domain-purpose game-family kits | Do not collapse into core. Extract reusable atomic DSKs upward only after multi-config tests. |
| `render-layer-kit` docs/import drift | Fix in follow-up | Fogline imports a pinned historical render-layer kit. Either restore/export it or replace with current generic render descriptor + visual-fidelity kits. |

## Cohesive core implementation standard

Every DSK must ship with:

```txt
protokits/<kit-name>/index.js
protokits/<kit-name>/README.md
protokits/<kit-name>/tests/<kit-name>.test.mjs
VERSION constant
createXKit(NexusEngine, config = {})
resources/events/components where needed
systems with deterministic phase names
small public engine API
requires/provides tokens
idempotent command handling when commands mutate durable state
headless tests for initial, valid, invalid, duplicate, reset, zero-delta, and deterministic repeat
browser smoke only when host-visible
```

Default public API pattern:

```js
engine.someDomain.command({ commandId, type, ...payload });
engine.someDomain.getState();
engine.someDomain.getSnapshot();
engine.someDomain.reset({ commandId });
```

Default idempotency rule:

```txt
Any externally requested durable mutation must accept commandId.
Repeated commandId must be ignored or return same resulting state.
Systems may emit `*.rejected` with reason but must not crash on bad input.
```

## Token vocabulary

Use namespaced capability tokens.

```txt
seed:world
clock:fixed
command:ledger
event:ledger
state:digest
input:actions
input:context
input:buffer
selection:state
world:sectors
world:lanes
world:paths
world:tiles
world:height-bands
world:affordances
spatial:index
placement:slots
placement:validation
structure:runtime
structure:upgrade
target:registry
target:query
combat:attack
combat:damage
combat:health
combat:status
projectile:motion
agent:roster
agent:spawn
agent:path-follow
encounter:waves
pressure:director
economy:wallet
economy:costs
objective:state
sequence:state
camera:descriptor
render:descriptors
feedback:diegetic
qa:scenario
qa:replay
perf:budget
```

# DSK implementation plan by domain

## 1. Foundation core

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `generic-seed-kit` | Existing generic export | Seed streams and deterministic random helpers | `random(stream, salt)`, `fork(stream)` | Same seed + same calls = same output | Stabilize and test cross-kit stream names. |
| `generic-clock-kit` | Existing generic export | Fixed-step clock, pause, time scale, phase time | `setPaused`, `setTimeScale`, `tickSnapshot` | Duplicate pause commands safe | Stabilize as core foundation. |
| `command-ledger-kit` | New, overlaps processedCommandIds in domain-foundation | Global commandId dedupe and command result cache | `seen`, `mark`, `resultFor` | Repeated commandId returns same status | Build new; use from all mutating DSKs. |
| `event-ledger-kit` | New, overlaps local history arrays | Recent tick facts for debug/replay/sequence waits | `record`, `queryRecent`, `clear` | Event records keyed by source tick + id | Build new. |
| `generic-state-digest-kit` | Existing generic export | Deterministic state hashes | `digest(resources)`, `getState` | Same state produces same digest | Keep and upgrade resource selection config. |
| `resource-registry-kit` | New | Registry of resource refs / public aliases | `register`, `resolve`, `list` | Duplicate registration with same payload OK | Build new. |
| `token-registry-kit` | Existing domain-foundation | Capability token validation | `set`, `getSnapshot`, `has` | Duplicate tokens ignored | Upgrade with static token catalog tests. |
| `gamehost-standard-kit` | Existing domain-foundation | Standard GameHost/debug shape | `set`, `getSnapshot`, `health` | Repeated set merges deterministically | Upgrade docs and browser smoke. |
| `deterministic-replay-harness-kit` | Existing domain-foundation | Record/replay commands and expected digests | `record`, `replay`, `assertDigest` | Replays are stable | Upgrade to use command-ledger + state-digest. |
| `scenario-qa-harness-kit` | Existing domain-foundation | Headless scenario steps | `run`, `assert`, `getSnapshot` | Scenario IDs dedupe | Upgrade with generic scenario DSL. |
| `generic-health-report-kit` | Existing generic export | Runtime health checks | `check`, `getState` | Same check key updates not duplicates | Keep. |
| `generic-performance-budget-kit` | Existing generic export | Simulation/render budgets and metrics | `setBudget`, `measure`, `getState` | Budget command keyed by id | Upgrade for DSK category budgets. |
| `generic-memory-pool-kit` | Existing generic export | Object pools for transient descriptors/events | `acquire`, `release`, `stats` | Release duplicate safe | Keep; add tests. |

## 2. Input, command, and selection

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `action-input-kit` | Existing concrete kit | Semantic actions from host input | `key`, `press`, `release`, `aim`, `clear`, `getIntent` | Key edges are state-based | Keep; add commandId optional payload. |
| `generic-input-device-kit` | Existing generic export | Raw device descriptors | `connect`, `disconnect`, `setDeviceState` | Device id updates not duplicates | Upgrade if currently wrapper-only. |
| `generic-input-actions-kit` | Existing generic export | Action map state | `input(actions)`, `getState` | Same commandId ignored | Consolidate with action-input semantics. |
| `generic-input-context-kit` | Existing generic export | Context gating: build/combat/menu/etc. | `setContext`, `allows(action)` | Duplicate context command safe | Keep and integrate with action-input. |
| `generic-input-buffer-kit` | Existing generic export | Tick-scoped buffered actions | `push`, `consume`, `clear` | CommandId prevents double push | Keep. |
| `selection-kit` | New | Selected object/slot/agent/ability state | `select`, `clear`, `getSelection` | Same selection command no-op | Build new generic. |
| `cursor-world-ray-kit` | New | Pointer-to-world descriptors, not DOM picking itself | `setPointerRay`, `setWorldPoint` | Last command per frame wins | Build new host-adapter support. |
| `command-mode-kit` | New | Current mode: inspect/build/upgrade/cast/etc. | `setMode`, `exitMode`, `getState` | Duplicate mode command safe | Build new. |
| `hotkey-command-kit` | New | Hotkey to semantic command mapping | `bind`, `trigger`, `getBindings` | Binding id replaces | Build new. |
| `ability-cast-input-kit` | New | Aim/confirm/cancel state for targeted abilities | `beginCast`, `aim`, `confirm`, `cancel` | Cast commandId deduped | Build new after ability registry. |

## 3. World, map, lane, and spatial state

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `generic-sector-world-kit` | Existing generic export | World sectors/chunks | `registerSector`, `activate`, `prune` | Sector id replace-safe | Keep. |
| `lane-field-kit` | New | Lanes, bands, lane ordering, lane tags | `registerLane`, `queryLane`, `projectToLane` | Lane id replace-safe | Build new; useful beyond TD for racing/path games. |
| `path-network-kit` | Overlaps `generic-route-field-kit`, `generic-mode-projected-route` | Paths, branches, splines, checkpoints | `registerPath`, `sample`, `nextCheckpoint` | Path id replace-safe | Upgrade route-field into concrete path network. |
| `map-tile-kit` | New | Logical grid/tile/cell state | `registerTile`, `occupy`, `release`, `query` | Occupancy commandId deduped | Build new. |
| `height-band-kit` | New | 2.5D depth/elevation bands | `registerBand`, `bandForPoint` | Band id replace-safe | Build new. |
| `terrain-affordance-kit` | New, overlaps surface/material kits | Buildable/blocked/hazard/slow/buff zones | `setAffordance`, `queryAt` | Region id replace-safe | Build new. |
| `spawn-gate-kit` | New | Spawn entrances/portals/gates | `registerGate`, `open`, `close`, `emitSpawnPoint` | Open/close commandId safe | Build new. |
| `vital-target-kit` | New generic replacement for base/core | Defendable objectives: cores, caravans, relics, gates | `registerTarget`, `damage`, `heal`, `getState` | Damage commandId deduped | Build new; tower defense uses it as base-core. |
| `chokepoint-kit` | New | Derived high-pressure path areas | `analyze`, `getChokepoints` | Analysis id replaces | Build after path-network. |
| `map-authoring-descriptor-kit` | New | Canonical map data normalization | `loadMap`, `getDescriptors` | Map revision id replaces | Build early. |
| `map-streaming-kit` | New, overlaps sector world | Active sector lifecycle for large games | `setFocus`, `load`, `unload` | Sector commands keyed | Build after sector-world. |
| `generic-spatial-index-kit` | Existing generic export | Spatial lookup | `insert`, `remove`, `queryRadius`, `queryBox` | Entity revision id | Upgrade with lane/path queries. |
| `generic-procedural-field-kit` | Existing generic export | Deterministic field sampling | `sample`, `configure` | Config revision replaces | Keep. |
| `generic-biome-field-kit` / `biome-field-kit` | Existing overlap | Biome weights and material placement rules | `sampleBiome`, `setBiome` | Biome id replace-safe | Consolidate duplicate naming. |
| `generic-poi-placement-kit` | Existing generic export | POI descriptors | `place`, `discover`, `query` | POI id dedupe | Keep. |
| `generic-discovery-kit` | Existing generic export | Discovered content state | `discover`, `forget`, `getState` | Discovery id dedupe | Keep. |

## 4. Placement and structures

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `build-slot-kit` | New | Placeable slots and occupancy | `registerSlot`, `reserve`, `release` | Reservation commandId | Build new. |
| `blueprint-kit` | New | Structure/actor/placeable definitions | `registerBlueprint`, `getBlueprint` | Blueprint id replace-safe | Build new. |
| `placement-validation-kit` | Overlaps `build-placement-kit` | Cost/range/slot/path/phase validation | `validatePlacement` | Pure deterministic query | Split from build-placement. |
| `placement-preview-kit` | Overlaps `build-placement-kit` | Preview state and rejection reasons | `setPreview`, `clearPreview` | Last preview per source wins | Split from build-placement. |
| `build-placement-kit` | Existing domain-service | Combined build placement | `requestPlacement` | Placement commandId deduped | Refactor to call validation + preview + structure build. |
| `structure-build-kit` | New | Commit valid placement into runtime entity | `build`, `cancelBuild` | Build commandId deduped | Build new. |
| `structure-runtime-kit` | Existing domain-service | Structure health/actions/cooldowns | `activate`, `damage`, `repair`, `destroy` | CommandId on mutations | Upgrade from generic wrapper. |
| `structure-upgrade-kit` | New / overlaps generic upgrade | Structure-specific upgrade branches | `upgrade`, `canUpgrade` | Upgrade commandId deduped | Build new using generic upgrade data. |
| `structure-sell-kit` | New | Sell/refund rules | `sell`, `quoteRefund` | Sell commandId deduped | Build new. |
| `structure-repair-kit` | New | Repair requests and repair-over-time | `repair`, `startRepair`, `cancelRepair` | Repair commandId deduped | Build new. |
| `build-queue-kit` | New | Construction queues and timed builds | `enqueue`, `cancel`, `complete` | Queue item id dedupe | Optional second pass. |

## 5. Targeting

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `target-registry-kit` | New, uses spatial index | Targetable entities and tags | `registerTarget`, `unregister`, `getTarget` | Target id replace-safe | Build new. |
| `target-query-kit` | New | Nearest/first/last/strongest/weakest/tagged queries | `queryTargets(criteria)` | Pure deterministic query | Build new. |
| `target-priority-kit` | New | Per-actor targeting mode | `setPriority`, `rankTargets` | Priority commandId safe | Build new. |
| `line-of-sight-kit` | New | LOS against blockers, terrain, stealth, height bands | `testLos`, `registerBlocker` | Blocker id replace-safe | Build new. |
| `range-volume-kit` | New | Circle/cone/lane/box/spline/aura volumes | `registerRange`, `contains` | Range id replace-safe | Build new. |
| `target-lock-kit` | New | Lock-on, retarget delay, target lost | `lock`, `release`, `updateLocks` | Lock commandId deduped | Build new. |
| `threat-score-kit` | New | Generic danger scoring | `score(entityId)`, `rank` | Pure deterministic query | Build after target-query. |
| `overkill-avoidance-kit` | New | Assigned damage reservation | `reserveDamage`, `releaseDamage` | Reservation commandId deduped | Build after damage-request. |

## 6. Attacks, emitters, projectiles, and damage

Use generic names; tower defense can configure structures as emitters.

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `actor-attack-kit` | New | Attack cooldowns, bursts, reload, wind-up | `requestAttack`, `setEnabled` | Attack commandId deduped | Build new. |
| `actor-facing-kit` | New | Rotation arcs, facing, turn limits | `setFacing`, `turnToward` | Last source wins by tick | Build new. |
| `channel-attack-kit` | New | Beam/channel/ramp attacks | `startChannel`, `stopChannel` | Channel id dedupe | Build new. |
| `aura-effect-kit` | New | Radius/lane aura effects | `registerAura`, `queryAura` | Aura id replace-safe | Build new. |
| `charge-attack-kit` | New | Charged attacks and overcharge | `charge`, `releaseCharge` | Charge commandId deduped | Build new. |
| `ammo-magazine-kit` | New | Ammo, reload, special ammo | `spendAmmo`, `reload`, `setAmmo` | Spend commandId deduped | Build new. |
| `synergy-link-kit` | New | Adjacency/tag/set bonuses | `registerLink`, `computeBonuses` | Link id replace-safe | Second pass. |
| `projectile-spawn-kit` | New | Projectile creation from attacks | `spawnProjectile` | Projectile id / commandId dedupe | Build new. |
| `projectile-motion-kit` | New | Ballistic, homing, instant, beam, spline motion | `setMotion`, `getProjectile` | Projectile id update-safe | Build new. |
| `projectile-collision-kit` | New | Collision with target/blocker/terrain | `resolveCollisions` | Pure by tick state | Build after spatial index. |
| `projectile-impact-kit` | New | Impact facts: hit/splash/pierce/expired | `emitImpact`, `getImpacts` | Impact id dedupe | Build new. |
| `splash-damage-kit` | New | AoE/falloff/hit caps | `resolveSplash` | Impact id dedupe | Build after damage-request. |
| `pierce-chain-kit` | New | Pierce/bounce/chain/split shots | `resolveChain` | Impact id dedupe | Build new. |
| `beam-trace-kit` | New | Continuous beam traces | `traceBeam`, `tickBeam` | Beam id/tick dedupe | Build new. |
| `damage-request-kit` | New | Normalized damage queue | `requestDamage`, `getPending` | Damage commandId deduped | Build early. |
| `damage-resolution-kit` | New | Armor/resist/crit/vulnerability math | `resolveDamage` | Pure deterministic query + command ledger | Build early. |
| `health-pool-kit` | Existing overlap `damage-health-kit` | Health pools, death, invulnerability | `registerPool`, `damage`, `heal` | Damage/heal commandId deduped | Split from damage-health. |
| `armor-resistance-kit` | New | Armor and resistance profiles | `setProfile`, `modifyResistance` | Profile id replace-safe | Build new. |
| `shield-pool-kit` | New | Shields and shield breaks | `registerShield`, `damageShield`, `regen` | Damage commandId deduped | Build new. |
| `status-effect-kit` | New | Burn/slow/stun/reveal/etc. | `applyStatus`, `removeStatus` | Status instance id dedupe | Build new. |
| `status-stack-kit` | New | Stacking/refresh/caps/decay | `resolveStack` | Pure deterministic state update | Build with status-effect. |
| `crowd-control-kit` | New | CC immunity and duration scaling | `applyCc`, `queryCc` | Status commandId deduped | Build new. |
| `death-resolution-kit` | New | Death facts, rewards, child spawns | `resolveDeath` | Death id once | Build after health. |
| `damage-attribution-kit` | New | Damage ownership and assists | `attribute`, `getContributors` | Damage id once | Build new. |
| `combat-log-kit` | New | Recent normalized combat facts | `record`, `query` | Event id dedupe | Build new. |

## 7. Agents, mobs, and encounters

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `agent-roster-kit` | New | Archetype definitions for any active agents | `registerArchetype`, `getArchetype` | Archetype id replace-safe | Build new. |
| `agent-spawn-kit` | Existing overlap `agent-group-kit` | Spawn materialization | `spawn`, `despawn` | Spawn commandId deduped | Upgrade agent-group or split. |
| `agent-path-follow-kit` | New | Path progress movement | `assignPath`, `setProgress` | Assignment commandId safe | Build new. |
| `agent-lane-switch-kit` | New | Lane/branch switching | `requestLane`, `setLane` | CommandId deduped | Build after lane-field. |
| `agent-formation-kit` | New | Group spacing and formations | `setFormation`, `getOffsets` | Formation id replace-safe | Build new. |
| `agent-speed-modifier-kit` | New | Slow/haste/terrain speed | `addModifier`, `removeModifier` | Modifier id dedupe | Build after status. |
| `agent-traversal-mode-kit` | New | Ground/flying/swimming/climbing tags | `setTraversalMode` | Duplicate mode no-op | Build generic replacement for flying-only. |
| `stealth-reveal-kit` | New | Hidden/revealed state | `setStealth`, `reveal`, `queryVisible` | Reveal commandId dedupe | Build new. |
| `split-spawn-kit` | New | Splitting agents into children | `registerSplit`, `triggerSplit` | Split source id once | Build new. |
| `boss-phase-kit` | New | Boss gates, phases, enrages | `startPhase`, `completePhase` | Phase commandId dedupe | Build second pass. |
| `breach-resolution-kit` | New generic leak/base-hit resolution | Endpoint reached consequences | `resolveBreach` | Agent breach id once | Build early for TD and escort games. |
| `encounter-director-kit` | Existing domain-service | Encounter state/spawn budgets/waves | `start`, `advance`, `complete` | Phase commandId dedupe | Upgrade to use wave kits. |

## 8. Waves, pressure, and pacing

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `wave-definition-kit` | New | Authored/procedural wave data | `registerWave`, `getWave` | Wave id replace-safe | Build new. |
| `wave-spawn-scheduler-kit` | New | Spawn batches/timing/gates | `scheduleWave`, `tickSchedule` | Schedule id dedupe | Build new. |
| `wave-director-kit` | Overlaps encounter/timed pressure | Wave lifecycle | `startWave`, `pauseWave`, `completeWave` | Wave commandId dedupe | Build new, compose encounter-director. |
| `difficulty-curve-kit` | Existing race kit overlap | Generic scaling curves | `sampleCurve`, `setDifficulty` | Config revision replace | Extract generic from race. |
| `pressure-director-kit` | Existing timed pressure/resource pressure overlap | Global tension/intensity | `addPressure`, `setBand` | CommandId dedupe | Consolidate timed/resource pressure. |
| `elite-injection-kit` | New | Elite/champion modifiers | `inject`, `rollInjection` | Injection id dedupe | Build after wave-definition. |
| `boss-director-kit` | New | Boss wave timing and defeat | `startBoss`, `completeBoss` | Boss phase id once | Build after boss-phase. |
| `adaptive-pacing-kit` | New | Adjusts pressure by performance | `observeMetric`, `getRecommendation` | Metric id replace-safe | Build second pass. |
| `inter-wave-reward-kit` | New | Reward phase between waves | `openRewards`, `chooseReward` | Reward choice commandId dedupe | Build with reward-choice. |
| `wave-preview-kit` | New | Upcoming wave descriptors | `setPreview`, `getPreview` | Preview revision replace | Build for UI descriptors. |
| `endless-scaling-kit` | New | Infinite scaling beyond authored waves | `sampleRound`, `advanceRound` | Round id once | Build second pass. |

## 9. Economy, inventory, rewards

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `generic-currency-kit` | Existing generic export | Currency balance | `addCurrency`, `spendCurrency` | Transaction commandId dedupe | Upgrade with transaction ledger. |
| `resource-wallet-kit` | New / overlaps inventory/cargo | Multiple named resources | `credit`, `debit`, `transfer` | Transaction id dedupe | Build generic. |
| `income-kit` | New | Passive/kill/wave/interest income | `awardIncome`, `setRule` | Award commandId dedupe | Build new. |
| `cost-resolution-kit` | New | Cost validation and commit | `quote`, `canPay`, `commitCost` | Transaction id dedupe | Build early. |
| `loot-drop-kit` | New | Deterministic rewards/drops | `rollDrop`, `claimDrop` | Drop id once | Build with seed. |
| `reward-choice-kit` | New | Choose-one rewards | `openChoice`, `choose` | Choice commandId dedupe | Build new. |
| `generic-upgrade-kit` | Existing generic export | Generic upgrade levels | `buyUpgrade`, `getState` | Upgrade commandId dedupe | Keep; specialize through structure-upgrade. |
| `generic-market-kit` | Existing generic export | Shop/market | `list`, `buy`, `sell` | Transaction id dedupe | Upgrade with cost-resolution. |
| `generic-inventory-kit` | Existing generic export | Items | `addItem`, `removeItem`, `hasItem` | Item transaction id dedupe | Keep. |
| `generic-cargo-kit` / `generic-cargo-transfer-kit` | Existing generic export | Cargo and transfers | `addCargo`, `transferCargo` | Transfer id dedupe | Keep for broader games. |
| `generic-recovery-site-kit` | Existing generic export | Recoverable sites | `progress`, `complete` | Recovery id dedupe | Keep. |
| `meta-progression-kit` | New | Permanent unlock/progression state | `unlock`, `setProgress` | Unlock id once | Later; experiment-specific until proven. |

## 10. Abilities and consumables

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `ability-registry-kit` | New | Ability definitions | `registerAbility`, `getAbility` | Ability id replace-safe | Build new. |
| `ability-cooldown-kit` | New | Cooldowns, charges, recharge | `spendCharge`, `resetCooldown` | Spend commandId dedupe | Build new. |
| `ability-targeting-kit` | New | Target validation for ability shapes | `validateTarget`, `queryArea` | Pure query | Build with range-volume. |
| `ability-cast-kit` | New | Commit valid ability casts | `cast`, `cancel` | Cast commandId dedupe | Build new. |
| `ability-effect-kit` | New | Convert casts into effects/damage/spawns | `applyEffect` | Effect id dedupe | Build after damage/status/spawn. |
| `ultimate-meter-kit` | New | Charge meter and ready state | `addCharge`, `spend` | Spend commandId dedupe | Build new. |
| `consumable-kit` | New / overlaps inventory | One-use charged items | `use`, `addCharge` | Use commandId dedupe | Build using inventory. |

## 11. Path mutation and flow fields

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `path-blocker-kit` | New | Path-blocking entities | `registerBlocker`, `removeBlocker` | Blocker id replace/remove safe | Build after structure placement. |
| `path-validity-kit` | New | Prevent illegal all-path blocks | `validatePathState` | Pure deterministic query | Build with path-network. |
| `path-rebuild-kit` | New | Recompute affected route graph | `rebuild`, `getVersion` | Rebuild revision id | Build second pass. |
| `flow-field-kit` | New | Cached movement fields | `buildField`, `sampleField` | Field id/revision replace | Build for large agent counts. |
| `path-cost-field-kit` | New | Terrain danger/slow/preference costs | `setCost`, `sampleCost` | Region id replace-safe | Build with terrain-affordance. |
| `dynamic-gate-kit` | New / overlaps lock-group | Gates/doors/bridges that affect paths | `open`, `close`, `toggle` | Gate commandId dedupe | Build on lock-group. |
| `agent-reroute-kit` | New | Reroute active agents after path changes | `requestReroute`, `resolve` | Agent+path version id | Build after path-rebuild. |
| `traffic-resolution-kit` | New | Congestion/spacing/local avoidance | `resolveTraffic` | Pure by tick state | Build after agent-path-follow. |

## 12. Objectives, completion, and sequences

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `generic-objective-kit` | Existing generic export | Objective state | `addObjective`, `progress`, `complete` | Objective commandId dedupe | Upgrade with objective bridge. |
| `objective-bridge-kit` | Existing domain-service | Bridge domain facts into objective records | `bridge`, `registerMapping` | Fact id once | Upgrade from wrapper. |
| `completion-ledger-kit` | Existing domain-service | Unique completions | `completeOnce`, `hasCompleted` | Completion id once | Upgrade from wrapper. |
| `survival-objective-kit` | New generic | Survive until condition / protect target | `bindTarget`, `evaluate` | Evaluation pure | Build for TD/survival. |
| `perfect-run-objective-kit` | New generic | No-hit/no-leak/no-death/speed bonuses | `registerRule`, `evaluate` | Rule id replace-safe | Build second pass. |
| `side-objective-kit` | New | Optional objectives | `activate`, `progress`, `fail` | CommandId dedupe | Build new. |
| `score-summary-kit` | Existing generic export | Score/rank/star summary | `addScore`, `finalize` | Score event id dedupe | Keep and upgrade. |
| `mission-branch-kit` | New | Branching outcomes | `chooseBranch`, `evaluateBranches` | Branch commandId dedupe | Later. |
| `generic-fail-state-kit` | Existing generic export | Failure state | `fail`, `clearFailure` | Failure id once | Keep and upgrade. |
| `generic-mission-phase-kit` | Existing generic export | Mission phase | `setPhase`, `advance` | Phase commandId dedupe | Keep and integrate with td-phase/wave. |
| `sequence-state-kit` | New | Active sequences and wait state | `startSequence`, `advance`, `cancel` | Sequence instance id dedupe | Build generic sequence support. |
| `generic-tutorial-prompt-kit` | Existing generic export | Prompt descriptors | `showPrompt`, `hidePrompt` | Prompt id replace-safe | Keep; make world/diegetic-friendly. |
| `cinematic-beat-kit` | New / overlaps camera-cinematic | Authored beat descriptors | `startBeat`, `completeBeat` | Beat instance id once | Build. |
| `hint-request-kit` | New | Contextual hint requests | `requestHint`, `dismissHint` | Hint id replace-safe | Build small. |
| `failure-recovery-sequence-kit` | New | First-failure/retry teaching flow | `observeFailure`, `getRecoveryStep` | Failure id once | Build after sequence-state. |
| `boss-intro-sequence-kit` | New | Boss intro/outro sequence fragments | `startIntro`, `finishIntro` | Boss intro id once | Later. |

## 13. Camera, rendering descriptors, VFX, and UI descriptors

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `view-rig-kit` | Existing domain-service | View ray/focus/camera descriptor | `setView`, `setFocus` | View source latest wins | Upgrade from wrapper. |
| `generic-camera-state-kit` | Existing generic export | Camera state | `setCamera`, `getState` | CommandId optional | Keep. |
| `generic-camera-mode-kit` | Existing generic export | Camera modes | `setMode`, `getMode` | Duplicate mode no-op | Keep. |
| `generic-camera-collision-kit` | Existing generic export | Camera blockers/collision | `registerBlocker`, `resolve` | Blocker id replace-safe | Keep. |
| `generic-camera-comfort-kit` | Existing generic export | Shake/smoothing/reduced motion | `setComfort`, `limitShake` | Config revision replace | Keep. |
| `generic-camera-sequence-kit` | Existing generic export | Camera sequence descriptors | `start`, `stop`, `getState` | Sequence id dedupe | Keep; integrate with cinematic-beat. |
| `camera-culling-descriptor-kit` | New | Visible bounds for sim/render budgets | `setViewBounds`, `queryVisible` | Bounds source latest wins | Build new. |
| `depth-sort-descriptor-kit` | New | 2.5D draw ordering descriptors | `setSortLayer`, `sortDescriptors` | Pure deterministic query | Build new. |
| `generic-render-descriptor-kit` | Existing generic export | General render descriptors | `addDescriptor`, `clear`, `getState` | Descriptor id replace-safe | Upgrade as canonical. |
| `asset-descriptor-kit` | Existing domain-service | Asset/material/effect registry | `registerAsset`, `resolveAsset` | Asset id replace-safe | Upgrade. |
| `material-palette-kit` | Existing/README overlap | PBR/material descriptors | `registerMaterial`, `getMaterial` | Material id replace-safe | Consolidate with surface-material. |
| `lighting-descriptor-kit` | Existing/README overlap + lighting-mood | Lights/fog/tone descriptors | `setLighting`, `getState` | Profile revision replace | Consolidate. |
| `sky-atmosphere-kit` | Existing/README overlap + depth-fog | Sky/fog/cloud descriptors | `setAtmosphere`, `sample` | Profile revision replace | Consolidate. |
| `terrain-render-descriptor-kit` | New / overlaps terrain/material kits | Terrain visual descriptors | `setTerrainDescriptors` | Descriptor id replace-safe | Build. |
| `actor-render-descriptor-kit` | Existing aerial actor-render concept | Generic actor/tower/enemy render descriptors | `setActorDescriptor` | Actor id replace-safe | Build generic. |
| `projectile-render-descriptor-kit` | New | Projectile/trail descriptors | `setProjectileDescriptor` | Projectile id replace-safe | Build. |
| `vfx-descriptor-kit` | New / overlaps effects-three/particle | Effect descriptor queue | `emitVfx`, `clearExpired` | Effect id dedupe | Build. |
| `generic-particle-background-kit` | Existing concrete kit | Dynamic particle backgrounds | `setPreset`, `getDescriptor` | Preset revision replace | Keep. |
| `decal-kit` | Existing export | Decal descriptors | `addDecal`, `clearDecal` | Decal id replace-safe | Keep as visual descriptor. |
| `instanced-render-kit` | Existing/README overlap | Instance batch descriptors | `setBatch`, `getBatches` | Batch id replace-safe | Build/consolidate. |
| `lod-descriptor-kit` | Existing vegetation-lod | LOD selection descriptors | `setLod`, `getLod` | Entity id replace-safe | Generalize beyond vegetation. |
| `diegetic-feedback-signal-kit` | Existing domain-service | World-space prompts/glow/warnings | `signal`, `clearSignal` | Signal id replace-safe | Upgrade from wrapper. |
| `hud-descriptor-kit` | Existing generic HUD DOM overlap | HUD state descriptors, not DOM | `setHud`, `getHud` | HUD key replace-safe | Build descriptor-only; keep DOM as adapter. |
| `range-ring-descriptor-kit` | New | Range preview descriptors | `setRangePreview`, `clear` | Preview source latest wins | Build. |
| `threat-lane-warning-kit` | New | Lane/path danger warnings | `setThreat`, `clearThreat` | Threat id replace-safe | Build on pressure/waves. |
| `inspection-descriptor-kit` | New | Selected entity stat panels | `inspect`, `clear` | Selection latest wins | Build. |
| `reward-choice-ui-state-kit` | New | Reward UI descriptors | `setChoices`, `choose` | Choice id dedupe | Build with reward-choice. |
| `accessibility-descriptor-kit` | New | Contrast/colorblind/reduced motion descriptors | `setPreference`, `getState` | Preference key replace-safe | Build. |
| `audio-event-feedback-maker-kit` | Existing domain-foundation | Audio cue descriptors | `cue`, `getSnapshot` | Cue id/cooldown dedupe | Upgrade. |
| `music-state-kit` | New | Music intensity/layers | `setLayer`, `setIntensity` | Layer key replace-safe | Build. |
| `mix-priority-kit` | New | Cue spam prevention and ducking | `setPriority`, `filterCue` | Cue id/cooldown dedupe | Build after audio feedback. |

## 14. Scale, analytics, and tooling

| DSK | Existing overlap | Owns | API | Idempotency / tests | Action |
|---|---|---|---|---|---|
| `entity-registry-kit` | New | Generic entity lifecycle registry | `createEntity`, `removeEntity`, `query` | Entity id dedupe | Build early. |
| `simulation-budget-kit` | Existing perf-budget overlap | Per-domain update budgets | `setBudget`, `claimBudget` | Budget key replace-safe | Build on perf-budget. |
| `batch-target-query-kit` | New | Batched targeting work | `enqueueQuery`, `resolveBatch` | Query id dedupe | Build after target-query. |
| `batch-damage-kit` | New | Batched damage queue | `enqueueDamage`, `resolveBatch` | Damage id dedupe | Build after damage-request. |
| `batch-status-kit` | New | Batched status ticks | `enqueueStatus`, `tickBatch` | Status id dedupe | Build after status. |
| `offscreen-simulation-kit` | New | Simplified off-camera sim state | `setVisibleBounds`, `classify` | Bounds revision replace | Build with culling. |
| `lod-simulation-kit` | New | Reduced update frequencies | `setLodPolicy`, `classifyEntity` | Policy revision replace | Build after perf-budget. |
| `object-pool-kit` | Existing memory pool overlap | Pools for projectiles/effects/descriptors | `acquire`, `release` | Release duplicate safe | Use memory-pool. |
| `telemetry-event-kit` | New | Local telemetry facts, no network inside systems | `recordTelemetry`, `getEvents` | Event id dedupe | Build. |
| `balance-metrics-kit` | New | TTK, DPS, leaks, economy flow | `recordMetric`, `summarize` | Metric id replace-safe | Build. |
| `heatmap-kit` | New | Kill/traffic/placement heatmaps | `addSample`, `getHeatmap` | Sample id dedupe | Build. |
| `debug-overlay-kit` | Existing export | Debug descriptors | `setDebug`, `getState` | Key replace-safe | Keep as descriptor-only. |
| `state-inspector-kit` | New | Resource/event inspector snapshots | `inspect`, `snapshot` | Pure read | Build. |
| `balance-sandbox-kit` | New | Headless balance simulations | `runSandbox`, `getResult` | Scenario id dedupe | Build after core combat/waves. |
| `bot-player-kit` | New | Simple automated player commands | `runBotStep`, `setStrategy` | Bot tick id dedupe | Later. |
| `regression-scenario-kit` | New | Fixed regression test scenarios | `runScenario`, `assert` | Scenario id dedupe | Build with QA harness. |
| `generic-browser-smoke-test-kit` | Existing generic export | Browser import smoke state | `check`, `getState` | Check key replace-safe | Keep. |
| `generic-fallback-renderer-kit` | Existing generic export | Fallback descriptor/render path | `setFallback`, `getState` | Fallback key replace-safe | Keep. |

# Implementation sequence

## Phase 1: Cohesive foundation

```txt
command-ledger-kit
event-ledger-kit
resource-registry-kit
upgrade token-registry-kit
upgrade gamehost-standard-kit
upgrade deterministic-replay-harness-kit
upgrade scenario-qa-harness-kit
```

Gate: all new DSKs run headlessly and expose deterministic snapshots.

## Phase 2: Shared world + input + placement

```txt
selection-kit
cursor-world-ray-kit
command-mode-kit
lane-field-kit
path-network-kit
map-tile-kit
height-band-kit
terrain-affordance-kit
spawn-gate-kit
vital-target-kit
build-slot-kit
blueprint-kit
placement-validation-kit
placement-preview-kit
structure-build-kit
upgrade build-placement-kit
upgrade structure-runtime-kit
```

Gate: a generic build/placement scenario can run without a renderer.

## Phase 3: Combat spine

```txt
target-registry-kit
target-query-kit
range-volume-kit
line-of-sight-kit
actor-attack-kit
projectile-spawn-kit
projectile-motion-kit
damage-request-kit
damage-resolution-kit
health-pool-kit
status-effect-kit
death-resolution-kit
```

Gate: headless scenario can spawn agents, place an emitter, attack, damage, kill, and reward.

## Phase 4: Agents + waves + economy

```txt
agent-roster-kit
agent-spawn-kit
agent-path-follow-kit
breach-resolution-kit
wave-definition-kit
wave-spawn-scheduler-kit
wave-director-kit
pressure-director-kit
currency-kit/resource-wallet-kit
cost-resolution-kit
income-kit
reward-choice-kit
```

Gate: headless wave survival scenario passes deterministic replay.

## Phase 5: Renderer descriptors + feedback

```txt
actor-render-descriptor-kit
projectile-render-descriptor-kit
vfx-descriptor-kit
hud-descriptor-kit
range-ring-descriptor-kit
threat-lane-warning-kit
inspection-descriptor-kit
depth-sort-descriptor-kit
camera-culling-descriptor-kit
upgrade diegetic-feedback-signal-kit
upgrade audio-event-feedback-maker-kit
```

Gate: browser host draws descriptors only and contains no gameplay state mutations.

## Phase 6: Scale and AAA polish

```txt
simulation-budget-kit
batch-target-query-kit
batch-damage-kit
batch-status-kit
offscreen-simulation-kit
lod-simulation-kit
instanced-render-kit
lod-descriptor-kit
music-state-kit
mix-priority-kit
balance-metrics-kit
heatmap-kit
regression-scenario-kit
```

Gate: 500+ agent headless simulation passes perf/determinism smoke.

# Generic tower-defense composition example

This is intentionally generic. A tower-defense game configures structures as emitters and enemies as agents.

```js
const engine = NexusEngine.createRealtimeGame({
  kits: [
    createGenericSeedKit(NexusEngine, { seed }),
    createGenericClockKit(NexusEngine),
    createCommandLedgerKit(NexusEngine),
    createEventLedgerKit(NexusEngine),
    createGamehostStandardKit(NexusEngine),

    createLaneFieldKit(NexusEngine, map.lanes),
    createPathNetworkKit(NexusEngine, map.paths),
    createBuildSlotKit(NexusEngine, map.slots),
    createVitalTargetKit(NexusEngine, map.vitalTargets),

    createBlueprintKit(NexusEngine, content.blueprints),
    createPlacementValidationKit(NexusEngine),
    createStructureBuildKit(NexusEngine),
    createStructureRuntimeKit(NexusEngine),

    createAgentRosterKit(NexusEngine, content.agents),
    createAgentSpawnKit(NexusEngine),
    createAgentPathFollowKit(NexusEngine),
    createWaveDefinitionKit(NexusEngine, content.waves),
    createWaveDirectorKit(NexusEngine),

    createTargetRegistryKit(NexusEngine),
    createTargetQueryKit(NexusEngine),
    createActorAttackKit(NexusEngine),
    createProjectileSpawnKit(NexusEngine),
    createProjectileMotionKit(NexusEngine),
    createDamageRequestKit(NexusEngine),
    createDamageResolutionKit(NexusEngine),
    createHealthPoolKit(NexusEngine),

    createCurrencyKit(NexusEngine),
    createCostResolutionKit(NexusEngine),
    createObjectiveKit(NexusEngine),
    createCompletionLedgerKit(NexusEngine),

    createRenderDescriptorKit(NexusEngine),
    createDiegeticFeedbackSignalKit(NexusEngine),
    createHudDescriptorKit(NexusEngine),
    createScenarioQaHarness(NexusEngine),
    createDeterministicReplayHarness(NexusEngine)
  ]
});
```

# Promotion rules

Promote a DSK toward core only when:

```txt
It has a generic name.
It has renderer-independent state.
It has headless tests.
It has duplicate-command tests.
It has invalid-command rejection tests.
It composes with at least two game families or two configurations.
It does not own DOM, Canvas, Three.js objects, or tutorial copy.
```

# Immediate follow-up tasks

```txt
1. Add command-ledger-kit.
2. Add event-ledger-kit.
3. Add resource-registry-kit.
4. Upgrade domain-service-kits from generic wrappers one at a time.
5. Consolidate duplicated generic/domain/environment naming.
6. Restore or replace render-layer-kit drift.
7. Add a docs/COHESIVE_CORE_STATUS.md checklist generated from this plan.
8. Add a scripts/cohesive-core-smoke.mjs test that imports every planned existing/implemented DSK.
9. Build a headless generic defense scenario only after the Phase 1-4 spine exists.
```
