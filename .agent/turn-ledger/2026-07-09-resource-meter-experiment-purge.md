# Resource Meter Experiment Purge

## Sources

- NexusEngine `851372d29fece5ad7d9a6253fb1a74730ae24047`: pure `createResourceMeter()` primitive and runtime `createResourcePressureKit()` compatibility behavior.
- NexusEngine-GoldRush `d1e3f5ecfaa41ef6e49a6c7cca23bda07f64bb32`: read-only consumer using generic resource/pressure loops for the gold meter.

## Domain graph

`NexusEngine core meter primitive -> generic-resource-loop-kit runtime collection -> host policies/composites`

Pressure policy, inventory/economy meaning, cargo fiction, rendering, controls, and persistence transport remain declared external owners.

## Purge inventory and decision

- Canonical owner: `generic-resource-loop-kit` / `engine.n.resourceMeter`.
- Compatibility aliases retained: `engine.n.genericResourceLoop`, `engine.resourceMeter`, and `engine.genericResourceLoop`.
- Separate owners retained: `generic-pressure-loop-kit`, `pressure-domain-kit`, and NexusEngine resource-pressure compatibility surface.
- Stable target eligible for removal: NexusEngine-Kits resource-loop placeholder, after promotion.
- No source repository was modified.

## Feature union

Registration/upsert/removal, bounded values, spend/restore/adjust, passive rates, locks, empty/full transitions, repeatable and one-shot thresholds, labels/tags/metadata, deterministic ticks, bounded recent changes, reset, descriptors, and versioned snapshots.

## Experimental proposals

- Migrate pressure policy to compose the canonical meter owner after parity proof.
- Add inventory/economy bridge policies only after another real consumer proves reusable meaning.
- Add named threshold presets without moving pressure or game policy into the resource domain.

## Validation

Direct native NexusEngine tests cover core-shaped and Gold Rush-shaped configurations, aliases, reset, replay/restore, duplicate rejection, lock rejection, thresholds, bounded history, and 1,000-meter scale. Generic promotion, route/cargo composition/replay, determinism, manifest, package export, and performance gates are also required before promotion.
