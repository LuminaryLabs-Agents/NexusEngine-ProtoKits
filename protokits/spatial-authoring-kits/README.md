# Spatial Authoring DSK ProtoKits

Experimental v2 ProtoKit stack for SeedSpatial-style spatial authoring.

This package defines renderer-independent, OpenXR/WebXR-compatible behavior domains for in-headset spatial creation. The kits are intentionally runtime-shaped and experimental: they define contracts, factory surfaces, requires/provides tokens, version constants, and composition helpers that can be validated in headless tests and later expanded into deeper per-domain state machines.

## Core rule

DSKs do not store raw XR runtime objects.

They do not store `XrSession`, `XrSpace`, `XrSwapchain`, `XRSession`, `XRFrame`, `XRInputSource`, DOM nodes, Canvas contexts, Three.js objects, or renderer instances. Adapter kits normalize headset/runtime state into plain commands and descriptors.

```txt
OpenXR / WebXR runtime
→ OpenXR or WebXR adapter kit
→ normalized xr.point / xr.action / anchor descriptors
→ DSK command
→ validated scene graph patch
→ publishable artifact
```

## Included kits

- `spatial-scene-graph-kit`
- `selection-domain-service-kit`
- `transform-domain-service-kit`
- `layout-domain-service-kit`
- `widget-domain-service-kit`
- `interaction-domain-service-kit`
- `binding-domain-service-kit`
- `persistence-domain-service-kit`
- `publish-domain-service-kit`
- `ai-generation-domain-service-kit`
- `openxr-adapter-kit`
- `webxr-adapter-kit`
- `xr-spatial-anchor-kit`
- `spatial-authoring-mode-kit`

## Import

```js
import {
  createSpatialAuthoringKits,
  createSpatialSceneGraphKit,
  createSelectionDomainServiceKit,
  createOpenXRAdapterKit
} from "./protokits/spatial-authoring-kits/index.js";
```

## OpenXR compatibility stance

OpenXR is treated as the headset runtime contract. WebXR is treated as the web publishing contract. DSKs are the behavior contract. Adapter kits translate between runtime-specific input/spaces/anchors and normalized DSK commands.

## Status

Experimental. These are ProtoKits for proving a spatial authoring DSK stack, not production-grade app/editor infrastructure yet.
