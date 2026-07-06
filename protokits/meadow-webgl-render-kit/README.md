# meadow-webgl-render-kit

`meadow-webgl-render-kit` is a WebGL adapter for render plans emitted by `meadow-area-kit`.

The kit owns reusable meadow WebGL drawing behavior so experiments can stay as short proof routes. It is intentionally a renderer adapter, not renderer-independent simulation logic.

## Owns

- WebGL context setup
- meadow shader program
- meadow render-plan to mesh conversion
- GPU buffer upload and draw calls
- renderer snapshot with vertex/object counts

## Does not own

- meadow area generation
- object placement policy
- browser UI/HUD
- gameplay input
- experiment copy

## Usage

```js
import { createMeadowWebglRenderKit } from "@luminarylabs/nexusrealtime-protokits/meadow-webgl-render-kit";

const renderer = createMeadowWebglRenderKit({ canvas });
renderer.render(meadow.getRenderPlan({ time: performance.now() / 1000 }));
```
