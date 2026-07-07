import { clone, createDefinitionFactory, defineInjectedRuntimeKit, number } from "../protokit-core/index.js";

export const RAPIER_PHYSICS_DOMAIN_KIT_VERSION = "0.1.0";
export const RAPIER_PHYSICS_ENGINE_NAMESPACE = "rapierPhysics";

function vec3(value = {}, fallback = {}) {
  return {
    x: number(value.x, number(fallback.x, 0)),
    y: number(value.y, number(fallback.y, 0)),
    z: number(value.z, number(fallback.z, 0))
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function createState(options = {}) {
  return {
    version: RAPIER_PHYSICS_DOMAIN_KIT_VERSION,
    enabled: false,
    configured: false,
    gravity: vec3(options.gravity, { x: 0, y: -34, z: 0 }),
    fixedDt: number(options.fixedDt, 1 / 60),
    actors: {},
    colliders: {},
    contacts: [],
    diagnostics: [],
    stepCount: 0,
    lastReason: "initialized"
  };
}

function createRuntime(options = {}) {
  return {
    rapier: options.rapier ?? null,
    world: null,
    actorBodies: new Map(),
    actorColliders: new Map(),
    fixedBodies: new Map(),
    fixedColliders: new Map()
  };
}

function hasRapier(runtime) {
  const R = runtime.rapier;
  return Boolean(R?.World && R?.RigidBodyDesc && R?.ColliderDesc);
}

function createWorld(runtime, state) {
  if (!hasRapier(runtime)) return null;
  runtime.world = new runtime.rapier.World(state.gravity);
  runtime.actorBodies.clear();
  runtime.actorColliders.clear();
  runtime.fixedBodies.clear();
  runtime.fixedColliders.clear();
  return runtime.world;
}

function colliderDesc(R, spec = {}) {
  const shape = spec.shape ?? spec.kind ?? "ball";
  if (shape === "capsule") return R.ColliderDesc.capsule(number(spec.halfHeight, 0.5), number(spec.radius, 0.45));
  if (shape === "box" || shape === "cuboid") return R.ColliderDesc.cuboid(number(spec.halfX ?? spec.x, 0.5), number(spec.halfY ?? spec.y, 0.5), number(spec.halfZ ?? spec.z, 0.5));
  if (shape === "cylinder") return R.ColliderDesc.cylinder(number(spec.halfHeight, 0.5), number(spec.radius, 0.5));
  return R.ColliderDesc.ball(number(spec.radius, 0.5));
}

function ensureNamespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[RAPIER_PHYSICS_ENGINE_NAMESPACE] || typeof engine.n[RAPIER_PHYSICS_ENGINE_NAMESPACE] !== "object") engine.n[RAPIER_PHYSICS_ENGINE_NAMESPACE] = {};
  return engine.n[RAPIER_PHYSICS_ENGINE_NAMESPACE];
}

function normalizeActor(spec = {}) {
  return {
    id: String(spec.id ?? spec.actorId ?? "actor"),
    shape: spec.shape ?? "capsule",
    radius: number(spec.radius, 0.45),
    halfHeight: number(spec.halfHeight, 0.5),
    transform: vec3(spec.transform ?? spec.position),
    tags: asArray(spec.tags)
  };
}

function normalizeFixed(spec = {}, index = 0) {
  return {
    id: String(spec.id ?? `fixed-${index}`),
    shape: spec.shape ?? spec.kind ?? "ball",
    radius: number(spec.radius, 0.5),
    halfHeight: number(spec.halfHeight, 0.5),
    halfX: number(spec.halfX ?? spec.x, 0.5),
    halfY: number(spec.halfY ?? spec.y, 0.5),
    halfZ: number(spec.halfZ ?? spec.z, 0.5),
    transform: vec3(spec.transform ?? spec.position ?? spec),
    tags: asArray(spec.tags)
  };
}

function applyActor(runtime, actor) {
  if (!runtime.world || !hasRapier(runtime)) return;
  const R = runtime.rapier;
  let body = runtime.actorBodies.get(actor.id);
  if (!body) {
    body = runtime.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(actor.transform.x, actor.transform.y, actor.transform.z));
    const collider = runtime.world.createCollider(colliderDesc(R, actor), body);
    runtime.actorBodies.set(actor.id, body);
    runtime.actorColliders.set(actor.id, collider);
  }
  body.setNextKinematicTranslation(actor.transform);
}

function applyFixed(runtime, collider) {
  if (!runtime.world || !hasRapier(runtime)) return;
  const R = runtime.rapier;
  let body = runtime.fixedBodies.get(collider.id);
  if (!body) {
    body = runtime.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(collider.transform.x, collider.transform.y, collider.transform.z));
    const instance = runtime.world.createCollider(colliderDesc(R, collider), body);
    runtime.fixedBodies.set(collider.id, body);
    runtime.fixedColliders.set(collider.id, instance);
  } else {
    body.setTranslation(collider.transform, true);
  }
}

function collectContacts(runtime, state) {
  if (!runtime.world || !hasRapier(runtime)) return [];
  const contacts = [];
  const R = runtime.rapier;
  for (const [actorId, actorCollider] of runtime.actorColliders.entries()) {
    for (const [fixedId, fixedCollider] of runtime.fixedColliders.entries()) {
      let intersects = false;
      try {
        intersects = Boolean(runtime.world.intersectionPair?.(actorCollider, fixedCollider));
      } catch {}
      if (!intersects) {
        try {
          const actor = state.actors[actorId]?.transform;
          const fixed = state.colliders[fixedId]?.transform;
          const radius = number(state.colliders[fixedId]?.radius, 0.5) + number(state.actors[actorId]?.radius, 0.45);
          intersects = actor && fixed ? Math.hypot(actor.x - fixed.x, actor.z - fixed.z) <= radius : false;
        } catch {}
      }
      if (intersects) contacts.push({ actorId, colliderId: fixedId, type: "intersection" });
    }
  }
  return contacts;
}

export function createRapierPhysicsDefinitions(NexusRealtime = {}, options = {}) {
  const defs = createDefinitionFactory(NexusRealtime);
  const prefix = options.namespace ?? RAPIER_PHYSICS_ENGINE_NAMESPACE;
  return {
    resources: {
      RapierPhysicsState: defs.resource(`${prefix}.state`)
    },
    events: {
      RapierPhysicsConfigured: defs.event(`${prefix}.configured`),
      RapierPhysicsStepped: defs.event(`${prefix}.stepped`),
      RapierPhysicsContact: defs.event(`${prefix}.contact`),
      RapierPhysicsRejected: defs.event(`${prefix}.rejected`)
    }
  };
}

export function createRapierPhysicsKit(NexusRealtime = {}, options = {}) {
  const definitions = createRapierPhysicsDefinitions(NexusRealtime, options);
  const { resources, events } = definitions;
  const runtime = createRuntime(options);

  function reject(world, reason, payload = {}) {
    world.emit?.(events.RapierPhysicsRejected, { reason, ...payload });
    return { accepted: false, reason };
  }

  function system(world) {
    const state = world.getResource(resources.RapierPhysicsState) ?? createState(options);
    if (!runtime.world || !state.enabled) return;
    runtime.world.step();
    const contacts = collectContacts(runtime, state);
    const next = { ...clone(state), contacts, stepCount: number(state.stepCount, 0) + 1, lastReason: "system-step" };
    world.setResource(resources.RapierPhysicsState, next);
    world.emit?.(events.RapierPhysicsStepped, { stepCount: next.stepCount, contactCount: contacts.length });
    for (const contact of contacts) world.emit?.(events.RapierPhysicsContact, contact);
  }

  return defineInjectedRuntimeKit(NexusRealtime, {
    id: options.id ?? "rapier-physics-domain-kit",
    resources,
    events,
    systems: [{ phase: options.phase ?? "simulate", name: "rapierPhysicsSystem", system }],
    provides: ["physics:rapier", "physics:rigid-bodies", "physics:colliders", "physics:contacts"],
    requires: [],
    initWorld({ world }) {
      world.setResource(resources.RapierPhysicsState, createState(options));
    },
    install({ engine, world }) {
      const namespace = ensureNamespace(engine);
      const api = {
        definitions,
        configure(config = {}) {
          const current = world.getResource(resources.RapierPhysicsState) ?? createState(options);
          runtime.rapier = config.rapier ?? config.RAPIER ?? runtime.rapier ?? options.rapier ?? null;
          const next = { ...current, gravity: vec3(config.gravity, current.gravity), fixedDt: number(config.fixedDt, current.fixedDt), configured: true, enabled: hasRapier(runtime), diagnostics: hasRapier(runtime) ? [] : [{ type: "missing-rapier-module" }], lastReason: "configured" };
          createWorld(runtime, next);
          world.setResource(resources.RapierPhysicsState, next);
          world.emit?.(events.RapierPhysicsConfigured, { enabled: next.enabled });
          return clone(next);
        },
        registerKinematicActor(spec = {}) {
          const state = world.getResource(resources.RapierPhysicsState) ?? createState(options);
          const actor = normalizeActor(spec);
          const next = { ...clone(state), actors: { ...state.actors, [actor.id]: actor }, lastReason: "actor-registered" };
          applyActor(runtime, actor);
          world.setResource(resources.RapierPhysicsState, next);
          return clone(actor);
        },
        setActorTransform(actorId, transform = {}) {
          const state = world.getResource(resources.RapierPhysicsState) ?? createState(options);
          const id = String(actorId);
          const actor = normalizeActor({ ...(state.actors[id] ?? { id }), transform });
          const next = { ...clone(state), actors: { ...state.actors, [id]: actor }, lastReason: "actor-transform" };
          applyActor(runtime, actor);
          world.setResource(resources.RapierPhysicsState, next);
          return clone(actor);
        },
        setFixedColliders(colliders = []) {
          const state = world.getResource(resources.RapierPhysicsState) ?? createState(options);
          const normalized = Object.fromEntries(asArray(colliders).map((entry, index) => {
            const collider = normalizeFixed(entry, index);
            applyFixed(runtime, collider);
            return [collider.id, collider];
          }));
          const next = { ...clone(state), colliders: normalized, lastReason: "fixed-colliders" };
          world.setResource(resources.RapierPhysicsState, next);
          return clone(Object.values(normalized));
        },
        step(dt = 1 / 60) {
          const state = world.getResource(resources.RapierPhysicsState) ?? createState(options);
          if (!state.enabled || !runtime.world) return reject(world, "rapier-not-enabled");
          runtime.world.timestep = number(dt, state.fixedDt);
          runtime.world.step();
          const contacts = collectContacts(runtime, state);
          const next = { ...clone(state), contacts, stepCount: number(state.stepCount, 0) + 1, lastReason: "manual-step" };
          world.setResource(resources.RapierPhysicsState, next);
          for (const contact of contacts) world.emit?.(events.RapierPhysicsContact, contact);
          return clone(next);
        },
        getContacts() {
          return clone((world.getResource(resources.RapierPhysicsState) ?? createState(options)).contacts);
        },
        getSnapshot() {
          return clone(world.getResource(resources.RapierPhysicsState) ?? createState(options));
        },
        reset(config = {}) {
          const next = createState({ ...options, ...config });
          createWorld(runtime, next);
          world.setResource(resources.RapierPhysicsState, next);
          return clone(next);
        }
      };
      if (namespace) Object.assign(namespace, api);
      engine.rapierPhysics = api;
    },
    metadata: {
      version: RAPIER_PHYSICS_DOMAIN_KIT_VERSION,
      domain: "rapier-physics",
      boundary: "Owns Rapier-backed rigid-body and collider state. Does not own renderer objects, terrain generation, movement rules, camera, score, scene transitions, browser input, Rapier download, or asset loading.",
      apiSurface: {
        methods: ["engine.n.rapierPhysics.configure", "engine.n.rapierPhysics.registerKinematicActor", "engine.n.rapierPhysics.setActorTransform", "engine.n.rapierPhysics.setFixedColliders", "engine.n.rapierPhysics.step", "engine.n.rapierPhysics.getContacts", "engine.n.rapierPhysics.getSnapshot", "engine.n.rapierPhysics.reset"],
        events: ["rapierPhysics.configured", "rapierPhysics.stepped", "rapierPhysics.contact", "rapierPhysics.rejected"],
        resources: ["rapierPhysics.state"]
      }
    }
  });
}

export default createRapierPhysicsKit;
