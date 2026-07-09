# meadow-webgl-render-kit

`meadow-webgl-render-kit` is a WebGL adapter for render plans emitted by `meadow-area-kit`.

The kit owns reusable meadow WebGL drawing behavior so experiments can stay as short proof routes. It is intentionally a renderer adapter, not renderer-independent simulation logic.

## Owns

- WebGL context setup
- meadow shader program
- meadow render-plan to mesh conversion
- unified terrain-surface rendering for meadow/path ground
- terrain color variation, path blending, ruts, soft shoulders, and pebble bands
- GPU buffer upload and draw calls
- renderer snapshot with vertex/object counts

## Does not own

- meadow area generation
- object placement policy
- browser UI/HUD
- gameplay input
- experiment copy

## Terrain path behavior

The renderer now treats the path as a layer inside a meadow terrain surface instead of drawing it as a separate hard-edged ribbon.

The renderer synthesizes a terrain surface from the render plan when one is not provided, then blends:

- base meadow color
- warm/shaded grass variation
- path center color
- soft shoulder color
- rut depressions
- scattered pebble bands

## Usage

```js
import { createMeadowWebglRenderKit } from "@luminarylabs/nexusengine-protokits/meadow-webgl-render-kit";

const renderer = createMeadowWebglRenderKit({ canvas });
renderer.render(meadow.getRenderPlan({ time: performance.now() / 1000 }));
```
