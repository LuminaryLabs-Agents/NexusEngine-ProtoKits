# SeedSpatial DSK Mapping

This document maps SeedSpatial-style in-headset authoring actions onto the spatial authoring ProtoKit stack.

## Principle

SeedSpatial is the human authoring surface. DSKs are the reusable behavior grammar. OpenXR/WebXR/PICO sensor details stay in adapter kits; DSKs receive normalized commands.

## Mappings

| User action | Normalized command | Responsible kit | Result |
|---|---|---|---|
| Point at a panel and say “make this bigger” | `xr.point` then `transform.resizeRequested` | `selection-domain-service-kit`, `transform-domain-service-kit` | Scene graph transform patch |
| Frame several objects and say “align these” | `selection.regionRequested`, `layout.alignRequested` | `selection-domain-service-kit`, `layout-domain-service-kit` | Multi-object layout patch |
| Point from object A to object B and say “put this there” | `selection.pointToPointRequested`, `transform.moveRequested` | `selection-domain-service-kit`, `transform-domain-service-kit` | Targeted move patch |
| Create a timer here | `ai.patch.requested` or `widget.createRequested` | `ai-generation-domain-service-kit`, `widget-domain-service-kit` | Timer widget descriptor |
| Make this button open that note | `binding.createRequested` | `binding-domain-service-kit`, `interaction-domain-service-kit` | Declarative binding rule |
| Save this workspace | `persistence.saveRequested` | `persistence-domain-service-kit` | JSON-safe snapshot |
| Publish this | `publish.requested` | `publish-domain-service-kit` | WebXR/OpenXR artifact descriptor |

## OpenXR-safe flow

```txt
OpenXR Action / Action Space / Reference Space
→ openxr-adapter-kit
→ normalized action, pose, ray, hit, anchor descriptor
→ DSK command
→ scene patch or event
```

The same DSK stack can be fed from WebXR, desktop mock input, PICO OS services, or native OpenXR adapters.
