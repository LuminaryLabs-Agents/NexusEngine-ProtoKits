import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const SCENE_RECIPE_KIT_VERSION = "0.0.1";

export const sceneRecipes = Object.freeze({
  rustyGarage: Object.freeze({ id: "rustyGarage", materials: { floor: "concrete", wall: "scratchedMetal", accent: "rust" }, scatter: { count: 44, types: ["can", "pipe", "panel", "crate"] }, decals: { count: 36, types: ["oil", "crack", "bolt", "paint"] }, fog: { color: "#171411", near: 4, far: 15, density: 1.2 }, lighting: { preset: "garageWarm" } }),
  dustyYard: Object.freeze({ id: "dustyYard", materials: { floor: "dirt", wall: "rust", accent: "scratchedMetal" }, scatter: { count: 72, types: ["tire", "can", "pipe", "panel"] }, decals: { count: 58, types: ["tire", "oil", "bolt"] }, fog: { color: "#1b1712", near: 2.5, far: 13, density: 1.6 }, lighting: { preset: "dustyNoon" } }),
  hazardGate: Object.freeze({ id: "hazardGate", materials: { floor: "hazardPaint", wall: "rust", accent: "oil" }, scatter: { count: 28, types: ["panel", "pipe"] }, decals: { count: 42, types: ["paint", "oil", "crack"] }, fog: { color: "#21100d", near: 3, far: 12, density: 1.8 }, lighting: { preset: "hazardRed" } })
});

export function createSceneRecipe(id = "rustyGarage", overrides = {}) {
  const base = sceneRecipes[id] ?? sceneRecipes.rustyGarage;
  return Object.freeze({ ...base, ...overrides, materials: { ...(base.materials ?? {}), ...(overrides.materials ?? {}) }, scatter: { ...(base.scatter ?? {}), ...(overrides.scatter ?? {}) }, decals: { ...(base.decals ?? {}), ...(overrides.decals ?? {}) }, fog: { ...(base.fog ?? {}), ...(overrides.fog ?? {}) }, lighting: { ...(base.lighting ?? {}), ...(overrides.lighting ?? {}) } });
}

export function composeSceneRecipe(recipes = [], overrides = {}) {
  const list = recipes.map((entry) => typeof entry === "string" ? createSceneRecipe(entry) : entry);
  return Object.freeze(list.reduce((acc, recipe) => createSceneRecipe(recipe.id ?? acc.id, { ...acc, ...recipe, materials: { ...(acc.materials ?? {}), ...(recipe.materials ?? {}) }, scatter: { ...(acc.scatter ?? {}), ...(recipe.scatter ?? {}) }, decals: { ...(acc.decals ?? {}), ...(recipe.decals ?? {}) }, fog: { ...(acc.fog ?? {}), ...(recipe.fog ?? {}) }, lighting: { ...(acc.lighting ?? {}), ...(recipe.lighting ?? {}) } }), createSceneRecipe("rustyGarage", overrides)));
}

export function createSceneRecipeKit(nexusRealtime = {}, options = {}) {
  const kit = { id: options.id ?? "scene-recipe-kit", version: SCENE_RECIPE_KIT_VERSION, sceneRecipes, createSceneRecipe, composeSceneRecipe };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusRealtime, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["scene:recipes", "scene:detail-presets"], bindings: { sceneRecipeKit: kit }, metadata: { version: SCENE_RECIPE_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
