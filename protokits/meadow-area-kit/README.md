# meadow-area-kit

`meadow-area-kit` is a reusable, insertable meadow area service for NexusRealtime/NexusEngine proof scenes.

It replaces one-off path-meadow composition logic with a generic area configuration that can be embedded into many worlds. The experiment supplies the area config inline; the kit owns deterministic meadow object planning.

## Owns

- meadow area bounds and anchor
- optional path descriptors
- optional focal tree descriptors
- grass, wildflower, rock, mushroom, and tree-line object descriptors
- wind field descriptor
- LOD/object budgets
- render-plan generation
- snapshot/reset/validation surfaces

## Does not own

- browser DOM
- Canvas or WebGL mutation
- requestAnimationFrame loops
- authored experiment copy
- product-specific UI

## Usage

```js
import { createMeadowAreaKit } from "@luminarylabs/nexusrealtime-protokits/meadow-area-kit";

const meadow = createMeadowAreaKit({
  seed: "path-meadow-v1",
  area: { id: "path-meadow", anchor: { x: 0, y: 0, z: 20 }, width: 90, depth: 110 },
  features: {
    path: { enabled: true },
    focalTree: { enabled: true },
    grass: { enabled: true, bladeCount: 3600 },
    flowers: { enabled: true, count: 420 },
    rocks: { enabled: true, count: 46 },
    mushrooms: { enabled: true, count: 34 },
    treeLine: { enabled: true, count: 36 },
    wind: { enabled: true, strength: 0.38 }
  },
  style: { timeOfDay: "golden-hour", renderStyle: "painterly-cel-3d" }
});

const renderPlan = meadow.getRenderPlan({ time: 0 });
```
