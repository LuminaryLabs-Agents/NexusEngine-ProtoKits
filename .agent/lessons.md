# Lessons

Status: active

## Purpose

Store game ideas tried and tested for reusable NexusRealtime domain-kit extraction.

## Current Run: 2026-06-22

### Protocol

- Treat each game idea as a horizontal composition of DSKs.
- Test each idea by asking which reusable domains it exposes.
- Keep game names out of reusable kit names.
- Prefer generic atomic domains with real rules, state, data contracts, events, and services.

### Ideas Tried

- `Stormgrid Salvage`: strong for utility networks, disaster propagation, repair logistics, evacuation, and trust domains.
- `Deep Archive Rescue`: strong for evidence, chain-of-custody, scan confidence, extraction routes, and hazard archives.
- `Relay Caravan`: strong for convoy routing, signal coverage, mobile depots, temporary relays, and route-risk domains.
- `Glasshouse Collapse`: strong for climate control, crop viability, water pressure, structure stress, and workforce safety domains.
- `Moving Rooms Market`: strong for modular spaces, vendor contracts, crowd flow, reputation, pricing, and room reconfiguration domains.

### Alignment Lessons

- The strongest broad extraction target is `Stormgrid Salvage` because it forces spatial, utility, social, logistics, hazard, planning, and proof domains to interact.
- `Relay Caravan` and `Deep Archive Rescue` add useful child domains but are narrower as master games.
- `Glasshouse Collapse` is a strong biome/facility survival preset, but many core needs already map to environment/resource/pressure kits.
- `Moving Rooms Market` is valuable for economy/social domains, but it needs more non-renderer deterministic contracts before it becomes a first-wave target.

### Reusable Boundary Lessons

- Utility networks should be generic enough to model power, water, signal, fuel, oxygen, magic, data, or logistics flow.
- Incident triage should be separate from objectives because it owns severity, decay, priority, and dependencies.
- Crew dispatch should be separate from agent movement because it owns assignment, skills, fatigue, and handoff state.
- Evacuation flow should be separate from crowd rendering because it owns capacity, compliance, route choice, and safe-zone state.
- Public trust should be a generic social pressure domain, not tied to city-rescue theming.

### Inventory

- Full hierarchy and candidate DSK backlog recorded in `.agent/game-domain-kit-inventory.md`.

## Current Run: 2026-06-22 Large Backlog Expansion

### Protocol

- Expanded the prior five-game brainstorming pass into a broad docs-facing inventory instead of implementation work.
- Kept entries as idea seeds only; each seed still requires existing-kit search, DSM classification, and proof planning before implementation.
- Grouped ideas by reusable domain family so future work can pick lanes rather than add one-off kits.

### Output

- Full 1000-item backlog recorded in `docs/1000-PROTOKIT-IDEA-SEEDS.md`.

### Lessons

- The repo has enough raw kit surface that the next high-leverage build should start from proof/export/test maturity before adding many new kits.
- The strongest new extraction lanes are proof pipeline, utility/disaster/logistics, knowledge/provenance, and authoring/validation.
- Game seeds remain useful as extraction probes, but reusable kit names must stay generic and app-neutral.
