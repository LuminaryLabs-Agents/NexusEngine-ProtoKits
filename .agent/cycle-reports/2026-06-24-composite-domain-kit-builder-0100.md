# Composite Domain Kit Builder — 2026-06-24 01:00

## Lens

Composite Domain Kit Builder: find where atomic DSKs should layer into higher-level reusable domains without becoming monolithic engines.

## `.agent/` review

- ProtoKits `.agent/intent.md` says the long-term goal is cumulative expansion through reusable domain layers, with Core owning stable primitives, ProtoKits owning reusable pre-Core domain kits, and Experiments staying as thin playable validation hosts.
- ProtoKits `.agent/domain-backlog.md` identified `route + cargo + hazards = delivery/extraction loop` and the newly added `generic-route-progress-kit` as the atomic route/checkpoint boundary to compose upward.
- ProtoKits `.agent/replay-qa.md` explicitly warned not to claim local experiment JavaScript shrink until an Experiments route consumes route progress or a higher-level composite.
- Experiments `.agent` still marks traversal/cargo pressure as contract-only while Signal Bastion remains the only executable route-domain replay lane.
- Core is reachable, but `.agent/intent.md` is still absent, matching the current Experiments memory note that Core `.agent` cannot yet be treated as reviewed.

## Direct main push

Added the first lightweight composite route/cargo/extraction DSK scaffold in ProtoKits only:

- `protokits/generic-route-cargo-extraction-kit/index.js`
- `protokits/generic-route-cargo-extraction-kit/README.md`
- `protokits/generic-route-cargo-extraction-kit/kit.manifest.json`
- `tests/generic-route-cargo-extraction-kit-smoke.test.mjs`
- `package.json` export and default `npm test` wiring

## Boundary shape

`generic-route-cargo-extraction-kit` composes:

- `generic-route-progress-kit` for ordered checkpoint/objective progress.
- `generic-resource-loop-kit` for cargo-like resource ledgers.
- `generic-pressure-loop-kit` for extraction pressure channels.

It adds only a composite session facade, snapshot resource, composite events, and renderer-agnostic descriptors. It does not own renderer, browser input, collision/hit testing, route fiction, camera, audio, DOM, Canvas, WebGL, Three.js, asset loading, cargo inventory fiction, or hazard simulation.

## Emerging higher-level domain

The strongest new composite is `route-cargo-extraction`, aligned with traversal/cargo pressure and delivery/extraction loop. It should become the safer bridge above atomic route-progress/resource/pressure boundaries before any route-local Harbor Salvage, Cargo Chain, Sky Courier, Trainyard Switcher, Dungeon Relay, Floodplain Rescue, or Next Ledge ledgers are migrated.

## Validation

Added a headless smoke test that installs the composite kit through the repo smoke harness, verifies child route/resource/pressure surfaces, drives cargo pickup/delivery, checkpoint completion, pressure adjustment, fixed tick snapshot refresh, composite completion, and descriptor kinds.

I could not run the repository test suite from this automation environment. The smoke is wired into `npm test`; the next run should execute `npm test` in ProtoKits and report/fix any breakage before Experiments consumes the new composite.

## Next safest patch

1. Run ProtoKits `npm test` and fix any composite smoke/syntax issue if it appears.
2. Add an Experiments manifest/spec note mapping `next-ledge` or a Harbor/Cargo-style canonical candidate to `generic-route-cargo-extraction-kit` without migrating browser code yet.
3. Migrate only an ordered checkpoint/cargo ledger seam after the route-level spec smoke is present, then measure local JavaScript reduction.
4. Do not add a second executable route-domain lane until this new composite has route consumption proof.
