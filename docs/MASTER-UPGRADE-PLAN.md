# Master Upgrade Plan — NexusEngine ProtoKits

## Intent

Upgrade `NexusEngine-ProtoKits` into a durable, additive Domain Service Kit composition layer without removing or renaming existing functionality. Every current kit, route, export, demo, and experiment remains a compatibility consumer while new documentation, manifests, domain-boundary metadata, deploy/scene composition kits, validation scripts, and promotion evidence are layered in. The north star is simple: reusable behavior becomes a kit, reusable composition becomes a kit, game-specific content becomes data/deploy manifests/sequences, and presentation stays in hosts or renderer adapters.

## Non-breaking rules

- Do not remove existing exports, kit factories, demos, tests, route paths, package paths, or compatibility aliases.
- New functionality must be additive.
- Renamed concepts must keep compatibility aliases.
- Existing game-specific host code should be wrapped or bridged before it is replaced.
- Package export map changes must add paths only.
- Experiments and generated routes remain consumers, not architecture owners.

## Upgrade tracks

1. Documentation standard: add per-kit README templates, ownership rules, performance contracts, and promotion evidence rules.
2. Machine-readable metadata: add `kit.manifest.json` support, manifest validation, inventory generation, and domain-boundary checks.
3. Domain boundary layer: generalize the Generic Defense boundary pattern into reusable helpers.
4. Composition/deploy layer: add deploy manifest, deploy registry, scene lifecycle, scene transition, asset pack, save delta, host shell, session facade, scene graph, and kit registry kits.
5. Compatibility bridges: map existing AAA batch and generated-route shapes into deploy manifests without moving or deleting current routes.
6. Performance-ledger readiness: make performance contracts first-class while reusing the existing `performance-budget-kit`.
7. Desktop readiness: document how Electron should host the runtime without adding Electron ownership to reusable kits.

## Definition of done

- Existing tests and exports continue to work.
- New compositional kits are renderer-agnostic.
- Core docs define where behavior, content, assets, host glue, and renderer responsibilities belong.
- New manifests and validation scripts can describe and check kits without changing kit runtime behavior.
- Existing route registries can be represented as deploy manifests through additive bridges.
- Future house, scene, meadow, flight, and survival game domains can be composed from boundaries rather than becoming one-off apps.
