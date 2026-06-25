# ProtoKits Turn Ledger

This folder stores per-turn records for meaningful ProtoKits work.

Use a ledger entry when a turn makes or plans a change that affects:

- kit classification;
- promotion status;
- split / merge / hold / archive decisions;
- Core handoff readiness;
- replay or deterministic proof;
- downstream Experiments consumption claims;
- package exports or compatibility bridge direction;
- DSK/domain boundaries.

Do not require a ledger entry for tiny typo fixes or purely mechanical edits that do not affect project direction.

## File Naming

```txt
YYYY-MM-DD-<short-topic>.md
```

Example:

```txt
2026-06-25-protokits-master-plan.md
```

## Required Shape

Use `.agent/templates/ledger-entry-template.md` unless a cycle report is more appropriate.

Each entry should record:

- goal;
- files read first;
- files changed;
- checks run or intentionally not run;
- decision notes;
- risks or watch items;
- next ledge;
- what not to do next.

## Relationship to Cycle State

`.agent/cycle-state.md` remains the compact current-state summary. Ledger entries preserve detailed turn-level decisions and outcomes without overloading the current-state file.
