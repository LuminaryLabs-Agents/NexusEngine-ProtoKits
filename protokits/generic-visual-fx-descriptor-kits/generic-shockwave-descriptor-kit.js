export const GENERIC_SHOCKWAVE_DESCRIPTOR_KIT_VERSION = "0.1.0";

const n = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};
const clamp01 = (value) => Math.max(0, Math.min(1, n(value)));
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const vec3 = (value = {}) => ({ x: n(value.x), y: n(value.y), z: n(value.z) });
const resource = (N, name) => typeof N?.defineResource === "function" ? N.defineResource(name) : `resource:${name}`;
const event = (N, name) => typeof N?.defineEvent === "function" ? N.defineEvent(name) : `event:${name}`;
const runtimeKit = (N, cfg) => typeof N?.defineRuntimeKit === "function" ? N.defineRuntimeKit(cfg) : Object.freeze(cfg);
const frameOf = (world) => n(world?.__nexusClock?.frame);
const live = (items, frame, max) => items.filter((item) => n(item.expiresFrame, frame + 1) > frame).slice(-n(max, 128));

function namespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n.visualFx || typeof engine.n.visualFx !== "object") engine.n.visualFx = {};
  return engine.n.visualFx;
}

export function createGenericShockwaveDescriptorKit(NexusEngine = {}, config = {}) {
  const State = resource(NexusEngine, config.resourceName ?? "genericVisualFx.shockwave.state");
  const Emit = event(NexusEngine, config.emitEventName ?? "genericVisualFx.shockwave.emit");
  const Clear = event(NexusEngine, config.clearEventName ?? "genericVisualFx.shockwave.clear");

  const initial = () => ({
    id: config.id ?? "generic-shockwave-descriptors",
    version: GENERIC_SHOCKWAVE_DESCRIPTOR_KIT_VERSION,
    active: [],
    emitted: [],
    frame: 0
  });

  function normalize(payload = {}, frame = 0, index = 0) {
    const lifetimeFrames = Math.max(1, Math.round(n(payload.lifetimeFrames, n(payload.lifetime, 0.6) * 60)));
    return {
      id: payload.id ?? `shockwave:${frame}:${index}`,
      type: payload.type ?? "shockwave",
      origin: vec3(payload.origin ?? payload.position ?? payload),
      startRadius: n(payload.startRadius),
      radius: n(payload.radius, n(payload.endRadius, 24)),
      force: n(payload.force, 1),
      amplitude: n(payload.amplitude, n(payload.force, 1)),
      falloff: payload.falloff ?? "smooth",
      color: payload.color ?? "#ffffff",
      width: n(payload.width, 1),
      tags: arr(payload.tags),
      payload: clone(payload.payload ?? {}),
      bornFrame: frame,
      lifetimeFrames,
      expiresFrame: frame + lifetimeFrames
    };
  }

  function advance(entry, frame) {
    const age = Math.max(0, frame - n(entry.bornFrame, frame));
    const progress = clamp01(age / Math.max(1, n(entry.lifetimeFrames, 1)));
    return {
      ...entry,
      age,
      progress,
      currentRadius: n(entry.startRadius) + (n(entry.radius) - n(entry.startRadius)) * progress,
      strength: n(entry.amplitude, 1) * (1 - progress)
    };
  }

  function system(world) {
    const frame = frameOf(world);
    const state = clone(world.getResource(State) ?? initial());
    state.frame = frame;
    state.emitted = [];

    for (const clear of world.readEvents(Clear)) {
      state.active = clear.tag ? state.active.filter((entry) => !arr(entry.tags).includes(clear.tag)) : [];
    }

    let index = 0;
    for (const payload of world.readEvents(Emit)) {
      const descriptor = normalize(payload, frame, index);
      index += 1;
      state.active.push(descriptor);
      state.emitted.push(descriptor);
    }

    state.active = live(state.active, frame, config.maxActive ?? 128).map((entry) => advance(entry, frame));
    world.setResource(State, state);
  }

  return runtimeKit(NexusEngine, {
    id: config.kitId ?? "generic-shockwave-descriptor-kit",
    provides: ["feedback:shockwave-descriptors", "world:shockwave-descriptors", "render:shockwave-descriptors"],
    resources: { State },
    events: { Emit, Clear },
    systems: [{ phase: "cleanup", name: "genericShockwaveDescriptorSystem", system }],
    initWorld({ world }) { world.setResource(State, initial()); },
    install({ engine, world }) {
      const api = {
        resources: { State },
        events: { Emit, Clear },
        emit(payload = {}) { world.emit(Emit, payload); return { accepted: true }; },
        clear(filter = {}) { world.emit(Clear, filter); return { accepted: true }; },
        getState: () => world.getResource(State),
        getDescriptors: () => clone(world.getResource(State)?.active ?? []),
        getEmittedThisFrame: () => clone(world.getResource(State)?.emitted ?? [])
      };
      const nspace = namespace(engine);
      if (nspace) nspace.shockwaves = api;
      engine.genericShockwaves = api;
    },
    metadata: { version: GENERIC_SHOCKWAVE_DESCRIPTOR_KIT_VERSION, domain: "generic-visual-fx", purpose: "Renderer-agnostic shockwave descriptors for camera, surface, bloom, ring, distortion, impulse or audio hosts." }
  });
}

export default createGenericShockwaveDescriptorKit;
