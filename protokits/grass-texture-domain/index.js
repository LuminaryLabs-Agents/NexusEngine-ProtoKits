import {
  clone,
  createDefinitionFactory,
  defineInjectedRuntimeKit,
  ensureResource,
  number
} from "../protokit-core/index.js";

export const GRASS_TEXTURE_DOMAIN_VERSION = "0.1.0";

export function createGrassTextureDescriptor(options = {}) {
  return {
    id: options.id ?? "dense-cozy-grass-texture",
    type: "grass-texture-descriptor",
    version: GRASS_TEXTURE_DOMAIN_VERSION,
    baseColor: options.baseColor ?? "#4f8d4d",
    tipColor: options.tipColor ?? "#9fce64",
    rootColor: options.rootColor ?? "#315f35",
    dryColor: options.dryColor ?? "#c9b86a",
    dryVariation: number(options.dryVariation, 0.18),
    alphaProfile: options.alphaProfile ?? "thin-blade",
    normalHint: options.normalHint ?? "vertical-soft",
    atlas: {
      columns: Math.round(number(options.atlas?.columns, 4)),
      rows: Math.round(number(options.atlas?.rows, 2)),
      variants: Math.round(number(options.atlas?.variants, 8))
    },
    rendererBoundary: { ownsTexture: false, adapterRequired: true }
  };
}

export function createGrassTextureState(options = {}) {
  return {
    id: options.id ?? "grass-texture-domain",
    version: GRASS_TEXTURE_DOMAIN_VERSION,
    descriptor: createGrassTextureDescriptor(options.descriptor ?? options)
  };
}

export function createGrassTextureDomainKit(nexusRealtime = {}, options = {}) {
  const defs = createDefinitionFactory(nexusRealtime);
  const State = defs.resource(options.resourceName ?? "grassTexture.state");
  const initial = () => createGrassTextureState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.kitId ?? "grass-texture-domain",
    resources: { State },
    provides: ["grass:texture-descriptor", "grass:blade-color-ramp", "render:grass-texture-contract"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const getState = () => ensureResource(world, State, initial);
      engine.grassTexture = {
        getState,
        getSnapshot: () => clone(getState()),
        createDescriptor: createGrassTextureDescriptor,
        getDescriptor: () => clone(getState().descriptor),
        reset() { const next = initial(); world.setResource(State, next); return next; }
      };
      engine.n = engine.n || {};
      engine.n.grassTexture = engine.grassTexture;
    },
    metadata: { version: GRASS_TEXTURE_DOMAIN_VERSION, domain: "grass-texture", purpose: "Create renderer-agnostic procedural grass texture descriptors." }
  });
}

export default createGrassTextureDomainKit;
