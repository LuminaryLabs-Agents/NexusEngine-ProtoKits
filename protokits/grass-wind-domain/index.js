import {
  clone,
  createDefinitionFactory,
  defineInjectedRuntimeKit,
  ensureResource,
  number
} from "../protokit-core/index.js";

export const GRASS_WIND_DOMAIN_VERSION = "0.1.0";

function normalize2(value = {}, fallback = { x: 0.8, z: 0.25 }) {
  const x = number(value.x, number(fallback.x, 0.8));
  const z = number(value.z, number(fallback.z, 0.25));
  const len = Math.hypot(x, z) || 1;
  return { x: x / len, z: z / len };
}

export function createGrassWindDescriptor(options = {}) {
  return {
    id: options.id ?? "dense-cozy-grass-wind",
    type: "grass-wind-descriptor",
    version: GRASS_WIND_DOMAIN_VERSION,
    direction: normalize2(options.direction, { x: 0.8, z: 0.25 }),
    baseSway: number(options.baseSway, 0.16),
    gustStrength: number(options.gustStrength, 0.34),
    gustFrequency: number(options.gustFrequency, 0.08),
    phaseSeed: String(options.phaseSeed ?? "cozy-island-grass"),
    treeShelter: number(options.treeShelter, 0.22),
    pathShelter: number(options.pathShelter, 0.08),
    rendererBoundary: { shaderDriven: true, ownsShader: false }
  };
}

export function createGrassWindState(options = {}) {
  return {
    id: options.id ?? "grass-wind-domain",
    version: GRASS_WIND_DOMAIN_VERSION,
    descriptor: createGrassWindDescriptor(options.descriptor ?? options)
  };
}

export function createGrassWindDomainKit(nexusEngine = {}, options = {}) {
  const defs = createDefinitionFactory(nexusEngine);
  const State = defs.resource(options.resourceName ?? "grassWind.state");
  const initial = () => createGrassWindState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.kitId ?? "grass-wind-domain",
    resources: { State },
    provides: ["grass:wind-field", "grass:sway-phase", "render:grass-wind-descriptor"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const getState = () => ensureResource(world, State, initial);
      engine.grassWind = {
        getState,
        getSnapshot: () => clone(getState()),
        createDescriptor: createGrassWindDescriptor,
        getDescriptor: () => clone(getState().descriptor),
        reset() { const next = initial(); world.setResource(State, next); return next; }
      };
      engine.n = engine.n || {};
      engine.n.grassWind = engine.grassWind;
    },
    metadata: { version: GRASS_WIND_DOMAIN_VERSION, domain: "grass-wind", purpose: "Create shader-friendly grass wind descriptors for sway, gusts, and per-patch phase offsets." }
  });
}

export default createGrassWindDomainKit;
