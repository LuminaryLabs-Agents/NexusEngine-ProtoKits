import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const WIND_RESPONSE_KIT_VERSION = "0.1.0";

export function createWindResponseState(options = {}) {
  return {
    version: WIND_RESPONSE_KIT_VERSION,
    grassBend: number(options.grassBend, 0.18),
    crownBend: number(options.crownBend, 0.055),
    trunkBend: number(options.trunkBend, 0.012),
    cloudDrift: number(options.cloudDrift, 1),
    biomeExposure: { meadow: 1.2, highland: 1.4, forest: 0.72, "dense-forest": 0.62, "mixed-forest": 0.86, ...(options.biomeExposure ?? {}) }
  };
}

function defaultWind() { return { direction: { x: 1, y: 0, z: 0 }, strength: 0.25, gust: 0, ripple: 0, phase: 0 }; }
function exposure(state, biome) { return number(state.biomeExposure?.[biome], 1); }

export function describeFoliageWind(instance = {}, partName = "", wind = defaultWind(), state = createWindResponseState()) {
  const kind = instance.kind ?? "tree";
  const crown = /crown|needle|spire|leaf|clump|grass|fern|reed/i.test(partName) ? 1 : 0;
  const scale = kind === "grass" ? state.grassBend : crown ? state.crownBend : state.trunkBend;
  const e = exposure(state, instance.biome);
  const bend = Math.sin(number(wind.phase, 0) + number(instance.scale, 1) * 1.7) * number(wind.strength, 0) * scale * e;
  const twist = Math.cos(number(wind.phase, 0) * 0.74) * number(wind.gust, 0) * scale * 0.35 * e;
  const flutter = Math.sin(number(wind.phase, 0) * 2.2 + number(wind.ripple, 0)) * scale * e;
  return { bend, twist, flutter, phase: wind.phase ?? 0, strength: wind.strength ?? 0, direction: clone(wind.direction ?? { x: 1, y: 0, z: 0 }), tier: kind === "grass" ? "fine" : crown ? "crown" : "trunk" };
}

export function describeCloudWind(cloud = {}, wind = defaultWind(), state = createWindResponseState()) {
  return { dx: number(wind.direction?.x, 1) * (6 + number(wind.strength, 0) * 13) * state.cloudDrift, dz: number(wind.direction?.z, 0) * (4 + number(wind.strength, 0) * 9) * state.cloudDrift, swell: 1 + Math.sin(number(cloud.seed, 0) + number(wind.phase, 0) * 0.23) * 0.035 + number(wind.gust, 0) * 0.035 };
}

export function createWindResponseKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const WindResponseState = resource(options.resourceName ?? "windResponse.state");
  const WindResponseUpdated = event("windResponse.updated");
  const initial = () => createWindResponseState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "wind-response-kit",
    resources: { WindResponseState },
    events: { WindResponseUpdated },
    requires: ["weather:wind-field"],
    provides: ["vegetation:wind-response", "secondary:wind-response", "render:foliage-animation-descriptors", "cloud:wind-response"],
    initWorld({ world }) { ensureResource(world, WindResponseState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, WindResponseState, initial);
      const sample = (position = {}, time = number(world?.__nexusClock?.elapsed, 0)) => engine.windField?.sample?.(position.x, position.y, position.z, time) ?? defaultWind();
      const api = {
        getState: state,
        foliage(instance = {}, partName = "", context = {}) { return describeFoliageWind(instance, partName, context.wind ?? sample(instance, context.time), state()); },
        cloud(cloud = {}, context = {}) { return describeCloudWind(cloud, context.wind ?? sample(cloud.position ?? cloud, context.time), state()); },
        batch(instances = [], context = {}) { return asList(instances).map((instance) => ({ id: instance.id, wind: this.foliage(instance, instance.partName, context) })); },
        set(config = {}) { const next = { ...state(), ...config, biomeExposure: { ...state().biomeExposure, ...(config.biomeExposure ?? {}) } }; world.setResource(WindResponseState, next); world.emit?.(WindResponseUpdated, { state: clone(next) }); return clone(next); },
        snapshot: () => clone(state())
      };
      engine.windResponse = api;
      engine.n ??= {};
      engine.n.windResponse = api;
    },
    metadata: { version: WIND_RESPONSE_KIT_VERSION, purpose: "Renderer-agnostic wind response descriptors for foliage, clouds, and secondary motion." }
  });
}

export default createWindResponseKit;
