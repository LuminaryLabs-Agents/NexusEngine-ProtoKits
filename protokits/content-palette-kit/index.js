import { asList, byId, clone, createDefinitionFactory, createSeededRandom, defineInjectedRuntimeKit, ensureResource, scopedSeed, weightedChoice } from "../protokit-core/index.js";

export const CONTENT_PALETTE_KIT_VERSION = "0.0.1";

export function normalizePalette(palette = {}, index = 0) {
  const id = palette.id ?? `palette-${index + 1}`;
  return {
    id,
    kind: palette.kind ?? palette.category ?? "generic",
    theme: palette.theme ?? "default",
    seed: palette.seed ?? id,
    tags: asList(palette.tags),
    variants: asList(palette.variants).map((variant, variantIndex) => ({
      id: variant.id ?? `${id}-variant-${variantIndex + 1}`,
      kind: variant.kind ?? palette.kind ?? "generic",
      weight: variant.weight ?? 1,
      tags: asList(variant.tags),
      transform: variant.transform ?? {},
      visual: variant.visual ?? {},
      sockets: variant.sockets ?? {},
      metadata: variant.metadata ?? {},
      ...variant
    })),
    metadata: palette.metadata ?? {}
  };
}

function createInitialState(options = {}) {
  const palettes = asList(options.palettes ?? options.palette).map(normalizePalette);
  return { version: CONTENT_PALETTE_KIT_VERSION, seed: options.seed ?? "content-palette", mode: options.mode ?? "hybrid", palettes: byId(palettes), picks: [], lastPick: null };
}

function findPalette(state, request = {}) {
  const palettes = Object.values(state.palettes ?? {});
  if (request.paletteId && state.palettes?.[request.paletteId]) return state.palettes[request.paletteId];
  const key = request.kind ?? request.category ?? request.palette;
  const theme = request.theme;
  return palettes.find((palette) => (!key || palette.id === key || palette.kind === key || palette.tags?.includes(key)) && (!theme || palette.theme === theme || palette.tags?.includes(theme))) ?? palettes[0] ?? null;
}

export function pickFromContentPalette(state = {}, request = {}) {
  const palette = findPalette(state, request);
  if (!palette) return null;
  const slot = request.slot ?? request.index ?? state.picks?.length ?? 0;
  const rng = createSeededRandom(scopedSeed(state.seed, palette.seed, request.seed, palette.id, slot));
  let variants = asList(palette.variants);
  if (request.tag) variants = variants.filter((variant) => asList(variant.tags).includes(request.tag));
  const variant = weightedChoice(variants, rng);
  return variant ? { paletteId: palette.id, slot, seed: rng.seed, variant: clone(variant) } : null;
}

export function createContentPaletteKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const ContentPaletteState = resource(options.resourceName ?? "contentPalette.state");
  const ContentPalettePicked = event("contentPalette.picked");
  const ContentPaletteRegistered = event("contentPalette.registered");
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "content-palette-kit",
    resources: { ContentPaletteState },
    events: { ContentPalettePicked, ContentPaletteRegistered },
    provides: ["content-palette"],
    initWorld({ world }) { ensureResource(world, ContentPaletteState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, ContentPaletteState, () => createInitialState(options));
      engine.contentPalette = {
        getState: state,
        registerPalette(palette) {
          const next = state();
          const normalized = normalizePalette(palette, Object.keys(next.palettes).length);
          next.palettes[normalized.id] = normalized;
          world.setResource(ContentPaletteState, next);
          world.emit(ContentPaletteRegistered, { palette: normalized });
          return normalized;
        },
        pick(request = {}) {
          const next = state();
          const pick = pickFromContentPalette(next, request);
          if (!pick) return null;
          next.picks.push({ ...pick, request });
          next.lastPick = pick;
          world.setResource(ContentPaletteState, next);
          world.emit(ContentPalettePicked, pick);
          return pick.variant;
        },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: CONTENT_PALETTE_KIT_VERSION, purpose: "Seeded/static/hybrid content palette selection." }
  });
}
