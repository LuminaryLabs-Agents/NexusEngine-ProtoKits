import assert from "node:assert/strict";
import {
  createHeroTreeDomainKit,
  createPathMeadowCel3DStyleKit,
  createPathMeadowAtmosphereKit,
  createPathMeadowCloudLayerKit,
  createPathMeadowCompositionKit,
  createPathMeadowCompositionKits,
  createPathMeadowDataStreamKit,
  createPathMeadowDescriptorStreamPacket,
  createPathMeadowDepthCueKit,
  createPathMeadowEntityGenerationKit,
  createPathMeadowForegroundClusterKit,
  createPathMeadowGrassKit,
  createPathMeadowMushroomKit,
  createPathMeadowPlayerScaleKit,
  createPathMeadowRouteKit,
  createPathMeadowRockKit,
  createPathMeadowScatterKit,
  createPathMeadowTreeLineKit,
  validatePathMeadowDescriptorStreamPacket,
  createPathMeadowVisualPaletteKit,
  createPathMeadowWildflowerKit
} from "../protokits/path-meadow-composition-kit/index.js";

const route = createPathMeadowRouteKit({}, {});
assert.ok(route.getPathDescriptor().points.length >= 4);
assert.ok(route.sample(0.5).z > route.sample(0).z);
assert.ok(route.createRuntimeKit().provides.includes("route:visual-path"));
assert.ok(route.getPathDescriptor().texture.pebbleCount >= 24);

const tree = createHeroTreeDomainKit({}, {});
assert.equal(tree.getTreeDescriptor().type, "hero-tree");
assert.ok(tree.getTreeDescriptor().canopy.lobeCount >= 7);
assert.ok(tree.getTreeDescriptor().canopy.leafClusterCount >= 20);
assert.ok(tree.getTreeDescriptor().canopy.layerCount >= 3);
assert.ok(tree.getTreeDescriptor().trunk.barkLineCount >= 8);
assert.ok(tree.getTreeDescriptor().trunk.rootCount >= 4);
assert.ok(tree.getTreeDescriptor().shadow.dappleCount >= 12);

const player = createPathMeadowPlayerScaleKit({}, {});
assert.equal(player.getPlayerDescriptor().type, "third-person-scale-actor");
assert.ok(player.getPlayerDescriptor().interaction.inspectable);
assert.ok(player.createRuntimeKit().provides.includes("actor:scale-reference"));

const scatter = createPathMeadowScatterKit({}, { seed: "test-path-meadow", flowerCount: 32, rockCount: 8, mushroomCount: 4 });
const scatterDescriptor = scatter.getScatterDescriptor();
assert.equal(scatterDescriptor.flowers.length, 32);
assert.equal(scatterDescriptor.rocks.length, 8);
assert.equal(scatterDescriptor.mushrooms.length, 4);
assert.ok(scatterDescriptor.foregroundClusters.length > 4);
assert.ok(scatterDescriptor.grass.bladeCount > 1000);

assert.ok(createPathMeadowGrassKit({}, {}).getGrassDescriptor().bladeCount > 100);
assert.ok(createPathMeadowForegroundClusterKit({}, { foregroundClusterCount: 8 }).getForegroundClusterDescriptors().length === 8);
assert.ok(createPathMeadowWildflowerKit({}, { flowerCount: 12 }).getWildflowerDescriptors().length === 12);
assert.ok(createPathMeadowRockKit({}, { rockCount: 7 }).getRockDescriptors().length === 7);
assert.ok(createPathMeadowMushroomKit({}, { mushroomCount: 5 }).getMushroomDescriptors().length === 5);
assert.ok(createPathMeadowTreeLineKit({}, { treeLineCount: 9 }).getTreeLineDescriptors().length === 9);

const atmosphere = createPathMeadowAtmosphereKit({}, {});
assert.equal(atmosphere.getAtmosphereDescriptor().type, "golden-hour-atmosphere");
assert.ok(atmosphere.getAtmosphereDescriptor().rays.count >= 3);
assert.ok(atmosphere.getAtmosphereDescriptor().clouds.length > 0);
assert.ok(atmosphere.getAtmosphereDescriptor().hazeBands.length > 0);

const cloudLayer = createPathMeadowCloudLayerKit({}, {});
assert.ok(cloudLayer.getCloudDescriptors().length > 0);
assert.ok(cloudLayer.createRuntimeKit().provides.includes("atmosphere:cloud-layer-descriptors"));

const visualPalette = createPathMeadowVisualPaletteKit({}, {});
assert.equal(visualPalette.getVisualPaletteDescriptor().type, "painterly-meadow-visual-palette");
assert.ok(visualPalette.getVisualPaletteDescriptor().path.near.includes("rgba"));
assert.ok(visualPalette.createRuntimeKit().provides.includes("visual:painterly-palette"));

const depthCue = createPathMeadowDepthCueKit({}, {});
assert.equal(depthCue.getDepthCueDescriptor().type, "meadow-depth-cue-descriptors");
assert.ok(depthCue.getDepthCueDescriptor().foregroundFrame.bladeCount >= 12);
assert.ok(depthCue.createRuntimeKit().provides.includes("visual:depth-cues"));

const cel3D = createPathMeadowCel3DStyleKit({}, {});
assert.equal(cel3D.getCel3DStyleDescriptor().type, "cel-shaded-3d-style");
assert.ok(cel3D.getCel3DStyleDescriptor().light.bands.length >= 3);
assert.ok(cel3D.getCel3DStyleDescriptor().outline.heroTreeBoost > 0);
assert.ok(cel3D.getCel3DStyleDescriptor().atmosphereGrade.sunGlow.includes("rgba"));
assert.ok(cel3D.createRuntimeKit().provides.includes("visual:cel-shaded-3d-style"));

const entityGeneration = createPathMeadowEntityGenerationKit({}, { seed: "test-path-meadow" });
assert.equal(entityGeneration.getEntityGenerationDescriptor().type, "entity-generation-ratios");
assert.ok(entityGeneration.getEntityGenerationDescriptor().ratios.grass.target >= 600);
assert.ok(entityGeneration.createRuntimeKit().provides.includes("generation:entity-ratios"));

const compositionKit = createPathMeadowCompositionKit({}, { seed: "test-path-meadow" });
const composition = compositionKit.getComposition();
const breakdown = compositionKit.getElementBreakdown();
assert.equal(composition.heroTree.type, "hero-tree");
assert.equal(breakdown.some((entry) => entry.id === "hero-tree"), true);
assert.equal(breakdown.some((entry) => entry.id === "winding-path"), true);
assert.equal(breakdown.some((entry) => entry.id === "path-texture"), true);
assert.equal(breakdown.find((entry) => entry.id === "foreground-clusters").kit, "path-meadow-foreground-cluster-kit");
assert.equal(breakdown.find((entry) => entry.id === "player-silhouette").kit, "path-meadow-player-scale-kit");
assert.equal(breakdown.find((entry) => entry.id === "visual-palette").kit, "path-meadow-visual-palette-kit");
assert.equal(breakdown.find((entry) => entry.id === "depth-cues").kit, "path-meadow-depth-cue-kit");
assert.equal(breakdown.find((entry) => entry.id === "cel-3d-style").kit, "path-meadow-cel-3d-style-kit");
assert.equal(breakdown.find((entry) => entry.id === "entity-generation-ratios").kit, "path-meadow-entity-generation-kit");
assert.equal(compositionKit.validateComposition(composition).passed, true);

const streamPacket = createPathMeadowDescriptorStreamPacket({ snapshot: { composition }, provides: ["stream:path-meadow-descriptors"] });
assert.equal(validatePathMeadowDescriptorStreamPacket(streamPacket).passed, true);

const dataStream = createPathMeadowDataStreamKit({}, { seed: "test-path-meadow" });
const packetA = dataStream.getStreamPacket();
const packetB = dataStream.getStreamPacket();
assert.deepEqual(packetA, packetB);
assert.equal(dataStream.validateStreamPacket(packetA).passed, true);
assert.equal(dataStream.prepare().accepted, true);
assert.equal(dataStream.commit(packetA).accepted, true);
assert.equal(dataStream.rollback().accepted, true);
assert.deepEqual(dataStream.reset(), packetA);
assert.ok(dataStream.createRuntimeKit().provides.includes("stream:path-meadow-descriptors"));

const bundle = createPathMeadowCompositionKits({}, { seed: "bundle-path-meadow" });
assert.equal(bundle.composition.validateComposition().passed, true);
assert.ok(bundle.heroTree.getTreeDescriptor().interaction.inspectable);
assert.ok(bundle.player.getPlayerDescriptor().interaction.inspectable);
assert.ok(bundle.foregroundClusters.getForegroundClusterDescriptors().length > 4);
assert.ok(bundle.cloudLayer.getCloudDescriptors().length > 0);
assert.ok(bundle.visualPalette.getVisualPaletteDescriptor().post.grainAlpha > 0);
assert.ok(bundle.depthCue.getDepthCueDescriptor().focalLight.treeRimStrength > 0);
assert.ok(bundle.cel3D.getCel3DStyleDescriptor().outline.enabled);
assert.ok(bundle.entityGeneration.getEntityGenerationDescriptor().ratios.heroTree.target === 1);
assert.equal(bundle.dataStream.validateStreamPacket(bundle.dataStream.getStreamPacket()).passed, true);
assert.ok(bundle.treeLine.getTreeLineDescriptors().length > 4);

console.log("path-meadow-composition-kit tests passed.");
