# Spatial Authoring Family

## Purpose

The spatial authoring family contains hand/XR adapters, gesture normalization, spatial scene graph state, selection, transforms, widgets, interactions, and persistence.

## Public export paths

- `hand-input-adapter-kit`
- `xr-ray-interaction-kit`
- `webxr-hand-adapter-dsk`
- `openxr-hand-adapter-dsk`
- `hand-gesture-dsk`
- `spatial-scene-graph-dsk`
- `spatial-scene-graph-kit`
- `selection-dsk`
- `selection-domain-service-kit`
- `transform-dsk`
- `transform-domain-service-kit`
- `widget-dsk`
- `widget-domain-service-kit`
- `interaction-dsk`
- `interaction-domain-service-kit`
- `persistence-dsk`
- `persistence-domain-service-kit`

## Recommended composition

```txt
hand/input adapter
hand gesture
spatial scene graph
selection
transform
widget
interaction
persistence
```

## Relationship to scene composition

The new `scene-graph-domain-kit` generalizes the scene graph concept for non-XR multi-scene apps. The existing spatial authoring family remains intact and should be documented as a specialized authoring stack.

## Documentation status

Family overview added. Individual boundary docs and manifests are pending.
