export const ENEMY_BODY_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = 1) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createEnemyBodyDomainKit requires NexusEngine.${key}.`);
  }
}

function createDescriptor(input = {}) {
  const height = Math.max(0.25, toNumber(input.height, 2.2));
  const radius = Math.max(0.05, toNumber(input.radius, 0.45));
  const scale = Math.max(0.1, toNumber(input.scale, 1));
  return {
    id: String(input.id ?? input.enemyId ?? "enemy-body"),
    archetype: String(input.archetype ?? "humanoid-threat"),
    scale,
    height: height * scale,
    radius: radius * scale,
    hitCapsule: {
      radius: radius * scale,
      height: height * scale
    },
    parts: {
      torso: { y: height * scale * 0.52, radius: radius * scale },
      head: { y: height * scale * 0.9, radius: radius * scale * 0.42 },
      leftArm: { length: height * scale * 0.38 },
      rightArm: { length: height * scale * 0.38 },
      lowerTrail: { length: height * scale * 0.42 },
      aura: { radius: radius * scale * 2.7 }
    },
    materialHint: input.materialHint ?? "enemy-body"
  };
}

function createState(config = {}) {
  return { version: ENEMY_BODY_DOMAIN_KIT_VERSION, id: config.stateId ?? "enemy-body-domain", domain: "enemy-body", bodies: [], bodiesById: {}, lastBody: null };
}

export function createEnemyBodyDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const EnemyBodyState = defineResource(config.resourceName ?? "enemyBodyDomain.state");
  const EnemyBodyDescribed = defineEvent("enemyBody.described");

  return defineRuntimeKit({
    id: config.kitId ?? "enemy-body-domain-kit",
    provides: ["n:enemy-body", "enemy:body-descriptor", "combat:hit-capsule"],
    resources: { EnemyBodyState },
    events: { EnemyBodyDescribed },
    systems: [],
    initWorld({ world }) { world.setResource(EnemyBodyState, createState(config)); },
    install({ engine, world }) {
      engine.enemyBodyDomain = {
        describe(input = {}) {
          const descriptor = createDescriptor(input);
          const state = world.getResource(EnemyBodyState) ?? createState(config);
          const bodies = [...state.bodies.filter((item) => item.id !== descriptor.id), descriptor];
          const next = { ...state, bodies, bodiesById: Object.fromEntries(bodies.map((item) => [item.id, item])), lastBody: descriptor };
          world.setResource(EnemyBodyState, next);
          world.emit(EnemyBodyDescribed, descriptor);
          return clone(descriptor);
        },
        getState() { return clone(world.getResource(EnemyBodyState)); }
      };
    },
    metadata: { domain: "enemy-body", parentDomain: "enemy-object", scope: "atomic-domain", extendsBase: "DomainServiceKit", composes: ["enemy-object-domain-kit", "hitbox-body-domain-kit", "render-descriptor-domain-kit"], ownsLoop: false, purpose: "Turns enemies from billboard concepts into renderer-independent body and hit-capsule descriptors." }
  });
}

export default createEnemyBodyDomainKit;
