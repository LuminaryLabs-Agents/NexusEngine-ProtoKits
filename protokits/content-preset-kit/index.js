import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, scopedSeed } from "../protokit-core/index.js";

export const CONTENT_PRESET_KIT_VERSION = "0.2.0";

const DEFAULT_OBJECT_PROOF_RECIPES = Object.freeze({
  "banana-fidelity-proof": ["data-registry-kit", "content-palette-kit", "layered-object-kit", "material-palette-kit", "visual-pipeline-kit", "render-layer-kit", "performance-budget-kit", "lighting-descriptor-kit", "deterministic-replay-harness"],
  "coin-readability-proof": ["data-registry-kit", "layered-object-kit", "material-palette-kit", "render-layer-kit", "camera-cinematic-maker-kit", "performance-budget-kit", "checkpoint-volume-kit", "diegetic-feedback-kit", "deterministic-replay-harness"],
  "arcade-button-material-proof": ["data-registry-kit", "layered-object-kit", "action-input-kit", "material-palette-kit", "diegetic-feedback-kit", "audio-event-feedback-maker-kit", "render-layer-kit", "performance-budget-kit", "deterministic-replay-harness"],
  "wooden-crate-wear-proof": ["data-registry-kit", "content-palette-kit", "layered-object-kit", "material-palette-kit", "visual-pipeline-kit", "instanced-render-kit", "performance-budget-kit", "deterministic-replay-harness"],
  "potion-glass-material-proof": ["data-registry-kit", "layered-object-kit", "material-palette-kit", "lighting-descriptor-kit", "visual-pipeline-kit", "render-layer-kit", "diegetic-feedback-kit", "audio-event-feedback-maker-kit", "performance-budget-kit", "deterministic-replay-harness"]
});

function createInitialState(options = {}) {
  return {
    version: CONTENT_PRESET_KIT_VERSION,
    presets: { ...(options.presets ?? {}) },
    recipes: { ...DEFAULT_OBJECT_PROOF_RECIPES, ...(options.recipes ?? {}) },
    bundles: {},
    lastBundleId: null
  };
}

function normalizePreset(preset = {}, context = {}) {
  const id = preset.id ?? preset.packetRef ?? context.id ?? `preset-${context.index + 1}`;
  return {
    id,
    packetRef: preset.packetRef ?? id,
    seed: preset.seed ?? scopedSeed(context.seed ?? "content-preset", id),
    status: preset.status ?? "ready-for-prototype",
    objectSpec: clone(preset.objectSpec ?? preset.spec ?? {}),
    kitRecipe: asList(preset.kitRecipe ?? preset.kits ?? context.recipe),
    proofFiles: asList(preset.proofFiles),
    metadata: clone(preset.metadata ?? {}),
    ...clone(preset),
    id
  };
}

export function createContentPresetKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const ContentPresetState = resource(options.resourceName ?? "contentPreset.state");
  const PresetRegistered = event("contentPreset.registered");
  const BundleComposed = event("contentPreset.bundleComposed");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? options.kitId ?? "content-preset-kit",
    resources: { ContentPresetState },
    events: { PresetRegistered, BundleComposed },
    provides: ["content:presets", "proof-recipes", "packet-preset-bundles"],
    initWorld({ world }) { ensureResource(world, ContentPresetState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, ContentPresetState, () => createInitialState(options));
      const publish = (next) => { world.setResource(ContentPresetState, next); return next; };
      engine[options.apiName ?? "contentPreset"] = {
        getState: state,
        registerPreset(preset = {}) {
          const next = state();
          const recipe = next.recipes[preset.packetRef ?? preset.id] ?? preset.kitRecipe;
          const normalized = normalizePreset(preset, { seed: options.seed, recipe, index: Object.keys(next.presets).length });
          next.presets[normalized.id] = normalized;
          publish(next);
          world.emit(PresetRegistered, { preset: clone(normalized) });
          return clone(normalized);
        },
        recipe(packetRef) { return asList(state().recipes?.[packetRef]); },
        composeBundle(packetRef, overrides = {}) {
          const next = state();
          const preset = next.presets[packetRef] ?? normalizePreset({ id: packetRef, packetRef, ...overrides }, { seed: options.seed, recipe: next.recipes[packetRef] });
          const bundle = {
            id: overrides.id ?? `${packetRef}:bundle`,
            packetRef,
            seed: overrides.seed ?? preset.seed,
            preset: clone(preset),
            kitRecipe: asList(overrides.kitRecipe ?? preset.kitRecipe ?? next.recipes[packetRef]),
            objectSpec: clone(overrides.objectSpec ?? preset.objectSpec),
            composition: asList(overrides.composition ?? []).map(clone),
            metadata: clone(overrides.metadata ?? {})
          };
          next.bundles[bundle.id] = bundle;
          next.lastBundleId = bundle.id;
          publish(next);
          world.emit(BundleComposed, { bundle: clone(bundle) });
          return clone(bundle);
        },
        listPresets() { return Object.values(state().presets).map(clone); },
        listBundles() { return Object.values(state().bundles).map(clone); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: CONTENT_PRESET_KIT_VERSION, purpose: "Bounded preset assembly container for packet-driven proof recipes and object proof bundles." }
  });
}

export default createContentPresetKit;
