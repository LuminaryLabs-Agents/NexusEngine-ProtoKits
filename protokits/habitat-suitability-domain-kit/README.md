# Habitat Suitability Domain Kit

Defines weighted ecological requirement evaluation over portable regional observations, producing suitability, limiting factors, and occupancy eligibility.

## Boundary

- Owns requirement profiles, regional condition observations, weighted evaluations, limiting factors, occupancy policy, change history, snapshots, and descriptors.
- Does not own biome/terrain/weather generation, population cycles, spawn placement, creature AI, rendered habitat, or species content.
- Core World/Spatial own region truth and Core Data owns primitives; ecological-fit interpretation remains this kit's distinct meaning.

## API and state

- Resource: `habitatSuitability.state`
- API: `engine.n.habitatSuitability.registerProfile`, `.setConditions`, `.evaluate`, `.setOccupancyPolicy`, `.invalidate`, `.getDescriptors`, `.getSnapshot`, `.loadSnapshot`, `.reset`
- Events: conditions changed, suitability changed, threshold crossed, limiting factor changed, command rejected, and reset.
- Snapshot: profiles, region observations, evaluations/digests, occupancy policy, command ledger, and journal.

## Reuse proof

Use it to select reef-restoration sites or seasonal herd habitat. Rewilding Basin should evaluate identical observations into identical scores and limiting factors while profile changes alter eligibility. Stable profile/observation IDs, revisions, and command IDs make evaluation inputs idempotent.
