import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const SKY_ATMOSPHERE_KIT_VERSION = "0.1.0";

export const DEFAULT_SKY_PRESETS = Object.freeze({
  noon: {
    zenith: "#5fb7ff",
    horizon: "#d8f2ff",
    fog: "#b9ddda",
    haze: 0.18,
    sun: { elevation: 48, azimuth: -35, color: "#fff1bd", intensity: 1.55 },
    clouds: [{ id: "high-clouds", altitude: 900, density: 0.16, speed: 0.015, scale: 2.2 }]
  },
  warm: {
    zenith: "#4d8ed8",
    horizon: "#ffd38a",
    fog: "#e0b782",
    haze: 0.32,
    sun: { elevation: 14, azimuth: -52, color: "#ffb45c", intensity: 1.9 },
    clouds: [{ id: "warm-clouds", altitude: 520, density: 0.24, speed: 0.02, scale: 1.8 }]
  }
});

export function computeSunDirection(sun = {}) {
  const elevation = number(sun.elevation, 45) * Math.PI / 180;
  const azimuth = number(sun.azimuth, -35) * Math.PI / 180;
  return {
    x: Math.cos(elevation) * Math.sin(azimuth),
    y: Math.sin(elevation),
    z: Math.cos(elevation) * Math.cos(azimuth)
  };
}

export function createSkySnapshot(options = {}) {
  const presetName = options.preset ?? "noon";
  const base = DEFAULT_SKY_PRESETS[presetName] ?? DEFAULT_SKY_PRESETS.noon;
  const sky = { ...base, ...(options.sky ?? {}) };
  const sun = { ...base.sun, ...(sky.sun ?? {}) };
  return {
    version: SKY_ATMOSPHERE_KIT_VERSION,
    preset: presetName,
    dome: { type: sky.type ?? "gradient-dome", zenith: sky.zenith, horizon: sky.horizon, radius: number(sky.radius, 5000) },
    sun: { ...sun, direction: computeSunDirection(sun), scale: number(sun.scale, 1.4), visible: sky.sunVisible ?? true },
    atmosphere: { fogColor: sky.fog ?? sky.horizon, haze: clamp(sky.haze, 0, 1), density: number(sky.density, 0.0015) },
    clouds: (sky.clouds ?? []).map((layer, index) => ({ id: layer.id ?? `cloud-layer-${index + 1}`, type: layer.type ?? "band", altitude: number(layer.altitude, 600), density: clamp(layer.density, 0, 1), speed: number(layer.speed, 0.01), scale: number(layer.scale, 1), material: layer.material ?? "cloud.soft" }))
  };
}

export function createSkyAtmosphereKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const SkyAtmosphereState = resource(options.resourceName ?? "skyAtmosphere.state");
  const SkyAtmosphereUpdated = event("skyAtmosphere.updated");
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "sky-atmosphere-kit",
    resources: { SkyAtmosphereState },
    events: { SkyAtmosphereUpdated },
    provides: ["sky-atmosphere", "sun-descriptor", "cloud-descriptor"],
    initWorld({ world }) { ensureResource(world, SkyAtmosphereState, () => createSkySnapshot(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, SkyAtmosphereState, () => createSkySnapshot(options));
      engine.skyAtmosphere = {
        getState: state,
        setPreset(preset, sky = {}) {
          const next = createSkySnapshot({ ...options, preset, sky });
          world.setResource(SkyAtmosphereState, next);
          world.emit(SkyAtmosphereUpdated, { preset, state: clone(next) });
          return next;
        },
        getSunDirection: () => clone(state().sun.direction),
        getFogColor: () => state().atmosphere.fogColor,
        snapshot: () => clone(state())
      };
    },
    metadata: { version: SKY_ATMOSPHERE_KIT_VERSION, purpose: "Renderer-agnostic sky, sun, fog, and cloud descriptors." }
  });
}
