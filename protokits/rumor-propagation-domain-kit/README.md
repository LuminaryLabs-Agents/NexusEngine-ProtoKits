# Rumor Propagation Domain Kit

Defines authored claim exposure, witness/source lineage, configured seeded distortion, credibility, correction, and retirement.

## Boundary

- Owns claims, recipient exposure records, source lineage, credibility values, deterministic distortion policy, correction state, snapshots, and exposure descriptors.
- Does not own dialogue text generation, model inference, agent choices, relationships, external truth adjudication, network messages, or UI.
- Core Data may supply deterministic stream primitives; the kit owns rumor-specific lineage and exposure meaning.

## API and state

- Resource: `rumorPropagation.state`
- API: `engine.n.rumorPropagation.registerClaim`, `.share`, `.correct`, `.adjustCredibility`, `.retire`, `.getExposure`, `.getDescriptors`, `.getSnapshot`, `.loadSnapshot`, `.reset`
- Events: rumor registered/shared/distorted/corrected/retired, command rejected, and reset.
- Snapshot: claims, exposure records, bounded lineage, credibility, seed, tick, command ledger, and journal.

## Reuse proof

Use it for evacuation guidance or compromised court intelligence. Border Accord should reproduce the same lineage, configured distortions, corrections, and credibility from identical commands. Share command IDs and claim IDs prevent duplicate exposure lineage.
