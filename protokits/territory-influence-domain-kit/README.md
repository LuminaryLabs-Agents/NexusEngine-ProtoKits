# Territory Influence Domain Kit

Defines multi-faction influence contribution, contest, decay, neutralization, and control transitions across portable authored region IDs.

## Boundary

- Owns region policies, contribution ledgers, contest/control thresholds, decay, control history, snapshots, and renderer-neutral control descriptors.
- Does not own faction lore, combat, economy, zone geometry, scene lifecycle, movement, map rendering, or network authority.
- Core Spatial/Scene own authoritative region facts; this kit owns faction influence semantics only.

## API and state

- Resource: `territoryInfluence.state`
- API: `engine.n.territoryInfluence.registerRegion`, `.contribute`, `.withdraw`, `.lockContest`, `.releaseContest`, `.advance`, `.getController`, `.getDescriptors`, `.getSnapshot`, `.loadSnapshot`, `.reset`
- Events: influence changed, contested, control changed, neutralized, command rejected, and reset.
- Snapshot: regions, contributions, transitions, tick, command ledger, and journal.

## Reuse proof

Use it for a strategy frontline or civic service districts. Border Accord should replay ties, decay, neutralization, and control changes identically. Contribution command IDs commit once and transitions emit only when the resolved region state changes.
