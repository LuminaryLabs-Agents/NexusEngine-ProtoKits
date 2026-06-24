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

### 2026-06-23 — Promotion determinism guard

- Scenario: static promotion gate for wall-clock/browser leakage in promotion-facing generic DSKs.
- Kits: `generic-pressure-loop-kit`, `generic-resource-loop-kit`, `generic-action-window-kit`, `generic-affordance-descriptor-kit`, `generic-defense-dsk-boundaries`, and `generic-defense-aaa-dsk-bridge`.
- Seed: none; this is a source-level determinism guard.
- Inputs: promotion-facing source files plus the broad `generic-defense-aaa-kits` compatibility facade as a known exception file.
- Fixed ticks: none.
- Expected events: none.
- Expected snapshots: none.
- Nondeterminism risks: the guard blocks promotion-facing use of `Date.now`, `performance.now`, `Math.random`, `crypto.getRandomValues`, `requestAnimationFrame`, DOM, Canvas, WebGL, browser audio, and pointer APIs. It also records that `generic-defense-aaa-kits` still has wall-clock/browser-timing convenience paths and should stay outside Core-promotion review until pruned or made tick/command deterministic.
- Status: covered by `tests/promotion-determinism-guard-smoke.test.mjs` and included in the default ProtoKits `npm test` script.

## Downstream route proof

### 2026-06-23 — Signal Bastion executable route replay in Experiments

- Scenario: browserless route-domain replay for the canonical `signal-bastion` strategic-pressure lane.
- Kits: real Core `nexusrealtime` plus ProtoKits `generic-defense-dsk-boundaries` package alias surface.
- Seed/config: Signal Bastion debug preset from `LuminaryLabs-Agents/NexusRealtime-Experiments`, not copied ProtoKit fixtures.
- Inputs: semantic build, upgrade, wave-start, and snapshot bridge calls from `experiments/signal-bastion-route-domain-replay.json`.
- Fixed ticks: 30 ticks at `0.1s` using the checked strategic-pressure route contract.
- Expected snapshots: map/vital, economy, structures, agents, combat, and render descriptor digest equality across fresh runs.
- Nondeterminism risks: DOM, Canvas, WebGL, Three.js, requestAnimationFrame, browser audio, asset loading, and route-local simulation copies remain excluded.
- Status: covered downstream by `LuminaryLabs-Agents/NexusRealtime-Experiments` `tests/signal-bastion-executable-route-replay-smoke.mjs`.
- Promotion implication: `generic-defense-dsk-boundaries` now has route-level consumption proof beyond ProtoKits-local replay, but the browser route still needs migration from the broad compatibility facade to the smallest DSK aliases before local JavaScript shrink is complete.

## Open gaps

- Replace or isolate `generic-defense-aaa-kits` wall-clock/browser-timing ledger and presentation convenience paths before treating any AAA facade as promotion-ready.
- Split or alias `generic-defense-kits` into clearer atomic DSK boundaries after the compatibility replay stays green: path/slot/vital-target, economy wallet, build-placement, structure runtime, wave/agent director, projectile/combat resolver, and render-descriptor output.
- Keep Experiments route-level replay manifests aligned with ProtoKit coverage; the first executable route-domain replay now exists for `signal-bastion`, while other lanes remain contract-only.
- Add a Core-backed integration replay once the package wiring exposes a stable local Core import path for headless smoke runs inside ProtoKits itself, not only downstream Experiments.

## 2026-06-24 — Deterministic Replay QA placement-projector namespace seam

Re-checked the latest Experiments and ProtoKits `.agent/` memory plus the current `generic-defense-presentation-stack-kit` implementation. The remaining strategic-pressure replay seam is now precise: `createGenericPlacementProjectorKit().confirm()` still resolves build confirmation through `engine.defenseBuild?.build` before `engine.genericDefense?.build`, while Experiments records the Signal Bastion route bridge as `placementProjector.confirm -> engine.n.genericDefense.sessionFacade.build`.

Replay implication: Signal Bastion is not re-owning simulation, but the reusable presentation projector has not fully caught up to the namespaced DSK boundary that the executable replay and browser host are moving toward. The next safe implementation patch is in ProtoKits, not Experiments:

1. Update `protokits/generic-defense-presentation-stack-kit/index.js` so the shared snapshot helper prefers `engine.n?.genericDefense?.sessionFacade?.getSnapshot()` before legacy `engine.genericDefense?.getSnapshot()`.
2. Update `createGenericPlacementProjectorKit().confirm()` so build confirmation prefers `engine.n?.genericDefense?.sessionFacade?.build(...)`, then falls back to `engine.defenseBuild?.build(...)` and legacy `engine.genericDefense?.build(...)` for compatibility hosts.
3. Add `tests/generic-defense-placement-projector-namespace-smoke.test.mjs` that installs the seven generic-defense DSK aliases plus `createGenericPlacementProjectorKit()`, syncs `engine.n.genericDefense`, then reassigns/poisons `engine.genericDefense` and `engine.defenseBuild` while keeping the synced namespace alive. The smoke should begin placement, move to a valid slot, confirm, assert one built structure through `namespace.sessionFacade.getSnapshot()`, and assert DOM/Canvas/browser globals are absent.
4. Wire that smoke into `package.json` before `generic-defense-replay-smoke.test.mjs` so the namespace bridge is guarded before compatibility replay runs.
5. Only then update Experiments memory to claim the placement seam has shrunk from compatibility facades to the DSK namespace.

Status: patch plan recorded, not implemented in this run because replacing the large presentation-stack source file through the connector without local test execution would be riskier than leaving the exact main-branch patch plan durable for the next scoped push.
