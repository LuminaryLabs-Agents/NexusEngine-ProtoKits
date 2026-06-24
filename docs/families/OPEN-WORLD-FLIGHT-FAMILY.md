# Open-World / Flight Family

## Purpose

This family supports renderer-agnostic open-world traversal, seeded worlds, terrain patches, atmospheric descriptors, scatter placement, instanced rendering, actor descriptors, flock/companion agents, updrafts, and checkpoints.

## Current known kits

- `data-registry-kit`
- `performance-budget-kit`
- `sky-atmosphere-kit`
- `lighting-descriptor-kit`
- `material-palette-kit`
- `terrain-sampler-kit`
- `world-patch-kit`
- `scatter-placement-kit`
- `instanced-render-kit`
- `flight-motion-kit`
- `actor-render-kit`
- `flock-agent-kit`
- `updraft-volume-kit`
- `checkpoint-volume-kit`

## Recommended composition

```txt
data registry
performance budget
terrain sampler
world patch
scatter placement
instanced render
sky + lighting + material palette
flight motion
actor render
updraft/checkpoint volumes
```

## Documentation status

This family is the highest-priority AAA desktop documentation path after the composition layer. Start with `performance-budget-kit`, `terrain-sampler-kit`, `world-patch-kit`, and `flight-motion-kit`.
