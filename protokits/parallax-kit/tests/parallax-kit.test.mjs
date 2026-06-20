import assert from "node:assert/strict";
import { createParallaxSnapshot } from "../index.js";

const snapshot = createParallaxSnapshot({
  camera: { x: 100, y: 50, trauma: 0.25 },
  layers: [
    { id: "far-clouds", depthPlane: "far", factorX: 0.1, factorY: 0.05, repeat: { x: true, tileWidth: 400 } },
    { id: "gameplay", depthPlane: "gameplay", factorX: 1, factorY: 1 }
  ],
  objects: [
    { id: "cloud-1", visual: { parallaxLayerId: "far-clouds" }, transform: { x: 0, y: 0 } },
    { id: "ledge-1", visual: { parallaxLayerId: "gameplay" }, transform: { x: 10, y: 20 } }
  ],
  elapsed: 2
});

const far = snapshot.layers.find((layer) => layer.id === "far-clouds");
const gameplay = snapshot.layers.find((layer) => layer.id === "gameplay");

assert.ok(far, "far-clouds layer exists");
assert.ok(gameplay, "gameplay layer exists");
assert.ok(Math.abs(far.offset.x) < Math.abs(gameplay.offset.x), "far layer moves less than gameplay layer");
assert.ok(far.tiles.length > 0, "repeat layer produces tiles");
assert.equal(snapshot.validation.ok, true);
