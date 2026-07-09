# Generic Mode Projected Route

Generic Mode Projected Route builds a deterministic route from generic path data.

It samples a path, applies deterministic jitter, projects samples onto a surface, validates spacing, and outputs generic anchors plus route edges.

It does not know about climbing, racing, grappling, roads, rivers, tutorials, stamina, or camera logic.

## Install

```js
import { createGenericModeProjectedRoute } from "./index.js";

const engine = NexusEngine.createRealtimeGame({
  kits: [
    createGenericModeProjectedRoute(NexusEngine, {
      routeId: "route-main",
      path: {
        type: "bezier",
        start: { x: 0, y: 0, z: 0 },
        controls: [{ x: -80, y: 400, z: 0 }, { x: 80, y: 900, z: 0 }],
        end: { x: 0, y: 1400, z: 0 }
      },
      sampling: { count: 18, jitterX: 60, jitterY: 20, seed: "demo" },
      projection: { method: "plane", z: 0 },
      validation: { minSpacing: 45, maxEdgeDistance: 180 }
    })
  ]
});
```

## Pure helper

```js
const route = createProjectedRoute(config);
```

Use the helper in experiments when the game-specific adapter wants generated anchors before runtime boot.
