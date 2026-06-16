# Pairing: Generic Mode Projected Route

## Upstream data

- Seed values.
- Path descriptors.
- Surface projection descriptors.
- Placement validation settings.

## Downstream kits

- `generic-anchor-descriptor-kit` can store the anchors.
- `generic-route-graph-kit` can consume the edges.
- `InteractionTargetKit` can expose route-node ids to input.
- Experiment adapters can map anchors into domain meanings like ledges, checkpoints, roads, doors, patrol nodes, or POIs.

## Provides

```txt
mode:projected-route
route:projected
route:graph
anchor:projected-source
```

## Requires

None for the initial self-contained implementation.

Future split versions may require:

```txt
random:seeded
path:sampler
surface:projection
placement:validation
```

## Good pairings

```txt
GenericSeedKit
→ GenericModeProjectedRoute
→ GenericAnchorDescriptorKit
→ GenericRouteInteractionBridgeKit
→ Experiment adapter
```

## Bad pairings

Do not put climb, race, road, river, or quest rules inside this kit.

Those meanings belong in presets or experiment adapters.
