const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const REACTIVE_PARTICLE_FIELD_KIT_VERSION = "0.1.0";

const PRESETS = Object.freeze({
  "reactive-particle-field-kit": { namespace: "reactiveParticleField", kind: "reactive-particle-field", shader: "field", color: [0.6, 0.9, 1.0, 1], defaultLife: 1.4, defaultCount: 24, defaultSpeed: 80 },
  "gpu-spark-burst-kit": { namespace: "gpuSparkBurst", kind: "gpu-spark-burst", shader: "spark", color: [1.0, 0.72, 0.22, 1], defaultLife: 0.42, defaultCount: 34, defaultSpeed: 260 },
  "gpu-dust-cloud-kit": { namespace: "gpuDustCloud", kind: "gpu-dust-cloud", shader: "dust", color: [0.62, 0.58, 0.52, 1], defaultLife: 1.8, defaultCount: 46, defaultSpeed: 70 },
  "gpu-water-mist-kit": { namespace: "gpuWaterMist", kind: "gpu-water-mist", shader: "mist", color: [0.48, 0.86, 1.0, 0.75], defaultLife: 1.6, defaultCount: 38, defaultSpeed: 55 },
  "gpu-bubble-column-kit": { namespace: "gpuBubbleColumn", kind: "gpu-bubble-column", shader: "bubble", color: [0.58, 0.92, 1.0, 0.8], defaultLife: 2.6, defaultCount: 24, defaultSpeed: 42 },
  "gpu-rune-spark-kit": { namespace: "gpuRuneSpark", kind: "gpu-rune-spark", shader: "rune", color: [0.25, 0.92, 1.0, 1], defaultLife: 0.9, defaultCount: 26, defaultSpeed: 120 },
  "gpu-sound-wave-particle-kit": { namespace: "gpuSoundWaveParticle", kind: "gpu-sound-wave-particle", shader: "sound-wave", color: [0.78, 0.94, 1.0, 0.7], defaultLife: 1.1, defaultCount: 48, defaultSpeed: 140 },
  "gpu-lantern-mote-kit": { namespace: "gpuLanternMote", kind: "gpu-lantern-mote", shader: "mote", color: [1.0, 0.74, 0.32, 0.75], defaultLife: 2.2, defaultCount: 18, defaultSpeed: 26 },
  "gpu-impact-chip-kit": { namespace: "gpuImpactChip", kind: "gpu-impact-chip", shader: "chip", color: [0.72, 0.76, 0.78, 1], defaultLife: 0.7, defaultCount: 22, defaultSpeed: 190 },
  "gpu-creature-alert-pulse-kit": { namespace: "gpuCreatureAlertPulse", kind: "gpu-creature-alert-pulse", shader: "alert-pulse", color: [1.0, 0.12, 0.16, 0.85], defaultLife: 0.95, defaultCount: 40, defaultSpeed: 170 },
  "gpu-door-awakening-kit": { namespace: "gpuDoorAwakening", kind: "gpu-door-awakening", shader: "door-awakening", color: [0.24, 0.92, 1.0, 1], defaultLife: 1.6, defaultCount: 72, defaultSpeed: 120 },
  "gpu-water-surface-shimmer-kit": { namespace: "gpuWaterSurfaceShimmer", kind: "gpu-water-surface-shimmer", shader: "water-shimmer", color: [0.34, 0.82, 1.0, 0.68], defaultLife: 1.0, defaultCount: 16, defaultSpeed: 18 },
  "gpu-shadow-flicker-kit": { namespace: "gpuShadowFlicker", kind: "gpu-shadow-flicker", shader: "shadow-flicker", color: [0.0, 0.0, 0.0, 0.58], defaultLife: 0.5, defaultCount: 10, defaultSpeed: 16 },
  "gpu-ambient-cave-dust-kit": { namespace: "gpuAmbientCaveDust", kind: "gpu-ambient-cave-dust", shader: "ambient-dust", color: [0.72, 0.78, 0.82, 0.34], defaultLife: 4.0, defaultCount: 80, defaultSpeed: 18 },
  "gpu-foam-line-kit": { namespace: "gpuFoamLine", kind: "gpu-foam-line", shader: "foam-line", color: [0.76, 0.96, 1.0, 0.75], defaultLife: 1.0, defaultCount: 30, defaultSpeed: 28 }
});

const SHADER_SNIPPETS = Object.freeze({
  field: "vec4 shadeParticle(vec2 uv,float age,float seed){float d=length(uv-.5);return vec4(vec3(1.0),smoothstep(.5,.0,d)*(1.0-age));}",
  spark: "vec4 shadeParticle(vec2 uv,float age,float seed){float core=pow(1.0-length(uv-.5)*2.0,5.0);return vec4(1.0,.72,.22,core*(1.0-age));}",
  dust: "vec4 shadeParticle(vec2 uv,float age,float seed){float n=fract(sin(dot(uv+seed,vec2(12.9898,78.233)))*43758.5453);return vec4(.62,.58,.52,(.35+n*.25)*(1.0-age));}",
  mist: "vec4 shadeParticle(vec2 uv,float age,float seed){float d=length(uv-.5);return vec4(.48,.86,1.0,smoothstep(.5,.05,d)*.42*(1.0-age));}",
  bubble: "vec4 shadeParticle(vec2 uv,float age,float seed){float ring=abs(length(uv-.5)-.32);return vec4(.58,.92,1.0,smoothstep(.05,.0,ring)*(1.0-age));}",
  rune: "vec4 shadeParticle(vec2 uv,float age,float seed){float line=smoothstep(.045,.0,abs(uv.x-.5));return vec4(.25,.92,1.0,line*(1.0-age));}",
  "sound-wave": "vec4 shadeParticle(vec2 uv,float age,float seed){float ring=abs(length(uv-.5)-age*.45);return vec4(.78,.94,1.0,smoothstep(.035,.0,ring)*(1.0-age));}",
  mote: "vec4 shadeParticle(vec2 uv,float age,float seed){float d=length(uv-.5);return vec4(1.0,.74,.32,smoothstep(.45,.0,d)*.55*(1.0-age*.55));}",
  chip: "vec4 shadeParticle(vec2 uv,float age,float seed){float shard=max(abs(uv.x-.5),abs(uv.y-.5));return vec4(.72,.76,.78,smoothstep(.42,.0,shard)*(1.0-age));}",
  "alert-pulse": "vec4 shadeParticle(vec2 uv,float age,float seed){float ring=abs(length(uv-.5)-age*.5);return vec4(1.0,.12,.16,smoothstep(.04,.0,ring)*(1.0-age));}",
  "door-awakening": "vec4 shadeParticle(vec2 uv,float age,float seed){float beam=smoothstep(.08,.0,abs(uv.x-.5));return vec4(.24,.92,1.0,beam*(1.0-age*.4));}",
  "water-shimmer": "vec4 shadeParticle(vec2 uv,float age,float seed){float wave=sin((uv.x+seed)*24.0+age*12.0);return vec4(.34,.82,1.0,(.35+.35*wave)*(1.0-age));}",
  "shadow-flicker": "vec4 shadeParticle(vec2 uv,float age,float seed){float d=length(uv-.5);return vec4(0.0,0.0,0.0,smoothstep(.5,.1,d)*.58*(1.0-age));}",
  "ambient-dust": "vec4 shadeParticle(vec2 uv,float age,float seed){float d=length(uv-.5);return vec4(.72,.78,.82,smoothstep(.5,.0,d)*.26);}",
  "foam-line": "vec4 shadeParticle(vec2 uv,float age,float seed){float line=smoothstep(.06,.0,abs(uv.y-.5+sin(uv.x*12.0)*.04));return vec4(.76,.96,1.0,line*(1.0-age));}"
});

function requireNexus(NexusRealtime, factoryName) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`${factoryName} requires NexusRealtime.${key}.`);
  }
}

function ensureNamespace(engine, namespace) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[namespace] || typeof engine.n[namespace] !== "object") engine.n[namespace] = {};
  return engine.n[namespace];
}

export function createReactiveParticleFieldKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime, "createReactiveParticleFieldKit");
  const presetId = config.presetId ?? config.kitId ?? "reactive-particle-field-kit";
  const preset = { ...PRESETS["reactive-particle-field-kit"], ...(PRESETS[presetId] ?? {}), ...config.preset };
  const namespace = config.engineNamespace ?? preset.namespace;
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const ParticleFieldState = defineResource(config.resourceName ?? `${namespace}.state`);
  const BurstRequested = defineEvent(`${namespace}.burstRequested`);
  const FieldUpdated = defineEvent(`${namespace}.fieldUpdated`);
  const ParticleExpired = defineEvent(`${namespace}.particleExpired`);

  const initial = () => ({
    version: REACTIVE_PARTICLE_FIELD_KIT_VERSION,
    id: config.stateId ?? preset.kind,
    kind: preset.kind,
    time: 0,
    particles: [],
    descriptors: [],
    shader: {
      id: preset.shader,
      fragment: config.fragmentShader ?? SHADER_SNIPPETS[preset.shader] ?? SHADER_SNIPPETS.field,
      uniforms: clone(config.uniforms ?? {})
    }
  });

  function descriptorFromParticle(particle, state) {
    const age01 = Math.min(1, particle.age / Math.max(0.001, particle.life));
    return {
      id: particle.id,
      kind: state.kind,
      shader: clone(state.shader),
      position: clone(particle.position),
      velocity: clone(particle.velocity),
      size: particle.size,
      age01,
      color: clone(particle.color),
      blend: particle.blend,
      sourceId: particle.sourceId,
      tags: clone(particle.tags)
    };
  }

  function system(world) {
    const state = clone(world.getResource(ParticleFieldState) ?? initial());
    const dt = toNumber(world.__nexusDelta, 1 / 60);
    state.time += dt;
    const next = [];
    for (const particle of state.particles) {
      const p = clone(particle);
      p.age += dt;
      p.velocity.x += toNumber(p.acceleration?.x, 0) * dt;
      p.velocity.y += toNumber(p.acceleration?.y, 0) * dt;
      p.velocity.z += toNumber(p.acceleration?.z, 0) * dt;
      p.position.x += toNumber(p.velocity.x, 0) * dt;
      p.position.y += toNumber(p.velocity.y, 0) * dt;
      p.position.z += toNumber(p.velocity.z, 0) * dt;
      if (p.age < p.life) next.push(p);
      else world.emit?.(ParticleExpired, { id: p.id, sourceId: p.sourceId, kind: state.kind });
    }
    state.particles = next;
    state.descriptors = next.map((particle) => descriptorFromParticle(particle, state));
    world.setResource(ParticleFieldState, state);
    world.emit?.(FieldUpdated, { kind: state.kind, count: state.particles.length, descriptorCount: state.descriptors.length });
  }

  return defineRuntimeKit({
    id: config.kitId ?? presetId,
    provides: ["render:particle-descriptors", `render:${preset.kind}`],
    resources: { ParticleFieldState },
    events: { BurstRequested, FieldUpdated, ParticleExpired },
    systems: [{ phase: config.phase ?? "present", name: `${namespace}System`, system }],
    initWorld({ world }) { world.setResource(ParticleFieldState, initial()); },
    install({ engine, world }) {
      const api = {
        resources: { ParticleFieldState },
        events: { BurstRequested, FieldUpdated, ParticleExpired },
        burst(payload = {}) {
          const state = clone(world.getResource(ParticleFieldState) ?? initial());
          const count = Math.max(0, Math.floor(toNumber(payload.count, preset.defaultCount)));
          const baseSpeed = toNumber(payload.speed, preset.defaultSpeed);
          const life = toNumber(payload.life, preset.defaultLife);
          const origin = clone(payload.position ?? { x: 0, y: 0, z: 0 });
          const spread = toNumber(payload.spread, Math.PI * 2);
          const startAngle = toNumber(payload.angle, -spread / 2);
          for (let index = 0; index < count; index += 1) {
            const t = count <= 1 ? 0 : index / (count - 1);
            const angle = startAngle + spread * t + toNumber(payload.jitter, 0.4) * (Math.random?.() ?? 0.5 - 0.5);
            const speed = baseSpeed * (0.35 + (Math.random?.() ?? 0.5) * 0.9);
            state.particles.push({
              id: String(payload.id ?? payload.burstId ?? `${state.kind}-${Math.round(state.time * 1000)}-${index}`),
              sourceId: payload.sourceId ?? null,
              position: clone(origin),
              velocity: clone(payload.velocity ?? { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed, z: 0 }),
              acceleration: clone(payload.acceleration ?? { x: 0, y: toNumber(payload.gravity, 0), z: 0 }),
              color: clone(payload.color ?? preset.color),
              size: toNumber(payload.size, 4),
              life,
              age: 0,
              blend: payload.blend ?? "screen",
              tags: asArray(payload.tags)
            });
          }
          world.setResource(ParticleFieldState, state);
          world.emit?.(BurstRequested, { kind: state.kind, count, sourceId: payload.sourceId, position: origin });
          return clone(state);
        },
        clear() {
          const state = clone(world.getResource(ParticleFieldState) ?? initial());
          state.particles = [];
          state.descriptors = [];
          world.setResource(ParticleFieldState, state);
          return clone(state);
        },
        getState() { return clone(world.getResource(ParticleFieldState) ?? initial()); },
        getDescriptors() { return this.getState().descriptors; }
      };
      engine[namespace] = api;
      Object.assign(ensureNamespace(engine, namespace) ?? {}, api);
    },
    metadata: {
      version: REACTIVE_PARTICLE_FIELD_KIT_VERSION,
      domain: preset.kind,
      layer: "renderer-domain",
      extendsBase: "DomainServiceKit",
      ownsLoop: true,
      rendererFacing: true,
      boundary: "Owns reactive particle state and shader descriptors for renderer consumption. It does not own gameplay outcomes, DOM input, audio, or platform lifecycle."
    }
  });
}

function createPresetFactory(presetId) {
  return function createPresetParticleKit(NexusRealtime, config = {}) {
    return createReactiveParticleFieldKit(NexusRealtime, { ...config, presetId, kitId: config.kitId ?? presetId });
  };
}

export const createGpuSparkBurstKit = createPresetFactory("gpu-spark-burst-kit");
export const createGpuDustCloudKit = createPresetFactory("gpu-dust-cloud-kit");
export const createGpuWaterMistKit = createPresetFactory("gpu-water-mist-kit");
export const createGpuBubbleColumnKit = createPresetFactory("gpu-bubble-column-kit");
export const createGpuRuneSparkKit = createPresetFactory("gpu-rune-spark-kit");
export const createGpuSoundWaveParticleKit = createPresetFactory("gpu-sound-wave-particle-kit");
export const createGpuLanternMoteKit = createPresetFactory("gpu-lantern-mote-kit");
export const createGpuImpactChipKit = createPresetFactory("gpu-impact-chip-kit");
export const createGpuCreatureAlertPulseKit = createPresetFactory("gpu-creature-alert-pulse-kit");
export const createGpuDoorAwakeningKit = createPresetFactory("gpu-door-awakening-kit");
export const createGpuWaterSurfaceShimmerKit = createPresetFactory("gpu-water-surface-shimmer-kit");
export const createGpuShadowFlickerKit = createPresetFactory("gpu-shadow-flicker-kit");
export const createGpuAmbientCaveDustKit = createPresetFactory("gpu-ambient-cave-dust-kit");
export const createGpuFoamLineKit = createPresetFactory("gpu-foam-line-kit");

export function createStonewakeParticleKits(NexusRealtime, config = {}) {
  return [
    createReactiveParticleFieldKit(NexusRealtime, config.reactiveParticleField ?? {}),
    createGpuSparkBurstKit(NexusRealtime, config.gpuSparkBurst ?? {}),
    createGpuDustCloudKit(NexusRealtime, config.gpuDustCloud ?? {}),
    createGpuWaterMistKit(NexusRealtime, config.gpuWaterMist ?? {}),
    createGpuBubbleColumnKit(NexusRealtime, config.gpuBubbleColumn ?? {}),
    createGpuRuneSparkKit(NexusRealtime, config.gpuRuneSpark ?? {}),
    createGpuSoundWaveParticleKit(NexusRealtime, config.gpuSoundWaveParticle ?? {}),
    createGpuLanternMoteKit(NexusRealtime, config.gpuLanternMote ?? {}),
    createGpuImpactChipKit(NexusRealtime, config.gpuImpactChip ?? {}),
    createGpuCreatureAlertPulseKit(NexusRealtime, config.gpuCreatureAlertPulse ?? {}),
    createGpuDoorAwakeningKit(NexusRealtime, config.gpuDoorAwakening ?? {}),
    createGpuWaterSurfaceShimmerKit(NexusRealtime, config.gpuWaterSurfaceShimmer ?? {}),
    createGpuShadowFlickerKit(NexusRealtime, config.gpuShadowFlicker ?? {}),
    createGpuAmbientCaveDustKit(NexusRealtime, config.gpuAmbientCaveDust ?? {}),
    createGpuFoamLineKit(NexusRealtime, config.gpuFoamLine ?? {})
  ];
}

export default createReactiveParticleFieldKit;
