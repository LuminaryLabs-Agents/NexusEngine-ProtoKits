export const GENERIC_PARTICLE_BACKGROUND_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const particleBackgroundPresets = Object.freeze({
  nexusGallery: Object.freeze({
    id: "nexus-gallery",
    background: { base: [0.006, 0.007, 0.008], haze: [0.02, 0.05, 0.065] },
    layers: [
      { id: "near-gold-dust", count: 42, scale: 17, speed: 0.045, drift: [0.08, -0.035], twinkle: 0.8, size: 1.15, opacity: 0.42, color: [1.0, 0.86, 0.34], seed: 11 },
      { id: "blue-depth-motes", count: 58, scale: 25, speed: 0.028, drift: [-0.035, 0.055], twinkle: 0.65, size: 0.78, opacity: 0.26, color: [0.34, 0.78, 1.0], seed: 29 },
      { id: "chalk-sparks", count: 24, scale: 10, speed: 0.08, drift: [0.02, 0.08], twinkle: 1.0, size: 0.48, opacity: 0.34, color: [0.78, 0.82, 0.78], seed: 47 }
    ]
  }),
  starfield: Object.freeze({
    id: "starfield",
    background: { base: [0.002, 0.003, 0.01], haze: [0.01, 0.02, 0.05] },
    layers: [
      { id: "slow-stars", count: 96, scale: 34, speed: 0.01, drift: [0.01, -0.01], twinkle: 1.0, size: 0.64, opacity: 0.45, color: [0.75, 0.88, 1.0], seed: 101 },
      { id: "warm-stars", count: 36, scale: 18, speed: 0.02, drift: [-0.015, 0.006], twinkle: 0.75, size: 0.9, opacity: 0.34, color: [1.0, 0.78, 0.42], seed: 207 }
    ]
  }),
  fogDust: Object.freeze({
    id: "fog-dust",
    background: { base: [0.01, 0.012, 0.012], haze: [0.05, 0.06, 0.055] },
    layers: [
      { id: "mist-pollen", count: 64, scale: 20, speed: 0.018, drift: [0.025, 0.012], twinkle: 0.25, size: 1.4, opacity: 0.18, color: [0.7, 0.74, 0.68], seed: 303 },
      { id: "high-glints", count: 18, scale: 12, speed: 0.05, drift: [-0.04, 0.035], twinkle: 0.85, size: 0.42, opacity: 0.28, color: [0.94, 0.92, 0.74], seed: 404 }
    ]
  })
});

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createGenericParticleBackgroundKit requires NexusRealtime.${key}.`);
    }
  }
}

function color(value, fallback = [1, 1, 1]) {
  const list = asArray(value).length ? asArray(value) : fallback;
  return [n(list[0], fallback[0]), n(list[1], fallback[1]), n(list[2], fallback[2])].map((v) => clamp(v, 0, 1));
}

function vec2(value, fallback = [0, 0]) {
  const list = asArray(value).length ? asArray(value) : fallback;
  return [n(list[0], fallback[0]), n(list[1], fallback[1])];
}

function normalizeLayer(layer = {}, index = 0) {
  return {
    id: String(layer.id ?? `particle-layer-${index}`),
    count: Math.max(0, Math.floor(n(layer.count, 32))),
    scale: Math.max(0.001, n(layer.scale, 16)),
    speed: n(layer.speed, 0.04),
    drift: vec2(layer.drift, [0, 0]),
    twinkle: clamp(n(layer.twinkle, 0.5), 0, 2),
    size: Math.max(0.001, n(layer.size, 1)),
    opacity: clamp(n(layer.opacity, 0.3), 0, 1),
    color: color(layer.color, [1, 1, 1]),
    seed: n(layer.seed, index * 37 + 11),
    blend: layer.blend ?? "screen"
  };
}

export function createParticleBackgroundDescriptor(config = {}) {
  const preset = typeof config.preset === "string" ? particleBackgroundPresets[config.preset] : config.preset;
  const source = { ...(preset ?? particleBackgroundPresets.nexusGallery), ...config };
  const layers = asArray(config.layers ?? source.layers).map(normalizeLayer);
  return {
    version: GENERIC_PARTICLE_BACKGROUND_KIT_VERSION,
    id: String(config.id ?? source.id ?? "particle-background"),
    presetId: String(source.id ?? config.preset ?? "custom"),
    enabled: config.enabled !== false,
    intensity: clamp(n(config.intensity, n(source.intensity, 1)), 0, 4),
    timeScale: clamp(n(config.timeScale, n(source.timeScale, 1)), 0, 8),
    parallax: clamp(n(config.parallax, n(source.parallax, 0.5)), 0, 4),
    background: {
      base: color(source.background?.base, [0.006, 0.007, 0.008]),
      haze: color(source.background?.haze, [0.02, 0.05, 0.065])
    },
    layers,
    uniforms: {
      layerCount: layers.length,
      totalParticles: layers.reduce((sum, layer) => sum + layer.count, 0)
    }
  };
}

function createState(config = {}) {
  return {
    version: GENERIC_PARTICLE_BACKGROUND_KIT_VERSION,
    id: config.stateId ?? "generic-particle-background",
    descriptor: createParticleBackgroundDescriptor(config),
    pulses: [],
    lastReason: "initialized"
  };
}

export function createGenericParticleBackgroundKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const ParticleBackgroundState = defineResource(config.resourceName ?? "genericParticleBackground.state");
  const Configure = defineEvent("genericParticleBackground.configure");
  const SetPreset = defineEvent("genericParticleBackground.setPreset");
  const SetEnabled = defineEvent("genericParticleBackground.setEnabled");
  const Pulse = defineEvent("genericParticleBackground.pulse");
  const Updated = defineEvent("genericParticleBackground.updated");

  function system(world) {
    let state = world.getResource(ParticleBackgroundState) ?? createState(config);
    for (const event of world.readEvents(Configure)) {
      state = { ...state, descriptor: createParticleBackgroundDescriptor({ ...state.descriptor, ...(event.config ?? {}) }), lastReason: event.reason ?? "configure" };
    }
    for (const event of world.readEvents(SetPreset)) {
      state = { ...state, descriptor: createParticleBackgroundDescriptor({ ...state.descriptor, preset: event.preset ?? "nexusGallery", ...(event.config ?? {}) }), lastReason: event.reason ?? "preset" };
    }
    for (const event of world.readEvents(SetEnabled)) {
      state = { ...state, descriptor: { ...state.descriptor, enabled: Boolean(event.enabled) }, lastReason: event.reason ?? "enabled" };
    }
    const now = n(world.__nexusClock?.elapsed, 0);
    const pulses = state.pulses.map((pulse) => ({ ...pulse, age: now - pulse.at })).filter((pulse) => pulse.age <= pulse.duration);
    for (const event of world.readEvents(Pulse)) {
      pulses.push({ id: event.id ?? `pulse-${pulses.length + 1}`, at: now, age: 0, duration: Math.max(0.01, n(event.duration, 1)), intensity: n(event.intensity, 1), color: color(event.color, [1, 1, 1]) });
    }
    state = { ...state, pulses };
    world.setResource(ParticleBackgroundState, state);
    if (state.lastReason !== "initialized") world.emit(Updated, { id: state.id, reason: state.lastReason, descriptor: state.descriptor });
  }

  return defineRuntimeKit({
    id: config.kitId ?? config.id ?? "generic-particle-background-kit",
    provides: ["render:particle-background", "background:particles", "visual:ambient-particles"],
    resources: { ParticleBackgroundState },
    events: { Configure, SetPreset, SetEnabled, Pulse, Updated },
    systems: [{ phase: config.phase ?? "simulate", name: "genericParticleBackgroundSystem", system }],
    initWorld({ world }) { world.setResource(ParticleBackgroundState, createState(config)); },
    install({ engine, world }) {
      engine.particleBackground = {
        resources: { ParticleBackgroundState },
        events: { Configure, SetPreset, SetEnabled, Pulse, Updated },
        configure(config = {}, payload = {}) { world.emit(Configure, { config, ...payload }); return world.getResource(ParticleBackgroundState); },
        setPreset(preset = "nexusGallery", config = {}) { world.emit(SetPreset, { preset, config }); return world.getResource(ParticleBackgroundState); },
        setEnabled(enabled = true, payload = {}) { world.emit(SetEnabled, { enabled, ...payload }); return world.getResource(ParticleBackgroundState); },
        pulse(payload = {}) { world.emit(Pulse, payload); return world.getResource(ParticleBackgroundState); },
        getState() { return world.getResource(ParticleBackgroundState); },
        getDescriptor() { return world.getResource(ParticleBackgroundState)?.descriptor ?? null; }
      };
    },
    bindings: { ParticleBackgroundState },
    metadata: { version: GENERIC_PARTICLE_BACKGROUND_KIT_VERSION, status: "experimental", purpose: "Renderer-neutral dynamic particle background descriptors for galleries, menus, ambience, and game hosts." }
  });
}

export default createGenericParticleBackgroundKit;
