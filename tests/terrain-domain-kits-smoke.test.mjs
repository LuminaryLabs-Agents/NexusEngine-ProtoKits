import assert from "node:assert/strict";
import { applyCelShade, quantizeCelTone } from "../protokits/cel-shading-domain-kit/index.js";
import { sampleTerrainMaterialPaint } from "../protokits/terrain-material-paint-domain-kit/index.js";
import { sampleHydrology } from "../protokits/terrain-hydrology-domain-kit/index.js";
import { shapeTerrainHeight } from "../protokits/terrain-shaping-domain-kit/index.js";
import { buildHorizonRings, compressFarHeight, sampleDistanceBand } from "../protokits/terrain-horizon-lod-kit/index.js";

const hydrology = sampleHydrology(120, -80, {
  riverCount: 3,
  riverWidth: 38,
  riverDepth: 20
});

assert.equal(typeof hydrology.riverDistance, "number");
assert.ok(hydrology.riverCarve >= 0);
assert.ok(hydrology.moisture >= 0 && hydrology.moisture <= 1);

const baseHeight = 120;
const shapedNear = shapeTerrainHeight(120, -80, baseHeight, {
  distance: 120,
  band: "near",
  hydrology,
  peakGain: 1.85,
  peakSharpness: 1.5
});
const shapedFar = shapeTerrainHeight(120, -80, baseHeight, {
  distance: 5000,
  band: "far",
  hydrology,
  peakGain: 1.85,
  peakSharpness: 1.5
});

assert.equal(typeof shapedNear, "number");
assert.equal(typeof shapedFar, "number");
assert.notEqual(shapedNear, baseHeight);

const paint = sampleTerrainMaterialPaint({
  x: 120,
  z: -80,
  height: shapedNear,
  slope: 0.32,
  biome: "highland",
  hydrology,
  normal: { x: 0.2, y: 0.86, z: 0.1 }
});
assert.equal(paint.style, "procedural-material-paint");
assert.equal(paint.color.length, 3);
assert.ok(paint.layers.rock >= 0 && paint.layers.rock <= 1);

assert.equal(quantizeCelTone(0.5, [0.25, 0.5, 0.75, 1]), 0.5);
const cel = applyCelShade(paint.color, { normal: { x: 0.2, y: 0.86, z: 0.1 } }, { enabled: true });
assert.equal(cel.length, 3);
assert.ok(cel.every((value) => value >= 0 && value <= 1));

assert.equal(sampleDistanceBand(100, { nearRadius: 900, midRadius: 1800, farRadius: 2600 }), "near");
assert.equal(sampleDistanceBand(1900, { nearRadius: 900, midRadius: 1800, farRadius: 2600 }), "far");
assert.equal(sampleDistanceBand(3000, { nearRadius: 900, midRadius: 1800, farRadius: 2600 }), "horizon");

const compressed = compressFarHeight(300, 12000, {
  midRadius: 1800,
  farRadius: 2600,
  horizonRadius: 22000,
  heightCompressionFar: 0.42,
  heightCompressionHorizon: 0.16,
  silhouettePreservation: 0.78
});
assert.ok(compressed < 300);

const rings = buildHorizonRings({ x: 10, z: -20 }, {
  farRadius: 2600,
  horizonRadius: 22000,
  horizonBands: 4,
  horizonSegments: 72,
  ringThickness: 4200
});
assert.equal(rings.length, 4);
assert.equal(rings[0].center.x, 10);
assert.ok(rings[0].segments >= 12);

console.log("Terrain domain kits smoke passed.");
