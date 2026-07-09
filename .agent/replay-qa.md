# Deterministic Replay QA

Track scenario QA and deterministic replay coverage.

## Standing rules

- Replay QA should validate domain communication boundaries.
- Browser and renderer nondeterminism should be isolated from reusable kit logic.
- Scenario fixtures should help experiments stay thin and cumulative.
- Replay results should reveal when higher-level domains are ready to form.

## Scenario template

- Scenario:
- Kits:
- Seed:
- Inputs:
- Fixed ticks:
- Expected events:
- Expected snapshots:
- Nondeterminism risks:
- Status:

## Covered scenarios

### 2026-06-23 — Generic promotion replay pack

- Scenario: fixed-tick rendererless replay for generic pressure/resource/action-window/affordance DSK candidates.
- Kits: `generic-pressure-loop-kit`, `generic-resource-loop-kit`, `generic-action-window-kit`, `generic-affordance-descriptor-kit`.
- Seed: no RNG; deterministic command/tick fixtures in `tests/fixtures/generic-promotion-replay-fixtures.mjs`.
- Inputs: oxygen passive rise, stamina spend/restore, parry open/commit, gate affordance use/complete.
- Fixed ticks: explicit fixture ticks, including zero-delta descriptor validation where useful.
- Expected events: pressure adjusted/warning/peaked, resource spend/restore/threshold, action opened/perfect/accepted/closed/cooldown, affordance use/completion.
- Expected snapshots: final channel status/value, final meter value/threshold state, action-window cooldown state, affordance hidden/completed descriptor state.
- Nondeterminism risks: none observed in fixture design; browser, renderer, DOM, Canvas, WebGL, pointer lock, audio, and asset loading are not involved.
- Status: covered by `tests/generic-promotion-replay-smoke.test.mjs` and included in the default ProtoKits `npm test` script.

### 2026-06-24 — Generic route-progress replay pack

- Scenario: fixed-tick rendererless replay for the atomic route/checkpoint/objective-progress DSK boundary.
- Kits: `generic-route-progress-kit` through the preferred `engine.n.genericRouteProgress` namespace.
- Seed: no RNG; deterministic route/checkpoint command fixtures in `tests/fixtures/generic-route-progress-replay-fixtures.mjs`.
- Inputs: checkpoint enter/complete, route advance, out-of-order rejection, reset, and fixed-tick refreshes.
- Fixed ticks: explicit fixture ticks at `0.25s`, `0.1s`, `0.5s`, and zero-delta refresh ticks.
- Expected events: checkpoint entered/completed, route advanced/completed/reset, and rejection counts.
- Expected snapshots: active checkpoint, completed ids, route status, deterministic `updatedAtTick`, renderer-agnostic route-checkpoint descriptors, and fresh-run digest equality.
- Nondeterminism risks: source-level replay guard blocks `Date.now`, `performance.now`, `Math.random`, `crypto.getRandomValues`, `requestAnimationFrame`, DOM, Canvas, WebGL, browser audio, and pointer-lock references from the route-progress kit.
- Status: covered by `tests/generic-route-progress-replay-smoke.test.mjs`, backed by `tests/fixtures/generic-route-progress-replay-fixtures.mjs`, and included in the default ProtoKits `npm test` script immediately after the atomic route-progress smoke.

### 2026-06-23 — Generic defense composite replay pack

- Scenario: fixed-tick rendererless replay for the current `generic-defense-kits` compatibility composite before atomic split work.
- Kits: `generic-defense-kits` layered map/path/vital, economy, structure, wave/agent, combat, session facade, and render-descriptor kits.
- Seed: no RNG; deterministic command/tick fixtures in `tests/fixtures/generic-defense-replay-fixtures.mjs`.
- Inputs: build, upgrade, start wave, projectile kill/reward, wave completion reward, and no-tower vital breach/loss.
- Fixed ticks: explicit zero-delta build/upgrade settlement ticks plus fixed `0.1s` combat ticks and fixed `1s` breach ticks.
- Expected events: build requested/built, upgrade requested/upgraded, economy debit/credit, wave started/completed, enemy killed, vital damaged, and rejection absence.
- Expected snapshots: final session status, economy currency, structure level/damage, wave state, vital health, HUD descriptors, and descriptor-kind counts.
- Nondeterminism risks: none intentionally included in the replayed `generic-defense-kits` DSK stack; browser, renderer, DOM, Canvas, WebGL, Three.js, pointer lock, audio, and asset loading remain outside the replay.
- Status: covered by `tests/generic-defense-replay-smoke.test.mjs` and included in the default ProtoKits `npm test` script.

### 2026-06-24 — Generic defense session-command smoke replay seam

- Scenario: headless session-command replay seam for blueprint selection and structure sell/refund through namespaced generic-defense resources and events.
- Kits: `generic-defense-dsk-boundaries` plus `generic-defense-session-command-kit`.
- Seed: no RNG; deterministic command ids in `tests/generic-defense-session-command-kit-smoke.test.mjs`.
- Inputs: `n.genericDefense.sessionFacade.setBlueprint("ember")`, `build("slot-a", "ember")`, fixed settlement ticks, `sell(structureId)` and duplicate sell rejection.
- Fixed ticks: zero/short smoke-world ticks around build debit and sell refund settlement.
- Expected events: build requested/built, economy debit, economy credit refund, command rejection for unknown blueprint as needed.
- Expected snapshots: session blueprint id, one built structure before sell, zero structures after sell, and wallet currency increasing after refund settlement.
- Nondeterminism risks: the smoke and promotion determinism guard block wall-clock, RNG, DOM, Canvas, WebGL, browser audio, pointer, and animation-frame dependencies from the new kit.
- Status: covered by `tests/generic-defense-session-command-kit-smoke.test.mjs` and included in the default ProtoKits `npm test` script.

### 2026-06-23 — Promotion determinism guard

- Scenario: static promotion gate for wall-clock/browser leakage in promotion-facing generic DSKs.
- Kits: `generic-pressure-loop-kit`, `generic-resource-loop-kit`, `generic-action-window-kit`, `generic-affordance-descriptor-kit`, `generic-defense-dsk-boundaries`, `generic-defense-aaa-dsk-bridge`, and `generic-defense-session-command-kit`.
- Seed: none; this is a source-level determinism guard.
- Inputs: promotion-facing source files plus the broad `generic-defense-aaa-kits` compatibility facade as a known exception file.
- Fixed ticks: none.
- Expected events: none.
- Expected snapshots: none.
- Nondeterminism risks: the guard blocks promotion-facing use of `Date.now`, `performance.now`, `Math.random`, `crypto.getRandomValues`, `requestAnimationFrame`, DOM, Canvas, WebGL, browser audio, and pointer APIs. It also records that `generic-defense-aaa-kits` still has wall-clock/browser-timing convenience paths and should stay outside Core-promotion review until pruned or made tick/command deterministic.
- Status: covered by `tests/promotion-determinism-guard-smoke.test.mjs` and included in the default ProtoKits `npm test` script.

### 2026-06-24 — Generic defense placement-projector namespace smoke

- Scenario: rendererless placement confirmation through the namespaced generic-defense session facade.
- Kits: `generic-defense-dsk-boundaries` plus `createGenericPlacementProjectorKit()` from `generic-defense-presentation-stack-kit`.
- Seed/config: deterministic smoke-world fixture from `tests/aaa-domain-spine-smoke-harness.mjs`; no RNG.
- Inputs: begin placement with the first fixture blueprint, move to the first fixture slot, confirm with a command id.
- Fixed ticks: none required; this is a semantic method/snapshot bridge smoke.
- Expected snapshots: the synced `engine.n.genericDefense.sessionFacade` snapshot resolves the slot/blueprint, the build confirmation creates one structure at the projected slot, and wallet currency decreases.
- Nondeterminism risks: the smoke poisons `engine.genericDefense` and `engine.defenseBuild` after namespace sync, so the projector must prefer `engine.n.genericDefense.sessionFacade.getSnapshot()` and `.build(...)`; DOM, Canvas, and browser frame timing are absent.
- Status: covered by `tests/generic-defense-placement-projector-namespace-smoke.test.mjs` and included in the default ProtoKits `npm test` script before generic-defense boundary/replay checks.

## Downstream route proof

### 2026-06-23 — Signal Bastion executable route replay in Experiments

- Scenario: browserless route-domain replay for the canonical `signal-bastion` strategic-pressure lane.
- Kits: real Core `nexusengine` plus ProtoKits `@luminarylabs/nexusengine-protokits` generic-defense DSK aliases and `generic-defense-session-command-kit`.
- Seed/config: Signal Bastion debug preset from `LuminaryLabs-Agents/NexusEngine-Experiments`, not copied ProtoKit fixtures.
- Inputs: semantic blueprint selection, build, upgrade, wave-start, sell-method availability, and snapshot bridge calls from `experiments/signal-bastion-route-domain-replay.json`.
- Fixed ticks: 30 ticks at `0.1s` using the checked strategic-pressure route contract.
- Expected snapshots: map/vital, economy, structures, agents, combat, and render descriptor digest equality across fresh runs.
- Nondeterminism risks: DOM, Canvas, WebGL, Three.js, requestAnimationFrame, browser audio, asset loading, and route-local simulation copies remain excluded.
- Status: covered downstream by `LuminaryLabs-Agents/NexusEngine-Experiments` `tests/signal-bastion-executable-route-replay-smoke.mjs`.
- Promotion implication: `generic-defense-dsk-boundaries` plus `generic-defense-session-command-kit` now have route-level consumption proof beyond ProtoKits-local smoke, and the browser route can remove broad build/wave compatibility facades while staying on namespaced DSK calls.

## Open gaps

## 2026-07-09 - ProtoKit core compatibility replay closure

Two fresh seeded generators produce identical 1,000-sample sequences, and two weighted-choice runs produce identical 1,000-choice sequences. Native install, reset, load, and snapshot return the same stateless replacement descriptor. This closes compatibility replay without claiming a new canonical foundation owner.

## 2026-07-09 - Registry control-plane snapshot/replay closure

Registry, capability graph, and composition planning snapshots are versioned and serializable. Registry restore reproduces exact source records, indexes, progress, revision, and reason; graph and planner restore normalized deterministic state without host objects, network handles, functions, or wall-clock data.

## 2026-07-09 - Resource-meter replay closure

`generic-resource-loop-kit` now provides deterministic fixed-delta updates and versioned snapshot restore through `engine.n.resourceMeter`. Fresh engine installs, reset, and restored snapshots reproduce meter values, elapsed simulation time, threshold state, and bounded recent changes without wall-clock, RNG, DOM, Canvas, WebGL, or host-object ownership.

- Replace or isolate `generic-defense-aaa-kits` wall-clock/browser-timing ledger and presentation convenience paths before treating any AAA facade as promotion-ready.
- Split or alias `generic-defense-kits` into clearer atomic DSK boundaries after the compatibility replay stays green: path/slot/vital-target, economy wallet, build-placement, structure runtime, wave/agent director, projectile/combat resolver, and render-descriptor output.
- Keep Experiments route-level replay manifests aligned with ProtoKit coverage; the first executable route-domain replay now exists for `signal-bastion`, while other lanes remain contract-only.
- Add a Core-backed integration replay once the package wiring exposes a stable local Core import path for headless smoke runs inside ProtoKits itself, not only downstream Experiments.
- Add downstream route consumption proof for `generic-route-progress-kit`; until then it has stronger atomic replay coverage but not proven local experiment JavaScript shrink.

## 2026-06-24 — Deterministic Replay QA placement-projector namespace seam

Re-checked the latest Experiments and ProtoKits `.agent/` memory plus the current `generic-defense-presentation-stack-kit` implementation. The remaining strategic-pressure replay seam was precise: `createGenericPlacementProjectorKit().confirm()` still resolved build confirmation through `engine.defenseBuild?.build` before `engine.genericDefense?.build`, while Experiments recorded the Signal Bastion route bridge as `placementProjector.confirm -> engine.n.genericDefense.sessionFacade.build`.

Replay closure pushed to ProtoKits `main`:

1. Updated `protokits/generic-defense-presentation-stack-kit/index.js` so the shared snapshot helper prefers `engine.n?.genericDefense?.sessionFacade?.getSnapshot()` before legacy `engine.genericDefense?.getSnapshot()`.
2. Updated `createGenericPlacementProjectorKit().confirm()` so build confirmation prefers `engine.n?.genericDefense?.sessionFacade?.build(...)`, then falls back to `engine.defenseBuild?.build(...)` and legacy `engine.genericDefense?.build(...)` for compatibility hosts.
3. Added `tests/generic-defense-placement-projector-namespace-smoke.test.mjs`, which installs the seven generic-defense DSK aliases plus `createGenericPlacementProjectorKit()`, syncs `engine.n.genericDefense`, then reassigns/poisons `engine.genericDefense` and `engine.defenseBuild` while keeping the synced namespace alive.
4. Wired that smoke into `package.json` before generic-defense boundary/replay checks.

Status: implemented and guarded. The next Experiments cycle can update its memory to claim the placement seam has shrunk from compatibility facades to the DSK namespace, then consider replacing Signal Bastion browser-host placement calls only where its bridge/spec/executable/facade smokes stay green.

## 2026-06-24 — Deterministic Replay QA route-progress replay closure

`generic-route-progress-kit` now has both atomic smoke coverage and fixed-tick replay coverage. The replay confirms the boundary communicates through `engine.n.genericRouteProgress` methods, route state resources, checkpoint/route events, snapshots, and `route-checkpoint` descriptors after the broad `engine.genericRouteProgress` facade is poisoned.

Replay closure pushed to ProtoKits `main`:

1. Added `tests/fixtures/generic-route-progress-replay-fixtures.mjs` with deterministic delivery/checkpoint and rejection/reset scenarios.
2. Added `tests/generic-route-progress-replay-smoke.test.mjs` to run each fixture twice from a fresh engine/world and assert identical event/snapshot digests.
3. Wired the replay smoke into `package.json` immediately after the atomic route-progress smoke.

Status: implemented and guarded at the ProtoKit boundary. This does not prove local experiment JavaScript shrink until a checkpoint-heavy canonical route consumes `generic-route-progress-kit` through a browser-host bridge or executable route-domain replay.

## 2026-06-24 — Deterministic Replay QA session-command closure

`generic-defense-session-command-kit` adds a narrow command boundary over existing generic-defense session, structure, and wallet resources. It keeps the Signal Bastion setBlueprint/sell behavior reusable without promoting the broad AAA build facade.

Replay closure pushed to ProtoKits `main`:

1. Added `protokits/generic-defense-session-command-kit/index.js` as an additive DSK-style command kit that extends `engine.n.genericDefense.sessionFacade` and exposes `engine.n.genericDefense.sessionCommands`.
2. Added `tests/generic-defense-session-command-kit-smoke.test.mjs` to prove blueprint selection, build, sell/refund, duplicate command rejection, and deterministic/browserless source constraints.
3. Added the package export and wired the smoke into `npm test`.
4. Added the source to `promotion-determinism-guard-smoke` so the new command boundary stays headless and deterministic.

Status: implemented and guarded at the ProtoKit boundary, with downstream Signal Bastion route consumption recorded in Experiments. The next safe step is a CI/deploy check pass and then pruning any stale route memory that still describes `defenseBuild` or `defenseWaves` as necessary.

## 2026-06-24 — Deterministic Replay QA route-cargo extraction replay closure

`generic-route-cargo-extraction-kit` now has fixed-tick composite replay coverage beyond the existing one-shot smoke. The replay confirms the higher-level delivery/extraction boundary can coordinate `engine.n.genericRouteProgress`, `engine.n.genericResourceLoop`, and `engine.n.genericPressureLoop` after all broad child facades are poisoned.

Replay closure pushed to ProtoKits `main`:

1. Added `tests/fixtures/generic-route-cargo-extraction-replay-fixtures.mjs` with deterministic delivery/extraction and rejection/reset scenarios.
2. Added `tests/generic-route-cargo-extraction-replay-smoke.test.mjs` to run each fixture twice from a fresh engine/world and assert identical route/cargo/pressure snapshot plus event digests.
3. Wired the replay smoke into `package.json` immediately after `tests/generic-route-cargo-extraction-kit-smoke.test.mjs`.
4. Added `generic-route-progress-kit` and `generic-route-cargo-extraction-kit` to `tests/promotion-determinism-guard-smoke.test.mjs` so both route/cargo promotion-facing surfaces stay free of wall-clock, RNG, DOM, Canvas, WebGL, browser audio, pointer, and animation-frame APIs.

Status: implemented and guarded at the ProtoKit boundary. This strengthens the delivery/extraction higher-level domain but still does not prove local experiment JavaScript shrink until `next-ledge` or another canonical route consumes the composite through route-level code and replay.
