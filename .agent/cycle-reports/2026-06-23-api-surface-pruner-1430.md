# API Surface Pruner Cycle Report — 2026-06-23 14:30 ET

## What changed

- Added `protokits/generic-defense-aaa-dsk-bridge/index.js`.
- Exported `./generic-defense-aaa-dsk-bridge` from `package.json`.
- Extended `tests/generic-defense-dsk-boundaries-smoke.test.mjs` so the same boundary smoke now verifies the AAA bridge preserves compatibility exports and can return a smallest requested DSK subset.
- Added `docs/generic-defense-api-surface-pruner.md` to document the migration rule from broad composite imports toward atomic DSK aliases.
- Updated `.agent/cycle-state.md`, `.agent/protokit-map.md`, `.agent/smoke-tests.md`, and `.agent/candidate-promotions.md`.

## Long-form intent from `.agent/`

Core owns stable runtime primitives, deterministic ECS/tick behavior, promoted DSK contracts, and mature reusable surfaces. ProtoKits owns reusable domain-service kits before Core promotion. Experiments should be thin validation hosts that compose kits, provide presets/config, bridge browser input into kit APIs, tick the runtime, render snapshots/descriptors, and harden toward a strong canonical portfolio without treating 20 as a brittle quota.

DSKs are layered communication boundaries. They connect domains through resources, events, methods, snapshots, and descriptors instead of acting as gap fillers.

## Repo state vs `.agent/`

Repo state is closer to `.agent` after this patch. `generic-defense-kits` already had atomic DSK aliases; `generic-defense-aaa-kits` was still a broad route-facing compatibility surface. The bridge gives compatibility hosts one import that exposes both the old facade and the new smaller DSK aliases, so a route can migrate seam-by-seam instead of switching all broad APIs at once.

Core `.agent/intent.md` was not found during this run, while ProtoKits and Experiments `.agent/` memories exist and are current. This is ecosystem drift to address separately; this patch stayed in ProtoKits because the implementation change is reusable kit/API-surface work.

## DSK boundary clarity

Clearer. The strategic-pressure / generic-defense surface now has three layers:

1. `generic-defense-kits` — compatibility composite over atomic implementation.
2. `generic-defense-dsk-boundaries` — atomic alias layer for map, economy wallet, build placement, wave/agent director, combat resolver, session facade, and render descriptors.
3. `generic-defense-aaa-dsk-bridge` — compatibility bridge for hosts that still need AAA facade methods while importing atomic aliases from the same module.

## Local experiment JavaScript

No experiment JavaScript was changed in this patch. The bridge is intended to make the next Experiments patch smaller and safer by allowing Signal Bastion-style hosts to stop importing two defense modules and then progressively replace broad facade calls with atomic DSK aliases.

## Emerging higher-level domains

- Strategic pressure loop: defense map/slots + economy + build placement + waves/agents + combat + render descriptors + resources/hazards.
- Delivery/extraction loop: route/checkpoint + cargo/resource + hazards.
- Survey pressure loop: scan/affordance + zone fields + timed/pressure loops.

## ProtoKit build/merge/prune/promote status

- Built: `generic-defense-aaa-dsk-bridge`.
- Keep: `generic-defense-kits` and `generic-defense-aaa-kits` as compatibility surfaces.
- Prune toward: `generic-defense-dsk-boundaries` atomic aliases.
- Do not promote yet: the broad AAA facade is too large and game-host flavored for Core.
- Promote later only after more proof: atomic map/economy/build/wave/combat/session/render boundaries, once package/Core integration coverage and route consumption evidence are stable.

## Experiments canonical/fold/harden status

No Experiments push was made. Signal Bastion remains the strongest strategic-pressure proof lane, but it still consumes broad compatibility APIs. Next hardening should move its defense import toward `generic-defense-aaa-dsk-bridge` before trying to delete any compatibility route or duplicate any simulation locally.

## Missing smoke/replay scenarios

- Execute `npm test` in ProtoKits after package access is available; this runtime could not run the suite locally.
- Add a Core-backed integration smoke for atomic defense aliases once local package wiring is stable.
- Add executable browserless Signal Bastion route-domain replay that imports real Core plus ProtoKits, advances fixed ticks, and asserts descriptor digests without DOM, Canvas, requestAnimationFrame, browser audio, asset loading, or pointer timing.

## Safest next main-branch patch plan

1. In Experiments, update Signal Bastion's defense import to `generic-defense-aaa-dsk-bridge` while keeping broad facade method calls intact.
2. Add/adjust a static smoke that proves the route can see both compatibility facades and atomic DSK aliases from the bridge.
3. Only after that stays green, replace one small host seam at a time with the smallest DSK alias, starting with render descriptor snapshot consumption or map/slot reads.
4. Do not add route-local replay simulation just to close the replay gap; executable replay should import real Core and ProtoKits.
