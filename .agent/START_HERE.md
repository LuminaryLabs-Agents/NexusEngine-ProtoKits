# ProtoKits Agent Start Here

`.agent/` is the repo-local source of truth for agent work in `NexusRealtime-ProtoKits`.

Before changing kit implementation, exports, manifests, tests, docs, promotion status, replay status, or downstream-consumption claims:

1. Read `.agent/START_HERE.md`.
2. Read `.agent/cycle-state.md` for the current ProtoKits state.
3. Read `.agent/candidate-promotions.md` before promotion, split, hold, archive, or Core-handoff decisions.
4. Read `.agent/smoke-tests.md` and `.agent/replay-qa.md` when changing tests, replay claims, deterministic fixtures, or promotion gates.
5. Read `protokits/kit-status-matrix.json` before changing the classification or promotion status of a kit family.
6. Make one bounded change.
7. Record the result in `.agent/turn-ledger/`, `.agent/cycle-state.md`, or a cycle report.

## Operating Rule

ProtoKits is the incubation factory for reusable NexusRealtime domain services.

Agent work should preserve these constraints:

- Grow reusable DSK-based ProtoKits.
- Keep reusable implementation in ProtoKits, not Experiments.
- Keep Core promotion evidence-based.
- Keep DOM, Canvas, WebGL, Three.js, browser audio, asset loading, raw platform handles, and renderer mutation out of simulation/domain kits.
- Keep broad game-family suites from becoming Core-promotion-ready by assumption.
- Prefer atomic child DSK promotion over broad composite or game-family promotion.

## Minimum Read Set

```txt
.agent/START_HERE.md
.agent/cycle-state.md
.agent/candidate-promotions.md
protokits/kit-status-matrix.json
.agent/smoke-tests.md and .agent/replay-qa.md when test/replay related
```

## Leave the Next Ledge

Every meaningful turn should end with the next smallest safe patch, proof, split, hold, promotion review, or downstream-consumption step.
