export const GENERIC_ATMOSPHERE_LAYER_DESCRIPTOR_KIT_VERSION = "0.1.0";

const n = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};
const clamp01 = (value) => Math.max(0, Math.min(1, n(value, 1)));
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const vec3 = (value = {}) => ({ x: n(value.x), y: n(value.y), z: n(value.z) });
const resource = (N, name) => typeof N?.defineResource === "function" ? N.defineResource(name) : `resource:${name}`;
const event = (N, name) => typeof N?.defineEvent === "function" ? N.defineEvent(name) : `event:${name}`;
const runtimeKit = (N, cfg) => typeof N?.defineRuntimeKit === "function" ? N.defineRuntimeKit(cfg) : Object.freeze(cfg);
const frameOf = (world) => n(world?.__nexusClock?.frame);
const deltaOf = (world) => n(world?.__nexusClock?.delta, 1 / 60);
const mapById = (items = []) => Object.fromEntries(arr(items).filter((item) => item?.id).map((item) => [String(item.id), clone(item)]));

function namespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n.visualFx || typeof engine.n.visualFx !== "object") engine.n.visualFx = {};
  return engine.n.visualFx;
}

export function createGenericAtmosphereLayerDescriptorKit(NexusRealtime = {}, config = {}) {
  const State = resource(NexusRealtime, config.resourceName ?? "genericVisualFx.atmosphereLayer.state");
  const SetLayer = event(NexusRealtime, config.setEventName ?? "genericVisualFx.atmosphereLayer.set");
  const RemoveLayer = event(NexusRealtime, config.removeEventName ?? "genericVisualFx.atmosphereLayer.remove");
  const SetPreset = event(NexusRealtime, config.presetEventName ?? "genericVisualFx.atmosphereLayer.setPreset");
  const presets = clone(config.presets ?? {});
  const defaultPresetId = config.presetId ?? config.defaultPresetId ?? "default";

  const layersFor = (id = defaultPresetId) => mapById((presets[id] ?? {}).layers ?? config.layers ?? []);

  function normalize(layer = {}) {
    const id = String(layer.id ?? `atmosphere-layer:${n(layer.order)}`);
    return {
      id,
      kind: layer.kind ?? "gradient",
      order: n(layer.order),
      color: layer.color ?? "#ffffff",
      opacity: clamp01(layer.opacity),
      blendMode: layer.blendMode ?? "normal",
      scrollSpeed: vec3(layer.scrollSpeed ?? layer.velocity ?? {}),
      scale: n(layer.scale, 1),
      density: n(layer.density, 1),
      altitude: n(layer.altitude),
      horizon: clone(layer.horizon ?? {}),
      zenith: clone(layer.zenith ?? {}),
      material: clone(layer.material ?? {}),
      renderHints: clone(layer.renderHints ?? {}),
      tags: arr(layer.tags),
      payload: clone(layer.payload ?? {})
    };
  }

  const initial = () => {
    const layers = layersFor(defaultPresetId);
    return {
      id: config.id ?? "generic-atmosphere-layer-descriptors",
      version: GENERIC_ATMOSPHERE_LAYER_DESCRIPTOR_KIT_VERSION,
      presetId: defaultPresetId,
      presets,
      layers,
      descriptors: Object.values(layers),
      frame: 0,
      time: 0
    };
  };

  function system(world) {
    const state = clone(world.getResource(State) ?? initial());
    state.frame = frameOf(world);
    state.time = n(state.time) + deltaOf(world);

    for (const payload of world.readEvents(SetPreset)) {
      const id = payload.id ?? payload.presetId;
      if (id && state.presets[id]) {
        state.presetId = id;
        state.layers = layersFor(id);
      }
    }

    for (const payload of world.readEvents(SetLayer)) {
      const layer = normalize(payload.layer ?? payload);
      state.layers[layer.id] = layer;
    }

    for (const payload of world.readEvents(RemoveLayer)) {
      const id = payload.id ?? payload.layerId;
      if (id) delete state.layers[id];
    }

    state.descriptors = Object.values(state.layers)
      .map((layer) => ({
        ...layer,
        offset: {
          x: n(layer.scrollSpeed?.x) * state.time,
          y: n(layer.scrollSpeed?.y) * state.time,
          z: n(layer.scrollSpeed?.z) * state.time
        }
      }))
      .sort((a, b) => n(a.order) - n(b.order));

    world.setResource(State, state);
  }

  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "generic-atmosphere-layer-descriptor-kit",
    provides: ["atmosphere:layer-descriptors", "render:sky-layer-descriptors", "render:volumetric-layer-descriptors"],
    resources: { State },
    events: { SetLayer, RemoveLayer, SetPreset },
    systems: [{ phase: "cleanup", name: "genericAtmosphereLayerDescriptorSystem", system }],
    initWorld({ world }) { world.setResource(State, initial()); },
    install({ engine, world }) {
      const api = {
        resources: { State },
        events: { SetLayer, RemoveLayer, SetPreset },
        setLayer(layer = {}) { world.emit(SetLayer, layer); return { accepted: true, id: layer.id }; },
        removeLayer(id) { world.emit(RemoveLayer, { id }); return { accepted: true, id }; },
        setPreset(id) { world.emit(SetPreset, { id }); return { accepted: true, id }; },
        getState: () => world.getResource(State),
        getDescriptors: () => clone(world.getResource(State)?.descriptors ?? [])
      };
      const nspace = namespace(engine);
      if (nspace) nspace.atmosphereLayers = api;
      engine.genericAtmosphereLayers = api;
    },
    metadata: { version: GENERIC_ATMOSPHERE_LAYER_DESCRIPTOR_KIT_VERSION, domain: "generic-visual-fx", purpose: "Renderer-agnostic atmosphere layer descriptors for skies, clouds, haze, smoke, fog banks, starfields and horizon glow." }
  });
}

export default createGenericAtmosphereLayerDescriptorKit;
