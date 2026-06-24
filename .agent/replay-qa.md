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
