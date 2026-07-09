import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const LIGHTING_DESCRIPTOR_KIT_VERSION = "0.1.0";

export function createLightingSnapshot(options = {}, sky = null) {
  const sunDirection = options.sun?.direction ?? sky?.sun?.direction ?? { x: -0.4, y: 0.7, z: 0.55 };
  const sunColor = options.sun?.color ?? sky?.sun?.color ?? "#fff1bd";
  const fogColor = options.fogColor ?? sky?.atmosphere?.fogColor ?? "#b9ddda";
  return {
    version: LIGHTING_DESCRIPTOR_KIT_VERSION,
    renderer: {
      toneMapping: options.toneMapping ?? "aces",
      exposure: number(options.exposure, 1.05),
      outputColorSpace: options.outputColorSpace ?? "srgb"
    },
    sun: { color: sunColor, intensity: number(options.sun?.intensity, sky?.sun?.intensity ?? 1.5), direction: clone(sunDirection), castShadow: options.sun?.castShadow ?? true },
    hemisphere: { sky: options.hemisphere?.sky ?? "#b9e7ff", ground: options.hemisphere?.ground ?? "#24351f", intensity: number(options.hemisphere?.intensity, 0.75) },
    fill: { color: options.fill?.color ?? "#b7d6ff", intensity: number(options.fill?.intensity, 0.18), direction: options.fill?.direction ?? { x: 0.3, y: 0.4, z: -0.2 } },
    shadows: { enabled: options.shadows?.enabled ?? true, mapSize: number(options.shadows?.mapSize, 2048), distance: number(options.shadows?.distance, 420), bias: number(options.shadows?.bias, -0.00015), normalBias: number(options.shadows?.normalBias, 0.02) },
    fog: { color: fogColor, density: number(options.fog?.density, sky?.atmosphere?.density ?? 0.0012), near: number(options.fog?.near, 80), far: number(options.fog?.far, 3200) }
  };
}

export function createLightingDescriptorKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const LightingDescriptorState = resource(options.resourceName ?? "lightingDescriptor.state");
  const LightingDescriptorUpdated = event("lightingDescriptor.updated");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "lighting-descriptor-kit",
    resources: { LightingDescriptorState },
    events: { LightingDescriptorUpdated },
    provides: ["lighting-descriptor", "renderer-quality-descriptor"],
    initWorld({ world }) { ensureResource(world, LightingDescriptorState, () => createLightingSnapshot(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, LightingDescriptorState, () => createLightingSnapshot(options));
      engine.lightingDescriptor = {
        getState: state,
        syncFromSky(skySnapshot = engine.skyAtmosphere?.snapshot?.()) {
          const next = createLightingSnapshot(options, skySnapshot);
          world.setResource(LightingDescriptorState, next);
          world.emit(LightingDescriptorUpdated, { state: clone(next) });
          return next;
        },
        set(overrides = {}) {
          const next = createLightingSnapshot({ ...options, ...overrides }, engine.skyAtmosphere?.snapshot?.());
          world.setResource(LightingDescriptorState, next);
          world.emit(LightingDescriptorUpdated, { state: clone(next) });
          return next;
        },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: LIGHTING_DESCRIPTOR_KIT_VERSION, purpose: "Warm sun, sky fill, shadows, fog, tone mapping, and renderer descriptor state." }
  });
}
