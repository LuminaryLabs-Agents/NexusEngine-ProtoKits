# ProtoKits Agent Process

This file defines the repeatable agent cycle for `NexusEngine-ProtoKits`.

## Standard Cycle

1. Read current memory.
2. Identify the current kit ledge.
3. Choose one bounded patch.
4. Make only that patch.
5. Run or name the relevant checks.
6. Update `.agent` memory or status matrices.
7. Leave the next ledge explicit.

## Current Memory

Start from:

```txt
.agent/START_HERE.md
.agent/cycle-state.md
.agent/candidate-promotions.md
protokits/kit-status-matrix.json
.agent/smoke-tests.md and .agent/replay-qa.md when test/replay related
```

## Bounded Patch Rule

Prefer one clear patch over broad mixed work. A patch should have one primary purpose, such as:

- one atomic DSK boundary fix;
- one composite coordinator guard;
- one replay fixture or smoke;
- one status-matrix classification update;
- one promotion review note;
- one docs/process update;
- one downstream-consumption alignment.

Do not combine unrelated kit implementation, package exports, test rewrites, documentation, promotion claims, and compatibility pruning unless the user explicitly asks for a bundled pass.

## Promotion Rule

No Core-promotion-facing claim should be made unless the kit has:

- generic behavior;
- deterministic state;
- stable resources/events/API;
- renderer independence;
- headless test coverage;
- replay or fixed-tick proof where relevant;
- downstream Experiments consumption proof;
- docs and known limitations;
- a recorded promotion decision.

Broad game-family suites, compatibility bridges, and composite coordinators should not be promoted as bundles. Promote only the atomic child boundaries after proof.

## Ledger Rule

Use `.agent/turn-ledger/` for meaningful changes that affect kit classification, promotion status, replay coverage, split/hold decisions, Core handoff, package exports, or downstream-consumption claims.

Do not require ledger entries for tiny typo fixes.

## Checks Rule

Run the narrowest meaningful check when possible. If checks cannot be run, record the reason in the ledger or cycle-state update.

## Next Ledge Rule

End each meaningful turn with the next smallest safe action. The next ledge should be actionable without rediscovering the full repository state.
