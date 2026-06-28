export const GENERIC_FX_EMITTER_DESCRIPTOR_KIT_VERSION = "0.1.0";

const n = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const vec3 = (value = {}) => ({ x: n(value.x), y: n(value.y), z: n(value.z) });
const resource = (N, name) => typeof N?.defineResource === "function" ? N.defineResource(name) : `resource:${name}`;
const event = (N, name) => typeof N?.defineEvent === "function" ? N.defineEvent(name) : `event:${name}`;
const runtimeKit = (N, cfg) => typeof N?.defineRuntimeKit === "function" ? N.defineRuntimeKit(cfg) : Object.freeze(cfg);
const frameOf = (world) => n(world?.__nexusClock?.frame);
const live = (items, frame, max) => items.filter((item) => n(item.expiresFrame, frame + 1) > frame).slice(-n(max, 512));

function namespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n.visualFx || typeof engine.n.visualFx !== "object") engine.n.visualFx = {};
  return engine.n.visualFx;
}

export function createGenericFxEmitterDescriptorKit(NexusRealtime = {}, config = {}) {
  const State = resource(NexusRealtime, config.resourceName ?? "genericVisualFx.emitter.state");
  const Emit = event(NexusRealtime, config.emitEventName ?? "genericVisualFx.emitter.emit");
  const Clear = event(NexusRealtime, config.clearEventName ?? "genericVisualFx.emitter.clear");
  const presets = clone(config.presets ?? {});

  const initial = () => ({
    id: config.id ?? "generic-fx-emitter-descriptors",
    version: GENERIC_FX_EMITTER_DESCRIPTOR_KIT_VERSION,
    presets,
    active: [],
    emitted: [],
    stats: { emittedTotal: 0, emittedThisFrame: 0, active: 0 },
    frame: 0
  });

  function normalize(payload = {}, frame = 0, index = 0) {
    const type = payload.type ?? payload.effectType ?? payload.preset ?? "effect";
    const merged = { ...(presets[type] ?? presets[payload.preset] ?? {}), ...clone(payload), type };
    const lifetimeFrames = Math.max(1, Math.round(n(merged.lifetimeFrames, n(merged.lifetime, 0.75) * 60)));
    return {
      id: merged.id ?? `fx:${type}:${frame}:${index}`,
      type,
      family: merged.family ?? "generic-fx",
      position: vec3(merged.position ?? merged),
      velocity: vec3(merged.velocity ?? merged.direction ?? {}),
      color: merged.color ?? merged.tint ?? "#ffffff",
      intensity: n(merged.intensity, 1),
      count: Math.max(1, Math.round(n(merged.count, 1))),
      size: n(merged.size, 1),
      lifetime: n(merged.lifetime, lifetimeFrames / 60),
      lifetimeFrames,
      tags: arr(merged.tags),
      payload: clone(merged.payload ?? {}),
      descriptor: clone(merged.descriptor ?? {}),
      bornFrame: frame,
      expiresFrame: frame + lifetimeFrames
    };
  }

  function system(world) {
    const frame = frameOf(world);
    const state = clone(world.getResource(State) ?? initial());
    state.frame = frame;
    state.emitted = [];
    state.stats = { ...(state.stats ?? {}), emittedThisFrame: 0 };

    for (const clear of world.readEvents(Clear)) {
      const type = clear.type ?? clear.effectType;
      const tag = clear.tag;
      state.active = !type && !tag ? [] : state.active.filter((entry) => !((type && entry.type === type) || (tag && arr(entry.tags).includes(tag))));
    }

    let index = 0;
    for (const entry of world.readEvents(Emit)) {
      const descriptor = normalize(entry, frame, index);
      index += 1;
      state.active.push(descriptor);
      state.emitted.push(descriptor);
      state.stats.emittedThisFrame += 1;
      state.stats.emittedTotal = n(state.stats.emittedTotal) + 1;
    }

    state.active = live(state.active, frame, config.maxActive ?? 512);
    state.stats.active = state.active.length;
    world.setResource(State, state);
  }

  return runtimeKit(NexusRealtime, {
    id: config.kitId ?? "generic-fx-emitter-descriptor-kit",
    provides: ["fx:emitter-descriptors", "render:effect-descriptors", "feedback:effect-events"],
    resources: { State },
    events: { Emit, Clear },
    systems: [{ phase: "cleanup", name: "genericFxEmitterDescriptorSystem", system }],
    initWorld({ world }) { world.setResource(State, initial()); },
    install({ engine, world }) {
      const api = {
        resources: { State },
        events: { Emit, Clear },
        emit(type, payload = {}) { world.emit(Emit, { ...payload, type }); return { accepted: true, type }; },
        clear(filter = {}) { world.emit(Clear, filter); return { accepted: true }; },
        getState: () => world.getResource(State),
        getDescriptors: () => clone(world.getResource(State)?.active ?? []),
        getEmittedThisFrame: () => clone(world.getResource(State)?.emitted ?? [])
      };
      const nspace = namespace(engine);
      if (nspace) nspace.fxEmitter = api;
      engine.genericFxEmitter = api;
    },
    metadata: { version: GENERIC_FX_EMITTER_DESCRIPTOR_KIT_VERSION, domain: "generic-visual-fx", purpose: "Renderer-agnostic transient effect descriptors for host-rendered bursts, trails, impacts, sparks and visual feedback." }
  });
}

export default createGenericFxEmitterDescriptorKit;
