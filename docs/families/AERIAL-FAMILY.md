# Aerial Family

## Purpose

The aerial family supports high-fidelity flying, canyon traversal, aerial combat, checkpoints, camera rigs, encounters, mission sequences, and aerial rendering bundles.

## Public export families

- `aerial-canyon-kits`
- `aerial-biome-fidelity-kits`
- `aerial-cel-flight-feel-kits`
- `aerial-render-bundle-kits`
- `aerial-ui-interaction-kits`
- `aerial-patch-window-domain-kit`
- `canyon-terrain-domain-kit`
- `flight-corridor-domain-kit`
- `powered-aerial-flight-domain-kit`
- `aerial-vegetation-placement-domain-kit`
- `aerial-procedural-object-domain-kit`
- `aerial-projectile-system-kit`
- `aerial-combat-domain-kit`
- `aerial-encounter-director-kit`
- `aerial-camera-rig-domain-kit`
- `aerial-mission-sequence-kit`

## Recommended composition

```txt
terrain / canyon / patch window
flight corridor / powered flight
camera rig
encounter director
projectile + combat
mission sequence
render bundle
UI interaction bridge
performance budget
```

## Documentation status

Family overview added. Individual kit READMEs and manifests are pending and should document public APIs, requires/provides, renderer descriptors, performance scaling, and promotion readiness.
