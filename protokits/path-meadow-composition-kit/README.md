# Path Meadow Composition Kit

Renderer-agnostic descriptor kits for a central-tree meadow proof scene.

## Target

```txt
central hero tree
winding dirt path
foreground player silhouette
dense grass and wildflowers
rocks and mushrooms
distant tree line
golden-hour sun, haze, hills, and sky
```

## Domain Kits

```txt
path-meadow-route-kit
  owns route/path descriptors and sampling

hero-tree-domain-kit
  owns the central tree trunk, canopy, roots, and interaction anchor

path-meadow-scatter-kit
  owns seeded grass, flowers, rocks, mushrooms, and background tree-line descriptors

path-meadow-grass-kit
  owns grass field budget and blade style descriptors

path-meadow-wildflower-kit
  owns individual wildflower placement descriptors

path-meadow-rock-kit
  owns path-edge rock and boulder descriptors

path-meadow-mushroom-kit
  owns near-ground mushroom descriptors

path-meadow-tree-line-kit
  owns distant tree-line descriptors

path-meadow-atmosphere-kit
  owns sun, haze, sky gradient, hills, and exposure descriptors

path-meadow-composition-kit
  composes the scene target, camera, player silhouette, and element breakdown
```

## Boundary

This kit does not render. It emits serializable descriptors that an experiment can draw with Canvas, WebGL, Three.js, or another host renderer.

## Example

```js
import { createPathMeadowCompositionKit } from "@luminarylabs/nexusengine-protokits/path-meadow-composition-kit";

const kit = createPathMeadowCompositionKit(null, { seed: "hero-tree-meadow" });
const composition = kit.getComposition();
const breakdown = kit.getElementBreakdown();
const validation = kit.validateComposition(composition);
```
