import assert from "node:assert/strict";
import { createBiomeFieldKit } from "../protokits/biome-field-kit/index.js";
import { createVegetationArchetypeKit } from "../protokits/vegetation-archetype-kit/index.js";
import { createGroundContactKit } from "../protokits/ground-contact-kit/index.js";
import { createVegetationLodKit } from "../protokits/vegetation-lod-kit/index.js";

const biomeKit = createBiomeFieldKit({}, { data: { fallbackBiome: { id: "plain" }, biomes: [{ id: "forest", placementRules: { density: 0.9 } }], zones: [{ biomeId: "forest", center: { x: 0, z: 0 }, radius: 20, weight: 3 }] } });
assert.equal(biomeKit.biomeAt(0, 0).id, "forest");
assert.equal(biomeKit.getBiomePlacementRules("forest").density, 0.9);
assert.ok(biomeKit.createRuntimeKit().provides.includes("service:biome-query"));

const vegetationKit = createVegetationArchetypeKit({}, { data: { species: [{ id: "tree-a", biomes: { forest: 5 }, scaleRange: [2, 4], insetRange: [0.1, 0.2], materialSlots: { bark: "bark-a" }, lod: { near: "tree-high" } }] } });
const picked = vegetationKit.sampleSpeciesForBiome("forest", () => 0.1);
assert.equal(picked.id, "tree-a");
assert.equal(vegetationKit.getMaterialSlots("tree-a").bark, "bark-a");

const groundKit = createGroundContactKit({}, { inset: 0.12, maxSlope: 0.6 });
const seated = groundKit.seatOnGround({ id: "item", position: { x: 2, z: 3 }, inset: 0.2 }, { heightAt: (x, z) => x + z, normalAt: () => ({ x: 0, y: 1, z: 0 }) });
assert.equal(seated.position.y, 4.8);
assert.equal(seated.groundContact.valid, true);

const lodKit = createVegetationLodKit({}, { levels: [{ id: "near", minDistance: 0, maxDistance: 25, detail: "mesh" }, { id: "far", minDistance: 25, maxDistance: 90, detail: "billboard" }] });
assert.equal(lodKit.selectLod(10).id, "near");
assert.equal(lodKit.selectLod(40).detail, "billboard");

console.log("Environment ProtoKits passed.");
