# Path Meadow Kit Ledger

This ledger tracks the ProtoKits created for the new path meadow fidelity target.

## Fidelity Target

```txt
A central hero tree sits in a meadow. A winding dirt path leads from the foreground to the tree. The scene includes dense grass, wildflowers, rocks, mushrooms, distant tree line, golden-hour sun, atmospheric haze, and a low third-person camera.
```

## Object Breakdown

| Object / Element | ProtoKit Factory | Domain | Owns | Layer Review |
| --- | --- | --- | --- | --- |
| Winding path | `createPathMeadowRouteKit` | route | path points, width, material hint, sampler, texture budget | Base composition layer; everything else can place around it. |
| Central tree | `createHeroTreeDomainKit` | environment | trunk, canopy, roots, inspect anchor, shadow/dapple descriptors | Main focal object; path and camera should lead toward it. |
| Player scale | `createPathMeadowPlayerScaleKit` | actor | scale silhouette, pose, foreground anchor | Scale/readability layer; should make the tree and path size understandable. |
| Grass | `createPathMeadowGrassKit` | vegetation | grass budget and blade style | Volume layer; should not hide path readability. |
| Wildflowers | `createPathMeadowWildflowerKit` | vegetation | flower placement and colors | Color/detail layer; should cluster near path edges. |
| Rocks | `createPathMeadowRockKit` | scatter | path-edge rock descriptors | Shape/detail layer; should frame path and foreground. |
| Mushrooms | `createPathMeadowMushroomKit` | scatter | close-ground detail descriptors | Small readability detail; should stay near foreground/path. |
| Foreground clusters | `createPathMeadowForegroundClusterKit` | scatter | near-camera vegetation/detail cluster descriptors | Density layer; should make the front of the scene feel materially closer. |
| Tree line | `createPathMeadowTreeLineKit` | environment | distant trees and horizon depth | Background layer; should support scale without stealing focus. |
| Atmosphere | `createPathMeadowAtmosphereKit` | atmosphere | sun, haze, hills, sky, exposure | Global layer; should unify lighting and depth. |
| Cloud layer | `createPathMeadowCloudLayerKit` | atmosphere | cloud and haze band descriptors | Sky/depth layer; should add painterly target fidelity without browser-specific logic. |
| Visual palette | `createPathMeadowVisualPaletteKit` | presentation | material colors, contrast, painterly lighting grade | Presentation-intent layer; renderer consumes it without owning reusable visual policy. |
| Depth cues | `createPathMeadowDepthCueKit` | presentation | foreground frame, atmospheric perspective, cast shadows, focal-light cues | Depth readability layer; should make foreground/midground/background separation explicit. |
| Cel 3D style | `createPathMeadowCel3DStyleKit` | presentation | 3D camera, cel light bands, material palette, outline policy | 3D renderer policy layer; should make the scene readable without baking browser code into the kit. |
| Entity generation ratios | `createPathMeadowEntityGenerationKit` | streaming | per-entity budgets, LOD intent, generation ratios, partition rules | Atomic entity-type layer; should let grass, flowers, rocks, mushrooms, trees, path, and hero tree scale independently. |
| Descriptor stream | `createPathMeadowDataStreamKit` | streaming | deterministic snapshot packet, checksum, prepare/commit/reset/rollback | Atomic idempotent bridge; renderers consume packets and should not mutate reusable kit state. |
| Composition | `createPathMeadowCompositionKit` | mode | camera, player silhouette, kit stack, element breakdown | Final proof layer; validates every domain is present. |

## Independent Review Rules

```txt
Each object kit must emit serializable descriptors.
Each object kit must be renderer-agnostic.
Each object kit must be useful outside this one experiment.
Each object kit must be testable without the browser.
Streaming kits must be atomic, idempotent, checksummed, resettable, and partitioned by entity type.
```

## Layer Review Rules

```txt
Route/path is the foundation.
Hero tree is the focal anchor.
Grass, flowers, rocks, and mushrooms decorate around the route.
Foreground clusters strengthen near-camera density.
Tree line and atmosphere provide depth.
Cloud layers and haze bands support the visual target mood.
Visual palette owns reusable material and lighting intent.
Depth cues own reusable foreground framing and separation intent.
Cel 3D style owns camera, light-band, material, and outline intent.
Entity generation ratios own different generation budgets and LOD rules for each entity type.
Descriptor stream owns atomic packet delivery and deterministic reset/commit behavior.
Experiment renderer owns only drawing, input, canvas, and capture.
```
