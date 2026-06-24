import assert from "node:assert/strict";
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
