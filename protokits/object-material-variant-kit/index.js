import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const OBJECT_MATERIAL_VARIANT_KIT_VERSION = "0.1.0";

export function createObjectMaterialVariantState(options = {}) {
  return { version: OBJECT_MATERIAL_VARIANT_KIT_VERSION, season: options.season ?? "summer", wetness: number(options.wetness, 0), biomeTintStrength: number(options.biomeTintStrength, 0.12), materialSlots: { bark: "tree.bark", leaf: "tree.foliage", grass: "grass.blade", rock: "rock.surface", ...(options.materialSlots ?? {}) } };
}

function tintForBiome(biome = "mixed-forest") {
  if (biome === "meadow") return "#6fa447";
  if (biome === "highland") return "#8a9271";
  if (biome === "dense-forest") return "#1f4d2c";
  return "#3f7d3e";
}

export function describeObjectMaterialVariant(asset = {}, instance = {}, context = {}, state = createObjectMaterialVariantState()) {
  const slots = { ...state.materialSlots, ...(asset.materialSlots ?? asset.materials ?? {}) };
  const biome = instance.biome ?? context.biome ?? asset.biomes?.[0] ?? "mixed-forest";
  return { assetId: asset.id ?? instance.assetId ?? null, slots: clone(slots), season: context.season ?? state.season, wetness: number(context.wetness, state.wetness), tint: { color: tintForBiome(biome), strength: state.biomeTintStrength }, variationKey: `${biome}:${context.season ?? state.season}:${Math.floor(number(instance.scale, 1) * 100)}` };
}

export function createObjectMaterialVariantKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "objectMaterialVariant.state");
  const Updated = event("objectMaterialVariant.updated");
  const initial = () => createObjectMaterialVariantState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "object-material-variant-kit",
    resources: { State },
    events: { Updated },
    provides: ["object:material-variants", "render:material-variant-descriptors"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const api = { getState: state, describe(asset = {}, instance = {}, context = {}) { return describeObjectMaterialVariant(asset, instance, context, state()); }, set(config = {}) { const next = { ...state(), ...config, materialSlots: { ...state().materialSlots, ...(config.materialSlots ?? {}) } }; world.setResource(State, next); world.emit?.(Updated, { state: clone(next) }); return clone(next); }, snapshot: () => clone(state()) };
      engine.objectMaterialVariant = api;
      engine.n ??= {};
      engine.n.objectMaterialVariant = api;
    },
    metadata: { version: OBJECT_MATERIAL_VARIANT_KIT_VERSION, purpose: "Renderer-agnostic material slot, tint, season, and wetness descriptors for world objects." }
  });
}

export default createObjectMaterialVariantKit;
