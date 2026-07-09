export const GENERIC_PARTICLE_FIELD_DESCRIPTOR_KIT_VERSION = "0.1.0";

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

export function createGenericParticleFieldDescriptorKit(NexusEngine = {}, config = {}) {
  const State = resource(NexusEngine, config.resourceName ?? "genericVisualFx.particleField.state");
  const SetField = event(NexusEngine, config.setEventName ?? "genericVisualFx.particleField.set");
  const RemoveField = event(NexusEngine, config.removeEventName ?? "genericVisualFx.particleField.remove");
  const initialFields = mapById(config.fields ?? config.presets ?? []);

  function normalize(field = {}) {
    const id = String(field.id ?? `particle-field:${Object.keys(initialFields).length}`);
    return {
      id,
      kind: field.kind ?? "ambient-particles",
      shape: field.shape ?? "box",
      bounds: clone(field.bounds ?? { x: 0, y: 0, z: 0, width: 100, height: 30, depth: 100 }),
      density: n(field.density, 1),
      capacity: Math.max(0, Math.round(n(field.capacity, 512))),
      color: field.color ?? "#ffffff",
      size: n(field.size, 1),
      opacity: clamp01(field.opacity),
      velocity: vec3(field.velocity ?? field.wind ?? {}),
      acceleration: vec3(field.acceleration ?? field.gravity ?? {}),
      material: clone(field.material ?? {}),
      renderHints: clone(field.renderHints ?? {}),
      tags: arr(field.tags),
      payload: clone(field.payload ?? {})
    };
  }

  const initial = () => ({
    id: config.id ?? "generic-particle-field-descriptors",
    version: GENERIC_PARTICLE_FIELD_DESCRIPTOR_KIT_VERSION,
    fields: clone(initialFields),
    descriptors: Object.values(initialFields),
    frame: 0
  });

  function system(world) {
    const state = clone(world.getResource(State) ?? initial());
    state.frame = frameOf(world);

    for (const eventPayload of world.readEvents(SetField)) {
      const field = normalize(eventPayload.field ?? eventPayload);
      state.fields[field.id] = field;
    }

    for (const eventPayload of world.readEvents(RemoveField)) {
      const id = eventPayload.id ?? eventPayload.fieldId;
      if (id) delete state.fields[id];
    }

    const dt = deltaOf(world);
    state.descriptors = Object.values(state.fields).map((field) => ({
      ...field,
      time: n(field.time) + dt,
      scroll: {
        x: n(field.scroll?.x) + n(field.velocity?.x) * dt,
        y: n(field.scroll?.y) + n(field.velocity?.y) * dt,
        z: n(field.scroll?.z) + n(field.velocity?.z) * dt
      }
    }));

    world.setResource(State, state);
  }

  return runtimeKit(NexusEngine, {
    id: config.kitId ?? "generic-particle-field-descriptor-kit",
    provides: ["fx:particle-field-descriptors", "render:particle-field-descriptors", "atmosphere:particle-fields"],
    resources: { State },
    events: { SetField, RemoveField },
    systems: [{ phase: "cleanup", name: "genericParticleFieldDescriptorSystem", system }],
    initWorld({ world }) { world.setResource(State, initial()); },
    install({ engine, world }) {
      const api = {
        resources: { State },
        events: { SetField, RemoveField },
        setField(field = {}) { world.emit(SetField, field); return { accepted: true, id: field.id }; },
        removeField(id) { world.emit(RemoveField, { id }); return { accepted: true, id }; },
        getState: () => world.getResource(State),
        getDescriptors: () => clone(world.getResource(State)?.descriptors ?? [])
      };
      const nspace = namespace(engine);
      if (nspace) nspace.particleFields = api;
      engine.genericParticleFields = api;
    },
    metadata: { version: GENERIC_PARTICLE_FIELD_DESCRIPTOR_KIT_VERSION, domain: "generic-visual-fx", purpose: "Renderer-agnostic persistent particle field descriptors for ash, snow, rain, embers, dust, bubbles, motes and ambient fields." }
  });
}

export default createGenericParticleFieldDescriptorKit;
