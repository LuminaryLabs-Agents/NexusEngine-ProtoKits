import {
  createQuaterniusPackLibraryKitSuite,
  classifyQuaterniusFile
} from "../protokits/quaternius-pack-library-kit/index.js";

function must(condition, message) { if (!condition) throw new Error(message); }
function createFakeWorld() {
  const resources = new Map();
  const key = (resource) => resource?.name ?? resource;
  return {
    hasResource(resource) { return resources.has(key(resource)); },
    getResource(resource) { return resources.get(key(resource)); },
    setResource(resource, value) { resources.set(key(resource), value); return value; }
  };
}
function installKits(kits = []) {
  const engine = { n: {} };
  const world = createFakeWorld();
  for (const kit of kits) { kit.initWorld?.({ engine, world }); kit.install?.({ engine, world }); }
  return { engine, world };
}

const { engine } = installKits(createQuaterniusPackLibraryKitSuite());

must(engine.n.quaterniusPackLibrary.listPacks().length >= 4, "pack library should list Quaternius packs");
must(engine.n.quaterniusPackCatalog.listByFamily("characters").length >= 1, "pack catalog should query character packs");

const receipt = engine.n.quaterniusLicenseReceipt.recordReceipt({ packId: "quaternius-universal-base-characters", sourceUrl: "https://quaternius.com/packs/universalbasecharacters.html", license: "CC0" });
must(engine.n.quaterniusLicenseReceipt.validateReceipt(receipt).ok, "license receipt should validate");

const indexed = engine.n.quaterniusFileIndex.indexFiles(["raw/UniversalBaseCharacters/character.fbx", "public/assets/quaternius/character.glb", "textures/atlas.png"]);
must(indexed.some((file) => file.extension === "glb" && file.safeRuntimePath), "runtime GLB should be classified safe");
must(classifyQuaterniusFile("model.blend").kind === "source-scene", "blend files should classify as source scenes");

const denied = engine.n.quaterniusRuntimePromotion.promoteAsset({ id: "bad", runtimePath: "raw/character.glb", approved: true });
must(!denied.ok && denied.issues.includes("unsafe-runtime-path"), "runtime promotion should reject raw paths");
const promoted = engine.n.quaterniusRuntimePromotion.promoteAsset({ id: "hero", runtimePath: "public/assets/quaternius/hero.glb", approved: true });
must(promoted.ok, "runtime promotion should allow approved public asset paths");

const recipe = engine.n.quaterniusCharacterCreator.createRecipe({ base: { body: "regular-female" }, appearance: { hair: "hair-07", skin: "warm-medium", eyes: "green" }, outfit: { torso: "ranger-tunic-a", legs: "ranger-pants-a", boots: "leather-boots-b", gloves: "fingerless-gloves-a" }, equipment: { rightHand: "short-sword" } });
must(recipe.validation.ok, "character recipe should validate");
must(engine.n.quaterniusOutfitBuilder.buildOutfit(recipe.outfit).validation.ok, "outfit should validate");
must(engine.n.quaterniusEquipmentBuilder.animationMapFor("short-sword").includes("melee-combo"), "equipment should map to animation categories");

const locomotion = engine.n.quaterniusAnimationBank.getLocomotionSet();
must(locomotion.idle && locomotion.walk && locomotion.run, "locomotion set should include idle/walk/run");
must(engine.n.quaterniusAnimationBank.validateRequiredClips().ok, "animation bank should validate required clips");

const rig = engine.n.quaterniusRigProfile.snapshot();
const retarget = engine.n.quaterniusRetargetCheck.checkRetarget(rig, { ...locomotion.walk, tracks: rig.requiredBones });
must(retarget.status === "ready", "complete rig and clip tracks should be ready");

const missing = engine.n.quaterniusRealAssetPlaybackCheck.checkAssets({ character: "", clips: { idle: "", walk: "", run: "" } });
must(missing.status === "missing-assets", "empty asset manifest should report missing assets");

must(engine.n.quaterniusWebgpuCharacterShader.validate().ok, "character shader descriptor should validate");
must(engine.n.quaterniusWebgpuTerrainShader.validate().ok, "terrain shader descriptor should validate");

console.log("quaternius-pack-library-check passed");
