import { clone, createDefinitionFactory, defineInjectedRuntimeKit, number } from "../protokit-core/index.js";

export const RAPIER_PHYSICS_DOMAIN_KIT_VERSION = "0.2.0";
export const RAPIER_PHYSICS_ENGINE_NAMESPACE = "rapierPhysics";
export const RAPIER_PHYSICS_PROVIDER_ID = "rapier";

function vec3(value = {}, fallback = {}) {
  const source = Array.isArray(value)
    ? { x: value[0], y: value[1], z: value[2] }
    : value ?? {};
  return {
    x: number(source.x, number(fallback.x, 0)),
    y: number(source.y, number(fallback.y, 0)),
    z: number(source.z, number(fallback.z, 0))
  };
}

function quat(value = {}, fallback = {}) {
  const source = Array.isArray(value)
    ? { x: value[0], y: value[1], z: value[2], w: value[3] }
    : value ?? {};
  return {
    x: number(source.x, number(fallback.x, 0)),
    y: number(source.y, number(fallback.y, 0)),
    z: number(source.z, number(fallback.z, 0)),
    w: number(source.w, number(fallback.w, 1))
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function positionFrom(spec = {}) {
  return spec.transform?.position ?? spec.position ?? spec.translation ?? spec.transform ?? spec;
}

function rotationFrom(spec = {}) {
  return spec.transform?.rotation ?? spec.rotation ?? {};
}

function collisionFrom(spec = {}) {
  return spec.collision ?? spec.collider ?? spec;
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
    rapier: options.rapier ?? options.RAPIER ?? null,
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
  if (shape === "box" || shape === "cuboid") {
    return R.ColliderDesc.cuboid(
      number(spec.halfX ?? spec.x, 0.5),
      number(spec.halfY ?? spec.y, 0.5),
      number(spec.halfZ ?? spec.z, 0.5)
    );
  }
  if (shape === "cylinder") return R.ColliderDesc.cylinder(number(spec.halfHeight, 0.5), number(spec.radius, 0.5));
  return R.ColliderDesc.ball(number(spec.radius, 0.5));
}

function ensureNamespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[RAPIER_PHYSICS_ENGINE_NAMESPACE] || typeof engine.n[RAPIER_PHYSICS_ENGINE_NAMESPACE] !== "object") {
    engine.n[RAPIER_PHYSICS_ENGINE_NAMESPACE] = {};
  }
  return engine.n[RAPIER_PHYSICS_ENGINE_NAMESPACE];
}

function normalizeActor(spec = {}) {
  const collision = collisionFrom(spec);
  return {
    id: String(spec.id ?? spec.bodyId ?? spec.actorId ?? "actor"),
    kind: String(spec.kind ?? spec.type ?? "kinematic"),
    shape: collision.shape ?? collision.kind ?? "capsule",
    radius: number(collision.radius, 0.45),
    halfHeight: number(collision.halfHeight, 0.5),
    halfX: number(collision.halfX ?? collision.x, 0.5),
    halfY: number(collision.halfY ?? collision.y, 0.5),
    halfZ: number(collision.halfZ ?? collision.z, 0.5),
    transform: vec3(positionFrom(spec)),
    rotation: quat(rotationFrom(spec)),
    linearVelocity: vec3(spec.linearVelocity ?? spec.velocity),
    tags: asArray(spec.tags).map(String)
  };
}

function normalizeFixed(spec = {}, index = 0) {
  const collision = collisionFrom(spec);
  return {
    id: String(spec.id ?? spec.colliderId ?? `fixed-${index}`),
    bodyId: spec.bodyId == null ? null : String(spec.bodyId),
    shape: collision.shape ?? collision.kind ?? spec.shape ?? spec.kind ?? "ball",
    radius: number(collision.radius ?? spec.radius, 0.5),
    halfHeight: number(collision.halfHeight ?? spec.halfHeight, 0.5),
    halfX: number(collision.halfX ?? collision.x ?? spec.halfX ?? spec.x, 0.5),
    halfY: number(collision.halfY ?? collision.y ?? spec.halfY ?? spec.y, 0.5),
    halfZ: number(collision.halfZ ?? collision.z ?? spec.halfZ ?? spec.z, 0.5),
    transform: vec3(positionFrom(spec)),
    rotation: quat(rotationFrom(spec)),
    tags: asArray(spec.tags).map(String)
  };
}

function setBodyRotation(body, rotation) {
  try {
    body.setRotation?.(rotation, true);
  } catch {}
}

function createActorBodyDesc(R, actor) {
  const kind = actor.kind.toLowerCase();
  if (kind === "dynamic" && R.RigidBodyDesc.dynamic) return R.RigidBodyDesc.dynamic();
  if (kind === "fixed" && R.RigidBodyDesc.fixed) return R.RigidBodyDesc.fixed();
  return R.RigidBodyDesc.kinematicPositionBased();
}

function applyActor(runtime, actor) {
  if (!runtime.world || !hasRapier(runtime)) return;
  const R = runtime.rapier;
  let body = runtime.actorBodies.get(actor.id);
  if (!body) {
    const bodyDesc = createActorBodyDesc(R, actor)
      .setTranslation(actor.transform.x, actor.transform.y, actor.transform.z);
    body = runtime.world.createRigidBody(bodyDesc);
    const collider = runtime.world.createCollider(colliderDesc(R, actor), body);
    runtime.actorBodies.set(actor.id, body);
    runtime.actorColliders.set(actor.id, collider);
  }
  if (actor.kind.toLowerCase().includes("kinematic")) body.setNextKinematicTranslation?.(actor.transform);
  else body.setTranslation?.(actor.transform, true);
  setBodyRotation(body, actor.rotation);
  body.setLinvel?.(actor.linearVelocity, true);
}

function applyFixed(runtime, collider) {
  if (!runtime.world || !hasRapier(runtime)) return;
  const R = runtime.rapier;
  let body = runtime.fixedBodies.get(collider.id);
  if (!body) {
    body = runtime.world.createRigidBody(
      R.RigidBodyDesc.fixed().setTranslation(collider.transform.x, collider.transform.y, collider.transform.z)
    );
    const instance = runtime.world.createCollider(colliderDesc(R, collider), body);
    runtime.fixedBodies.set(collider.id, body);
    runtime.fixedColliders.set(collider.id, instance);
  } else {
    body.setTranslation?.(collider.transform, true);
  }
  setBodyRotation(body, collider.rotation);
}

function removeBody(runtime, bodyMap, colliderMap, id) {
  const body = bodyMap.get(id);
  if (body && runtime.world) {
    try {
      runtime.world.removeRigidBody?.(body);
    } catch {}
  }
  bodyMap.delete(id);
  colliderMap.delete(id);
}

function retireMissing(runtime, bodyMap, colliderMap, desiredIds) {
  for (const id of Array.from(bodyMap.keys())) {
    if (!desiredIds.has(id)) removeBody(runtime, bodyMap, colliderMap, id);
  }
}

function pairIntersects(runtime, state, actorId, fixedId, actorCollider, fixedCollider) {
  try {
    if (runtime.world.intersectionPair?.(actorCollider, fixedCollider)) return true;
  } catch {}
  try {
    let hit = false;
    runtime.world.contactPair?.(actorCollider, fixedCollider, () => { hit = true; });
    if (hit) return true;
  } catch {}
  const actor = state.actors[actorId]?.transform;
  const fixed = state.colliders[fixedId]?.transform;
  const radius = number(state.colliders[fixedId]?.radius, 0.5) + number(state.actors[actorId]?.radius, 0.45);
  return actor && fixed ? Math.hypot(actor.x - fixed.x, actor.z - fixed.z) <= radius : false;
}

function collectContacts(runtime, state, stepId = "physics-step") {
  if (!runtime.world || !hasRapier(runtime)) return [];
  const contacts = [];
  for (const [actorId, actorCollider] of runtime.actorColliders.entries()) {
    for (const [fixedId, fixedCollider] of runtime.fixedColliders.entries()) {
      if (!pairIntersects(runtime, state, actorId, fixedId, actorCollider, fixedCollider)) continue;
      contacts.push({
        contactId: `${stepId}:${actorId}:${fixedId}`,
        actorId,
        colliderId: fixedId,
        bodyA: actorId,
        bodyB: fixedId,
        colliderA: actorId,
        colliderB: fixedId,
        started: true,
        ended: false,
        type: "contact",
        point: { x: 0, y: 0, z: 0 },
        normal: { x: 0, y: 0, z: 0 },
        tags: Array.from(new Set([
          ...(state.actors[actorId]?.tags ?? []),
          ...(state.colliders[fixedId]?.tags ?? [])
        ])).sort()
      });
    }
  }
  return contacts;
}

function bodyResult(id, body, actor) {
  const translation = body?.translation?.() ?? actor.transform;
  const rotation = body?.rotation?.() ?? actor.rotation;
  const linearVelocity = body?.linvel?.() ?? actor.linearVelocity;
  return {
    bodyId: id,
    position: vec3(translation),
    rotation: quat(rotation),
    linearVelocity: vec3(linearVelocity),
    grounded: false,
    tags: actor.tags.slice()
  };
}

function stateFromMaps(actorDescriptors, colliderDescriptors, gravity, fixedDt, stepCount = 0) {
  return {
    version: RAPIER_PHYSICS_DOMAIN_KIT_VERSION,
    enabled: true,
    configured: true,
    gravity: vec3(gravity),
    fixedDt: number(fixedDt, 1 / 60),
    actors: Object.fromEntries(Array.from(actorDescriptors.entries()).map(([id, value]) => [id, clone(value)])),
    colliders: Object.fromEntries(Array.from(colliderDescriptors.entries()).map(([id, value]) => [id, clone(value)])),
    contacts: [],
    diagnostics: [],
    stepCount,
    lastReason: "provider-state"
  };
}

export function createRapierPhysicsProvider(options = {}) {
  const runtime = createRuntime(options);
  const gravity = vec3(options.gravity, { x: 0, y: -34, z: 0 });
  const fixedDt = number(options.fixedDt, 1 / 60);
  const actorDescriptors = new Map();
  const colliderDescriptors = new Map();
  let motionRequests = [];
  let lastFrame = null;
  let stepCount = 0;
  let initialized = false;
  let disposed = false;

  function ensureWorld() {
    if (!hasRapier(runtime)) throw new Error("Rapier physics provider requires a Rapier module.");
    if (!runtime.world) createWorld(runtime, { gravity });
    initialized = true;
    disposed = false;
  }

  function syncActors(descriptors = []) {
    ensureWorld();
    const normalized = asArray(descriptors).map(normalizeActor);
    const desired = new Set(normalized.map((entry) => entry.id));
    retireMissing(runtime, runtime.actorBodies, runtime.actorColliders, desired);
    actorDescriptors.clear();
    for (const actor of normalized) {
      actorDescriptors.set(actor.id, actor);
      applyActor(runtime, actor);
    }
    return normalized;
  }

  function syncFixed(descriptors = []) {
    ensureWorld();
    const normalized = asArray(descriptors).map(normalizeFixed);
    const desired = new Set(normalized.map((entry) => entry.id));
    retireMissing(runtime, runtime.fixedBodies, runtime.fixedColliders, desired);
    colliderDescriptors.clear();
    for (const collider of normalized) {
      colliderDescriptors.set(collider.id, collider);
      applyFixed(runtime, collider);
    }
    return normalized;
  }

  function applyMotionRequests() {
    for (const request of motionRequests) {
      const id = String(request.bodyId ?? request.actorId ?? "");
      if (!id || !actorDescriptors.has(id)) continue;
      const previous = actorDescriptors.get(id);
      const next = normalizeActor({
        ...previous,
        id,
        transform: request.position ?? request.transform?.position ?? request.transform ?? previous.transform,
        rotation: request.rotation ?? request.transform?.rotation ?? previous.rotation,
        linearVelocity: request.linearVelocity ?? request.velocity ?? previous.linearVelocity
      });
      actorDescriptors.set(id, next);
      applyActor(runtime, next);
    }
    motionRequests = [];
  }

  const provider = {
    id: String(options.id ?? RAPIER_PHYSICS_PROVIDER_ID),
    initialize() {
      ensureWorld();
      return provider.id;
    },
    syncBodies(descriptors = []) {
      return clone(syncActors(descriptors));
    },
    syncColliders(descriptors = []) {
      return clone(syncFixed(descriptors));
    },
    submitMotionRequests(requests = []) {
      motionRequests = asArray(requests).map((entry, index) => ({
        ...clone(entry),
        id: String(entry?.id ?? `motion-${index}`),
        bodyId: String(entry?.bodyId ?? entry?.actorId ?? "")
      }));
      return clone(motionRequests);
    },
    step(tickContext = {}) {
      ensureWorld();
      applyMotionRequests();
      runtime.world.timestep = number(tickContext.delta, fixedDt);
      runtime.world.step();
      stepCount += 1;
      const stepId = String(tickContext.tickId ?? `tick:${stepCount}`);
      const state = stateFromMaps(actorDescriptors, colliderDescriptors, gravity, fixedDt, stepCount);
      const contacts = collectContacts(runtime, state, stepId);
      lastFrame = {
        stepId,
        tickId: stepId,
        frame: number(tickContext.frame, stepCount),
        providerId: provider.id,
        bodyResults: Array.from(actorDescriptors.entries())
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([id, actor]) => bodyResult(id, runtime.actorBodies.get(id), actor)),
        contacts
      };
      structuredClone(lastFrame);
      return clone(lastFrame);
    },
    getFrame() {
      return clone(lastFrame);
    },
    getSnapshot() {
      return clone({
        id: provider.id,
        initialized,
        disposed,
        gravity,
        fixedDt,
        stepCount,
        bodies: Array.from(actorDescriptors.values()),
        colliders: Array.from(colliderDescriptors.values()),
        lastFrame
      });
    },
    reset() {
      actorDescriptors.clear();
      colliderDescriptors.clear();
      motionRequests = [];
      lastFrame = null;
      stepCount = 0;
      createWorld(runtime, { gravity });
      initialized = hasRapier(runtime);
      disposed = false;
      return true;
    },
    dispose() {
      runtime.world?.free?.();
      runtime.world = null;
      runtime.actorBodies.clear();
      runtime.actorColliders.clear();
      runtime.fixedBodies.clear();
      runtime.fixedColliders.clear();
      actorDescriptors.clear();
      colliderDescriptors.clear();
      motionRequests = [];
      lastFrame = null;
      initialized = false;
      disposed = true;
      return true;
    }
  };

  return provider;
}

export function createRapierPhysicsDefinitions(NexusEngine = {}, options = {}) {
  const defs = createDefinitionFactory(NexusEngine);
  const prefix = options.namespace ?? RAPIER_PHYSICS_ENGINE_NAMESPACE;
  return {
    resources: { RapierPhysicsState: defs.resource(`${prefix}.state`) },
    events: {
      RapierPhysicsConfigured: defs.event(`${prefix}.configured`),
      RapierPhysicsStepped: defs.event(`${prefix}.stepped`),
      RapierPhysicsContact: defs.event(`${prefix}.contact`),
      RapierPhysicsRejected: defs.event(`${prefix}.rejected`)
    }
  };
}

export function createRapierPhysicsKit(NexusEngine = {}, options = {}) {
  const definitions = createRapierPhysicsDefinitions(NexusEngine, options);
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
    const contacts = collectContacts(runtime, state, `legacy:${number(state.stepCount, 0) + 1}`);
    const next = { ...clone(state), contacts, stepCount: number(state.stepCount, 0) + 1, lastReason: "system-step" };
    world.setResource(resources.RapierPhysicsState, next);
    world.emit?.(events.RapierPhysicsStepped, { stepCount: next.stepCount, contactCount: contacts.length });
    for (const contact of contacts) world.emit?.(events.RapierPhysicsContact, contact);
  }

  return defineInjectedRuntimeKit(NexusEngine, {
    id: options.id ?? "rapier-physics-domain-kit",
    resources,
    events,
    systems: options.autoStep === false ? [] : [{ phase: options.phase ?? "simulate", name: "rapierPhysicsSystem", system }],
    provides: ["physics:rapier", "physics:provider", "physics:rigid-bodies", "physics:colliders", "physics:contacts"],
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
          const next = {
            ...current,
            gravity: vec3(config.gravity, current.gravity),
            fixedDt: number(config.fixedDt, current.fixedDt),
            configured: true,
            enabled: hasRapier(runtime),
            diagnostics: hasRapier(runtime) ? [] : [{ type: "missing-rapier-module" }],
            lastReason: "configured"
          };
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
          const normalizedEntries = asArray(colliders).map((entry, index) => normalizeFixed(entry, index));
          const normalized = Object.fromEntries(normalizedEntries.map((entry) => [entry.id, entry]));
          retireMissing(runtime, runtime.fixedBodies, runtime.fixedColliders, new Set(Object.keys(normalized)));
          for (const collider of normalizedEntries) applyFixed(runtime, collider);
          const next = { ...clone(state), colliders: normalized, lastReason: "fixed-colliders" };
          world.setResource(resources.RapierPhysicsState, next);
          return clone(Object.values(normalized));
        },
        step(dt = 1 / 60) {
          const state = world.getResource(resources.RapierPhysicsState) ?? createState(options);
          if (!state.enabled || !runtime.world) return reject(world, "rapier-not-enabled");
          runtime.world.timestep = number(dt, state.fixedDt);
          runtime.world.step();
          const contacts = collectContacts(runtime, state, `legacy:${number(state.stepCount, 0) + 1}`);
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
        },
        dispose() {
          runtime.world?.free?.();
          runtime.world = null;
          runtime.actorBodies.clear();
          runtime.actorColliders.clear();
          runtime.fixedBodies.clear();
          runtime.fixedColliders.clear();
          return true;
        }
      };
      if (namespace) Object.assign(namespace, api);
      engine.rapierPhysics = api;
    },
    metadata: {
      version: RAPIER_PHYSICS_DOMAIN_KIT_VERSION,
      domain: "rapier-physics",
      boundary: "Owns the Rapier backend adapter and legacy Rapier runtime kit. Does not own renderer objects, terrain generation, movement rules, gameplay outcomes, camera, score, scene transitions, browser input, Rapier download, or asset loading.",
      providerFactory: "createRapierPhysicsProvider"
    }
  });
}

export default createRapierPhysicsKit;
