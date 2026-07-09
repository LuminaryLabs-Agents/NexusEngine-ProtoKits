import {
  clone,
  createDefinitionFactory,
  defineInjectedRuntimeKit,
  ensureResource,
  number
} from "../protokit-core/index.js";

export const SMOKE_PARTICLE_DOMAIN_VERSION = "0.1.0";

const v3 = (value = {}, fallback = {}) => ({
  x: number(value.x, number(fallback.x, 0)),
  y: number(value.y, number(fallback.y, 0)),
  z: number(value.z, number(fallback.z, 0))
});

function windFrom(value = {}) {
  const direction = value.direction ?? { x: 0.8, z: 0.25 };
  const len = Math.hypot(number(direction.x, 0.8), number(direction.z, 0.25)) || 1;
  return {
    direction: { x: number(direction.x, 0.8) / len, z: number(direction.z, 0.25) / len },
    response: number(value.response ?? value.windResponse, 0.75),
    gustStrength: number(value.gustStrength, 0.34),
    gustFrequency: number(value.gustFrequency, 0.08)
  };
}

export function createSmokeParticleDescriptor(options = {}) {
  return {
    id: options.id ?? "smoke-emitter:central-001",
    type: "smoke-particle-emitter",
    version: SMOKE_PARTICLE_DOMAIN_VERSION,
    parentId: options.parentId ?? "campfire:central-001",
    position: v3(options.position, { x: 0, y: 1.4, z: 0 }),
    particleCount: Math.round(number(options.count ?? options.particleCount, 96)),
    spawnRadius: number(options.spawnRadius, 0.35),
    lifespanSeconds: number(options.lifespanSeconds, 4.5),
    riseSpeed: number(options.riseSpeed, 1.2),
    turbulence: number(options.turbulence, 0.42),
    wind: windFrom(options.wind ?? {}),
    opacityCurve: options.opacityCurve ?? "fade-in-soft-fade-out",
    scaleCurve: options.scaleCurve ?? "expand-with-age",
    colorRamp: clone(options.colorRamp ?? { start: "#7c7468", end: "#d7d2c4" }),
    lod: { nearCount: Math.round(number(options.nearCount, 96)), midCount: Math.round(number(options.midCount, 48)), farCount: Math.round(number(options.farCount, 16)) },
    render: { meshType: "soft-smoke-particles", material: "soft-alpha-smoke", lod: "near-particle" },
    rendererBoundary: { ownsParticles: false, adapterRequired: true }
  };
}

export function createSmokeParticleState(options = {}) {
  return { id: options.id ?? "smoke-particle-domain", version: SMOKE_PARTICLE_DOMAIN_VERSION, descriptor: createSmokeParticleDescriptor(options.descriptor ?? options) };
}

export function createSmokeParticleDomainKit(nexusEngine = {}, options = {}) {
  const defs = createDefinitionFactory(nexusEngine);
  const State = defs.resource(options.resourceName ?? "smokeParticle.state");
  const initial = () => createSmokeParticleState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.kitId ?? "smoke-particle-domain",
    resources: { State },
    provides: ["smoke:particle-emitter", "smoke:wind-response", "render:smoke-particle-descriptor"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const getState = () => ensureResource(world, State, initial);
      engine.smokeParticle = {
        getState,
        getSnapshot: () => clone(getState()),
        createDescriptor: createSmokeParticleDescriptor,
        getDescriptor: () => clone(getState().descriptor),
        reset() { const next = initial(); world.setResource(State, next); return next; }
      };
      engine.n = engine.n || {};
      engine.n.smokeParticle = engine.smokeParticle;
    },
    metadata: { version: SMOKE_PARTICLE_DOMAIN_VERSION, domain: "smoke-particle", purpose: "Create wind-reactive smoke particle descriptors for renderer adapters." }
  });
}

export default createSmokeParticleDomainKit;
