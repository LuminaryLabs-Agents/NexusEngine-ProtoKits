# NexusEngine ProtoKit Expansion Agent Memory

This folder is durable, repo-local memory for cumulative NexusEngine automation. Every scheduled task must review this folder before making decisions and must build on it rather than restarting from scratch.

## Public ecosystem

- Core: https://github.com/LuminaryLabs-Dev/NexusEngine
- ProtoKits: https://github.com/LuminaryLabs-Agents/NexusEngine-ProtoKits
- Experiments: https://github.com/LuminaryLabs-Agents/NexusEngine-Experiments

## Primary intent

Grow reusable NexusEngine domain-service-kit layers while shrinking local experiment JavaScript.

DSKs are not gap fillers. DSKs are layered domain communication boundaries that let domains expand, compose, and communicate through stable resources, events, methods, snapshots, and descriptors.

## Standing constraints

- Treat `.agent/` as the guiding memory at every key decision point.
- Only push reusable kit implementation changes into the ProtoKits repo.
- Experiments work should harden the canonical portfolio, bridges, presets, docs, manifests, and tests.
- Keep the experiment portfolio aimed at 20 strong canonical experiments without making 20 a brittle hard constraint.
- Prefer merging features and kits into higher-level cumulative domains over adding one-off game-specific code.
- When combining domains, look for higher-level domains above the current kit layer.
- Keep Core changes for mature, promoted surfaces only.
- Keep renderers presentation-only and browser concerns outside reusable kits.
- Every meaningful domain boundary should move toward headless tick smoke tests and deterministic replay.

## File map

- `intent.md` — long-form cumulative goal.
- `architecture.md` — Core / ProtoKits / Experiments boundaries.
- `dsk-boundaries.md` — DSK philosophy and boundary rules.
- `cycle-state.md` — current expansion, pruning, validation, and promotion state.
- `domain-backlog.md` — reusable domains and higher-level domain opportunities.
- `protokit-map.md` — current and target ProtoKit map.
- `experiment-map.md` — canonical experiment portfolio and domain pressure.
- `promotion-candidates.md` — experiment behavior that should become ProtoKits.
- `pruning-log.md` — duplicate routes, APIs, and domain concepts to fold or remove.
- `smoke-tests.md` — headless tick smoke coverage.
- `replay-qa.md` — deterministic replay and scenario QA coverage.
- `route-canonicalization.md` — canonical route policy and route state.
- `scheduled-task-cycle.md` — the 12 recurring task definitions.
- `cycle-reports/` — timestamped findings from task runs.
