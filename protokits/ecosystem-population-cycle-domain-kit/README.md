# Ecosystem Population Cycle Domain Kit

Defines aggregate ecological cohort changes, trophic flow, migration, reproduction, mortality, and carrying-capacity pressure with explicit fixed cycles and named-seed variation.

## Boundary

- Owns species cohort definitions, regional population counts, feeding links, birth/mortality rules, capacity effects, seeded transitions, snapshots, and population descriptors.
- Does not own individual creature AI, spawn placement, terrain/biome generation, weather, rendered wildlife, assets, or species lore.
- Core supplies deterministic runtime/data primitives and portable world-region IDs; this kit supplies ecological meaning only.

## API and state

- Resource: `ecosystemPopulation.state`
- API: `engine.n.ecosystemPopulation.registerSpecies`, `.registerFeedingLink`, `.setCapacity`, `.applyMigration`, `.advanceCycle`, `.getRegion`, `.getDescriptors`, `.getTrophicFlows`, `.getSnapshot`, `.loadSnapshot`, `.reset`
- Events: population change, capacity exceeded, local extinction, recovery started, rejection, and reset facts under `ecosystem.*`.
- Snapshot: species, regions, feeding links, seed, cycle, command ledger, and bounded journal.

## Reuse proof

Use it for reef restoration or an alpine predator-prey reserve. Rewilding Basin should reproduce identical cohort totals and events from the same seed, configuration, and migrations. Stable IDs prevent duplicate species, feeding links, and migration commands.
