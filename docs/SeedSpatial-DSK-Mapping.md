# SeedSpatial Hand DSK Mapping

This document maps the first hands-only SeedSpatial authoring loop onto the required atomic hand DSK stack.

## Principle

SeedSpatial is the human authoring surface. Hand adapter DSKs translate OpenXR/WebXR/PICO hand data into normalized hand commands. The behavior DSKs define what those commands mean.

## Required mappings

| User action | Normalized command | Responsible DSK | Result |
|---|---|---|---|
| Point index finger at a panel | `hand.ray` | `webxr-hand-adapter-dsk` or `openxr-hand-adapter-dsk`, then `hand-gesture-dsk` | normalized hand ray / hover intent |
| Pinch while pointing at a panel | `hand.pinchStart` with hit object | `selection-dsk` | selected object id |
| Pinch-hold and move hand | `hand.grabMove` | `transform-dsk` | scene graph move patch |
| Two-hand pinch apart/together | `hand.twoHandScale` | `transform-dsk` | scene graph resize patch |
| Palm menu → create note/timer | `widget.create` | `widget-dsk`, `spatial-scene-graph-dsk` | new semantic widget object |
| Pinch/press a widget | `interaction.request` | `interaction-dsk` | semantic press/open/toggle/start event |
| Save workspace | `persistence.capture` | `persistence-dsk` | JSON-safe workspace snapshot |

## Explicitly deferred

These are useful but not required for the first hands-only demo:

- layout / align
- binding button-to-panel behavior
- publish artifact generation
- AI patch proposal flow
- persistent spatial anchors beyond normalized descriptors

## OpenXR-safe flow

```txt
OpenXR hand joints / action spaces / reference spaces
→ openxr-hand-adapter-dsk
→ normalized hand command
→ hand-gesture-dsk
→ selection / transform / widget / interaction / persistence DSK
→ scene graph patch or snapshot
```

The same behavior DSKs can be fed from WebXR hand input, desktop mock input, PICO OS services, or native OpenXR adapters.
