# Harness Kits

## Purpose

Harness kits prove behavior. They do not implement gameplay and they do not own renderer or platform loops.

## Canonical harnesses

```txt
scenario-qa-harness
  Checks scenario requirements.

deterministic-replay-harness
  Records runs and compares stable output hashes.

gamehost-standard-kit
  Captures host/debug snapshot shape and validates route proof packets.

promotion-readiness-harness
  Aggregates exports, docs, tests, proofs, lint, reset/snapshot, and promotion criteria.

agent-eval-harness-kit
  Runs model/agent proposals through policy, command bridge, scenario QA, and replay checks.
```

## Harness rules

```txt
Harnesses can inspect state.
Harnesses can register scenarios or proof packets.
Harnesses can produce readiness reports.
Harnesses can compare deterministic snapshots.
Harnesses should not draw, load assets, or decide gameplay outcomes.
```

## Route capture handoff

Route loading and media capture should live in `NexusRealtime-Experiments` tooling or host scripts. ProtoKits should provide GameHost contracts, scenario descriptors, and proof/report state.
