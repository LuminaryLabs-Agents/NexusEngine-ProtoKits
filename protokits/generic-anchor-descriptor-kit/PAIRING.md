# Pairing: Generic Anchor Descriptor Kit

## Upstream kits

- `generic-mode-projected-route` can generate anchors from a projected route.
- `generic-poi-placement-kit` can provide point-like POIs that can be converted into anchors.
- `generic-surface-projection-kit` / `generic-raycast-placement-kit` can provide grounded positions.

## Downstream kits

- `generic-route-graph-kit` can connect anchors.
- `generic-route-interaction-bridge-kit` can expose anchors as route-node interactions.
- `InteractionTargetKit` can expose anchor ids to player input.
- Renderer hosts can draw anchors as glow nodes, path handles, gates, or diegetic markers.

## Provides

```txt
anchor:descriptors
route:anchors
render:anchor-descriptors
```

## Requires

None.

## Bad pairings

Do not pair this directly with renderer-owned gameplay mutation.

Do not encode game-specific meaning like `ledge`, `summit`, `enemySpawn`, or `shop` inside the kit logic. Put those meanings in tags, metadata, presets, or experiment adapters.

## Example stack

```txt
GenericModeProjectedRoute
→ GenericAnchorDescriptorKit
→ GenericRouteGraphKit
→ GenericRouteInteractionBridgeKit
→ Experiment adapter
```
