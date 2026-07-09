# Scheduled Task Cycle

The task cycle is twelve recurring lenses, offset by 30 minutes. Each task repeats every 6 hours, which creates one ecosystem review every 30 minutes and four full cycles per day.

## Shared instruction for every task

Review the three public repos and their `.agent/` folders first:

- Core: https://github.com/LuminaryLabs-Dev/NexusEngine
- ProtoKits: https://github.com/LuminaryLabs-Agents/NexusEngine-ProtoKits
- Experiments: https://github.com/LuminaryLabs-Agents/NexusEngine-Experiments

Use `.agent/intent.md`, `.agent/architecture.md`, `.agent/dsk-boundaries.md`, and `.agent/cycle-state.md` as the guiding memory at every key decision point.

Standing constraints for every task:

- DSKs are layered domain communication boundaries, not gap patches.
- Only push reusable kit implementation to ProtoKits.
- Harden Experiments toward about 20 canonical routes without treating 20 as a rigid quota.
- Merge features and kits into cumulative higher-level domains when domains combine.
- Keep Experiments thin: presets, bridges, manifests, docs, tests, renderer-only presentation.
- Report or update `.agent/` when durable knowledge changes.

## 1. Nexus Engine ProtoKit Expansion: Intent Miner

Schedule: 00:00, 06:00, 12:00, 18:00 America/New_York.

Prompt: Track current ecosystem intent, recent commits, docs, manifests, and architecture drift. Re-check `.agent/` before every conclusion. Report only meaningful drift, reusable domain-boundary opportunities, local-JS shrink opportunities, test gaps, or next PR plans.

## 2. Nexus Engine ProtoKit Expansion: Atomic Domain Kit Expander

Schedule: 00:30, 06:30, 12:30, 18:30 America/New_York.

Prompt: Find small reusable domain kits that remove local experiment JavaScript and create clean DSK communication boundaries. Re-check `.agent/domain-backlog.md` and `.agent/protokit-map.md` before proposing anything. Only implementation target is ProtoKits.

## 3. Nexus Engine ProtoKit Expansion: Composite Domain Kit Builder

Schedule: 01:00, 07:00, 13:00, 19:00 America/New_York.

Prompt: Find where atomic domains should layer into composite higher-level domains. Do not create monolithic game engines. Re-check `.agent/dsk-boundaries.md` before every composite recommendation.

## 4. Nexus Engine ProtoKit Expansion: Twenty Experiment Seeder

Schedule: 01:30, 07:30, 13:30, 19:30 America/New_York.

Prompt: Maintain a strong portfolio near 20 canonical experiments. Do not add hard constraints. Merge overlapping routes and features. Use experiments to validate DSK boundaries and higher-level domain combinations.

## 5. Nexus Engine ProtoKit Expansion: Domain Merge Consolidator

Schedule: 02:00, 08:00, 14:00, 20:00 America/New_York.

Prompt: Merge overlapping domain concepts when merging clarifies communication boundaries. Re-check `.agent/pruning-log.md` and `.agent/protokit-map.md`. Prefer cumulative domain expansion over duplicate feature growth.

## 6. Nexus Engine ProtoKit Expansion: API Surface Pruner

Schedule: 02:30, 08:30, 14:30, 20:30 America/New_York.

Prompt: Shrink ProtoKit APIs to clear resources, events, methods, snapshots, and descriptors. Re-check `.agent/dsk-boundaries.md` and `.agent/architecture.md`. Avoid browser/renderer ownership in reusable kits.

## 7. Nexus Engine ProtoKit Expansion: Canonical Route Pruner

Schedule: 03:00, 09:00, 15:00, 21:00 America/New_York.

Prompt: Keep Experiments from becoming a route museum. Fold successful variants into canonical routes and keep routes focused on reusable domain-boundary validation.

## 8. Nexus Engine ProtoKit Expansion: ProtoKit Promotion Gate

Schedule: 03:30, 09:30, 15:30, 21:30 America/New_York.

Prompt: Find stable experiment behavior that should become ProtoKit domain boundaries. Promotion is not gap filling. It is creating reusable communication surfaces with tests and docs.

## 9. Nexus Engine ProtoKit Expansion: Headless Tick Smoke Builder

Schedule: 04:00, 10:00, 16:00, 22:00 America/New_York.

Prompt: Make kits, composite kits, domain boundaries, and canonical experiments provable through headless deterministic ticking. Re-check `.agent/smoke-tests.md` before every recommendation.

## 10. Nexus Engine ProtoKit Expansion: Deterministic Replay QA

Schedule: 04:30, 10:30, 16:30, 22:30 America/New_York.

Prompt: Strengthen scenario QA and deterministic replay for DSK boundary communication. Re-check `.agent/replay-qa.md`. Isolate renderer/browser nondeterminism.

## 11. Nexus Engine ProtoKit Expansion: Twenty Game Refiner

Schedule: 05:00, 11:00, 17:00, 23:00 America/New_York.

Prompt: Refine the canonical experiment portfolio so each route creates useful pressure for ProtoKits. Expand routes only when they validate reusable domain boundaries; fold or prune weak overlap.

## 12. Nexus Engine ProtoKit Expansion: Cycle Report PR Planner

Schedule: 05:30, 11:30, 17:30, 23:30 America/New_York.

Prompt: Synthesize `.agent/` state and repo state into the safest next PR plan. Report what should be built, pruned, promoted, tested, or canonicalized. Always state whether local experiment JavaScript is shrinking and whether DSK boundaries are becoming clearer.
