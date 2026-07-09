import { clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const PROCEDURAL_CLOUD_LAYER_KIT_VERSION = "0.1.0";

export function createProceduralCloudLayerState(options = {}) {
  return { version: PROCEDURAL_CLOUD_LAYER_KIT_VERSION, seed: String(options.seed ?? "cloud-layer"), count: Math.max(0, number(options.count, 96)), radius: number(options.radius, 1500), altitude: number(options.altitude, 320), opacity: number(options.opacity, 0.34), descriptors: [] };
}

export function generateCloudDescriptors(position = {}, state = createProceduralCloudLayerState()) {
  const items = [];
  const baseX = number(position.x, 0);
  const baseZ = number(position.z, 0);
  for (let i = 0; i < state.count; i += 1) {
    const a = i * 12.9898 + state.seed.length;
    const r = Math.sin(a) * 43758.5453;
    const u = r - Math.floor(r);
    const v = Math.sin(a * 1.7) * 43758.5453;
    const w = v - Math.floor(v);
    const size = 35 + ((u * 89) % 85);
    items.push({ id: `cloud-${i}`, position: { x: baseX + (u - 0.5) * state.radius * 2, y: state.altitude + Math.sin(i) * 70, z: baseZ + (w - 0.5) * state.radius * 2 }, scale: { x: size, y: size * 0.16, z: size * 0.72 }, opacity: state.opacity, seed: i, layer: "high" });
  }
  return items;
}

export function createProceduralCloudLayerKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "proceduralCloudLayer.state");
  const Updated = event("proceduralCloudLayer.updated");
  const initial = () => createProceduralCloudLayerState(options);
  return defineInjectedRuntimeKit(nexusEngine, { id: options.id ?? "procedural-cloud-layer-kit", resources: { State }, events: { Updated }, requires: ["weather:wind-field"], provides: ["sky:cloud-layers", "cloud:layer-descriptors", "render:cloud-descriptors"], initWorld({ world }) { ensureResource(world, State, initial); }, install({ engine, world }) { const state = () => ensureResource(world, State, initial); const api = { getState: state, generateAround(position = {}) { const next = { ...state(), descriptors: generateCloudDescriptors(position, state()) }; world.setResource(State, next); world.emit?.(Updated, { state: clone(next) }); return clone(next); }, getDescriptors(context = {}) { const d = state().descriptors.length ? state().descriptors : generateCloudDescriptors(context.position ?? {}, state()); return d.map((cloud) => ({ ...clone(cloud), drift: engine.windResponse?.cloud?.(cloud, context) ?? { dx: 0, dz: 0, swell: 1 } })); }, snapshot: () => clone(state()) }; engine.proceduralCloudLayer = api; engine.n ??= {}; engine.n.proceduralCloudLayer = api; }, metadata: { version: PROCEDURAL_CLOUD_LAYER_KIT_VERSION, purpose: "Renderer-agnostic procedural cloud layer descriptors." } });
}

export default createProceduralCloudLayerKit;
