# Composition Family

## Purpose

The composition family lets apps and scenes be assembled from manifests, lifecycle state, host contracts, save deltas, scene graphs, asset packs, and session facades without turning each scene into its own engine.

## Kits

- `domain-boundary-kit`
- `deploy-manifest-kit`
- `deploy-registry-kit`
- `asset-pack-manifest-kit`
- `scene-lifecycle-kit`
- `scene-transition-kit`
- `scene-graph-domain-kit`
- `save-delta-kit`
- `host-shell-contract-kit`
- `session-facade-kit`
- `kit-registry`
- `aaa-batch-deploy-bridge`
- `gallery-registry-bridge`
- `generated-route-host-bridge`

## Recommended stack

```txt
deploy-manifest-kit
deploy-registry-kit
asset-pack-manifest-kit
scene-lifecycle-kit
scene-transition-kit
scene-graph-domain-kit
save-delta-kit
host-shell-contract-kit
session-facade-kit
performance-budget-kit
```

## Boundary rule

Composition kits coordinate domains. They should not hide reusable gameplay simulation or renderer-specific objects.

## Documentation status

New composition kits have initial manifests. Full READMEs are being added during the documentation rollout.
