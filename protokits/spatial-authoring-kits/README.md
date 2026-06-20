# Spatial Authoring Hand DSK ProtoKits

Experimental v2 ProtoKit stack for hands-only SeedSpatial-style spatial authoring.

This package defines the minimal required atomic DSKs for the first hand-tracking demo: hand adapters, gesture recognition, scene graph state, selection, transforms, widgets, interactions, and persistence. It intentionally excludes non-required future domains such as layout, binding, publishing, and AI patch generation until the hand-only authoring loop is proven.

## Core rule

DSKs do not store raw XR runtime objects.

They do not store `XrSession`, `XrSpace`, `XrSwapchain`, `XRSession`, `XRFrame`, `XRInputSource`, DOM nodes, Canvas contexts, Three.js objects, or renderer instances. Adapter DSKs normalize headset/runtime state into plain commands and descriptors.

```txt
OpenXR / WebXR hand tracking
→ openxr-hand-adapter-dsk or webxr-hand-adapter-dsk
→ normalized hand command
→ hand-gesture-dsk
→ selection / transform / widget / interaction / persistence DSK
→ scene graph patch or JSON-safe snapshot
```

## Required hand-authoring DSKs

- `webxr-hand-adapter-dsk`
- `openxr-hand-adapter-dsk`
- `hand-gesture-dsk`
- `spatial-scene-graph-dsk`
- `selection-dsk`
- `transform-dsk`
- `widget-dsk`
- `interaction-dsk`
- `persistence-dsk`

## Import

```js
import {
  createHandAuthoringDsks,
  createWebXRHandAdapterDsk,
  createOpenXRHandAdapterDsk,
  createHandGestureDsk,
  createSpatialSceneGraphDsk,
  createSelectionDsk,
  createTransformDsk,
  createWidgetDsk,
  createInteractionDsk,
  createPersistenceDsk
} from "./protokits/spatial-authoring-kits/index.js";
```

## OpenXR compatibility stance

OpenXR is the native headset runtime contract. WebXR is the web publishing and browser runtime contract. DSKs are the behavior contract. Adapter DSKs translate runtime-specific hand input, action spaces, reference spaces, and hit results into normalized hand commands.

## First supported UX loop

```txt
hand ray
pinch select
pinch drag move
two-hand resize
palm/menu create note or timer
press widget
save/reload snapshot
```

## Status

Experimental. These are ProtoKits for proving a hand-authored spatial DSK stack, not production-grade app/editor infrastructure yet.
