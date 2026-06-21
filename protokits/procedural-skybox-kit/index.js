import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const PROCEDURAL_SKYBOX_KIT_VERSION = "0.1.0";

export function createProceduralSkyboxState(options = {}) {
  return {
    version: PROCEDURAL_SKYBOX_KIT_VERSION,
    timeOfDay: clamp(number(options.timeOfDay, 0.32), 0, 1),
    colors: { top: options.colors?.top ?? "#2762a4", mid: options.colors?.mid ?? "#8fcdf3", horizon: options.colors?.horizon ?? "#f1c98b", night: options.colors?.night ?? "#07111f" },
    haze: number(options.haze, 0.18),
    starIntensity: number(options.starIntensity, 0.85),
    exposure: number(options.exposure, 1.05),
    cloudNoise: { scale: number(options.cloudNoise?.scale, 8), density: number(options.cloudNoise?.density, 0.34), speed: number(options.cloudNoise?.speed, 0.012) }
  };
}

function unit(v) { const l = Math.hypot(number(v.x), number(v.y), number(v.z)) || 1; return { x: number(v.x) / l, y: number(v.y) / l, z: number(v.z) / l }; }

export function createProceduralSkyboxDescriptor(state = createProceduralSkyboxState(), timeDescriptor = null) {
  const timeOfDay = clamp(number(timeDescriptor?.normalizedTime, state.timeOfDay), 0, 1);
  const angle = timeOfDay * Math.PI * 2 - Math.PI * 0.45;
  const sunDirection = unit(timeDescriptor?.sunDirection ?? { x: Math.cos(angle) * -0.55, y: Math.sin(angle) * 0.85 + 0.16, z: Math.sin(angle) * 0.38 });
  const moonDirection = unit(timeDescriptor?.moonDirection ?? { x: -sunDirection.x, y: -sunDirection.y, z: -sunDirection.z });
  const daylight = clamp((sunDirection.y + 0.12) / 0.74, 0, 1);
  return { version: PROCEDURAL_SKYBOX_KIT_VERSION, timeOfDay, phase: timeDescriptor?.phase ?? "sky", daylight, sunDirection, moonDirection, colors: clone(state.colors), haze: state.haze, starIntensity: state.starIntensity * (1 - daylight), exposure: state.exposure, cloudNoise: clone(state.cloudNoise) };
}

export function createProceduralSkyboxKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const ProceduralSkyboxState = resource(options.resourceName ?? "proceduralSkybox.state");
  const ProceduralSkyboxUpdated = event("proceduralSkybox.updated");
  const initial = () => createProceduralSkyboxState(options);
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "procedural-skybox-kit",
    resources: { ProceduralSkyboxState },
    events: { ProceduralSkyboxUpdated },
    provides: ["sky:procedural-skybox", "sky:skybox", "lighting:sun-moon-cycle", "render:sky-descriptor"],
    initWorld({ world }) { ensureResource(world, ProceduralSkyboxState, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, ProceduralSkyboxState, initial);
      const api = { getState: state, getDescriptor(time = engine.timeOfDay?.describe?.()) { return createProceduralSkyboxDescriptor(state(), time); }, setTimeOfDay(value) { const next = { ...state(), timeOfDay: clamp(number(value, 0), 0, 1) }; world.setResource(ProceduralSkyboxState, next); world.emit?.(ProceduralSkyboxUpdated, { state: clone(next), descriptor: createProceduralSkyboxDescriptor(next) }); return clone(next); }, set(config = {}) { const next = { ...state(), ...config, colors: { ...state().colors, ...(config.colors ?? {}) }, cloudNoise: { ...state().cloudNoise, ...(config.cloudNoise ?? {}) } }; world.setResource(ProceduralSkyboxState, next); world.emit?.(ProceduralSkyboxUpdated, { state: clone(next), descriptor: this.getDescriptor() }); return clone(next); }, snapshot: () => clone(state()) };
      engine.proceduralSkybox = api;
      engine.n ??= {};
      engine.n.proceduralSkybox = api;
    },
    metadata: { version: PROCEDURAL_SKYBOX_KIT_VERSION, purpose: "Renderer-agnostic procedural skybox, sun, moon, star, haze, and cloud-noise descriptors." }
  });
}

export default createProceduralSkyboxKit;
