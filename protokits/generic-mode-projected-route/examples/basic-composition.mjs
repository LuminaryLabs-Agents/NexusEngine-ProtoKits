import { createProjectedRoute } from "../index.js";

const route = createProjectedRoute({
  routeId: "example-route",
  path: {
    type: "bezier",
    start: { x: 0, y: 0, z: 0 },
    controls: [{ x: -80, y: 240, z: 0 }, { x: 80, y: 720, z: 0 }],
    end: { x: 0, y: 960, z: 0 }
  },
  sampling: { count: 10, jitterX: 50, jitterY: 20, seed: "example" },
  projection: { method: "plane", z: 0 },
  validation: { minSpacing: 35, maxEdgeDistance: 140 }
});

console.log(JSON.stringify(route, null, 2));
