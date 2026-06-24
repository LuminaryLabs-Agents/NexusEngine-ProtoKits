# Generic Defense Family

## Purpose

The generic defense family models tower-defense / survival-defense boundaries with explicit map, economy, build placement, wave director, combat resolver, session facade, and render descriptor surfaces.

## Public export paths

- `generic-defense-aaa-dsk-bridge`
- `generic-defense-dsk-boundaries`
- `generic-defense-map-dsk`
- `generic-defense-economy-wallet-dsk`
- `generic-defense-build-placement-dsk`
- `generic-defense-wave-agent-director-dsk`
- `generic-defense-combat-resolver-dsk`
- `generic-defense-session-facade-dsk`
- `generic-defense-render-descriptor-dsk`

## Recommended composition

```txt
map
economy wallet
build placement
wave agent director
combat resolver
render descriptors
session facade
```

## Relationship to new boundary tooling

This family is the reference pattern for explicit boundary metadata. Future documentation should align it with `domain-boundary-kit` while preserving the existing API.

## Documentation status

Family overview added. Existing boundaries are strong; full README and manifest alignment remain pending.
