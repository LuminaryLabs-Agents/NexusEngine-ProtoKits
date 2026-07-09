export const VEGETATION_SCALE_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = 1) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createVegetationScaleDomainKit requires NexusEngine.${key}.`);
  }
}

function descriptorFor(input = {}, config = {}) {
  const scale = Math.max(0.01, toNumber(input.scale, toNumber(config.defaultScale, 1)));
  const trunkHeight = toNumber(input.trunkHeight, toNumber(config.trunkHeight, 2.1)) * scale;
  const trunkRadius = toNumber(input.trunkRadius, toNumber(config.trunkRadius, 0.14)) * scale;
  const crownHeight = toNumber(input.crownHeight, toNumber(config.crownHeight, 2.3)) * scale;
  const crownRadius = toNumber(input.crownRadius, toNumber(config.crownRadius, 0.9)) * scale;
  const clearRadius = Math.max(trunkRadius * 2.5, crownRadius * toNumber(config.crownFootprintRatio, 0.55), toNumber(input.minSpacing, toNumber(config.minSpacing, 0.35)) * scale);
  return {
    id: String(input.id ?? input.speciesId ?? "vegetation"),
    speciesId: String(input.speciesId ?? input.id ?? "vegetation"),
    scale,
    trunkHeight,
    trunkRadius,
    crownHeight,
    crownRadius,
    totalHeight: trunkHeight + crownHeight,
    clearRadius,
    colliderRadius: Math.max(trunkRadius, clearRadius * 0.45)
  };
}

function createState(config = {}) {
  return { version: VEGETATION_SCALE_DOMAIN_KIT_VERSION, id: config.stateId ?? "vegetation-scale-domain", domain: "vegetation-scale", descriptors: [], descriptorsById: {}, lastDescriptor: null };
}

export function createVegetationScaleDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const VegetationScaleState = defineResource(config.resourceName ?? "vegetationScaleDomain.state");
  const VegetationScaleDescribed = defineEvent("vegetationScale.described");

  return defineRuntimeKit({
    id: config.kitId ?? "vegetation-scale-domain-kit",
    provides: ["n:vegetation-scale", "vegetation:scale-descriptor"],
    resources: { VegetationScaleState },
    events: { VegetationScaleDescribed },
    systems: [],
    initWorld({ world }) { world.setResource(VegetationScaleState, createState(config)); },
    install({ engine, world }) {
      engine.vegetationScaleDomain = {
        describe(input = {}) {
          const descriptor = descriptorFor(input, config);
          const state = world.getResource(VegetationScaleState) ?? createState(config);
          const descriptors = [...state.descriptors.filter((item) => item.id !== descriptor.id), descriptor];
          const next = { ...state, descriptors, descriptorsById: Object.fromEntries(descriptors.map((item) => [item.id, item])), lastDescriptor: descriptor };
          world.setResource(VegetationScaleState, next);
          world.emit(VegetationScaleDescribed, descriptor);
          return clone(descriptor);
        },
        getState() { return clone(world.getResource(VegetationScaleState)); }
      };
    },
    metadata: { domain: "vegetation-scale", parentDomain: "vegetation", scope: "atomic-domain", extendsBase: "DomainServiceKit", composes: ["vegetation-archetype-domain-kit", "vegetation-footprint-domain-kit"], ownsLoop: false, purpose: "Maps plant species scale into trunk, crown, collider, and footprint descriptors." }
  });
}

export default createVegetationScaleDomainKit;
