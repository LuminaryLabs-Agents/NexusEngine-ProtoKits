# Contract: Generic Mode Projected Route

## Resource

```txt
genericProjectedRoute.state
```

## Events

```txt
genericProjectedRoute.rebuild
genericProjectedRoute.updated
```

## Input config

```js
{
  routeId: "route-main",
  path: {
    type: "bezier",
    start: { x: 0, y: 0, z: 0 },
    controls: [
      { x: -80, y: 400, z: 0 },
      { x: 80, y: 900, z: 0 }
    ],
    end: { x: 0, y: 1400, z: 0 }
  },
  sampling: {
    count: 18,
    jitterX: 60,
    jitterY: 20,
    seed: "demo"
  },
  projection: {
    method: "plane",
    z: 0
  },
  validation: {
    minSpacing: 45,
    maxEdgeDistance: 180
  }
}
```

## Route output

```js
{
  version,
  id,
  seed,
  path,
  anchors: [],
  edges: [],
  rejected: [],
  metadata: { anchorCount, edgeCount, projection }
}
```

## Determinism

The same config and seed produce the same anchors and edges.
