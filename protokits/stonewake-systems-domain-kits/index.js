const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const toBool = (value) => value === true || value === "true" || value === 1;

export const STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION = "0.1.0";

function requireNexus(NexusRealtime, factoryName) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`${factoryName} requires NexusRealtime.${key}.`);
    }
  }
}

function ensureNamespace(engine, namespace) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[namespace] || typeof engine.n[namespace] !== "object") engine.n[namespace] = {};
  return engine.n[namespace];
}

function writeState(world, resource, state) {
  world.setResource(resource, clone(state));
  return clone(state);
}

function readState(world, resource, fallback) {
  return clone(world.getResource(resource) ?? fallback);
}

function distance(a = {}, b = {}) {
  const dx = toNumber(a.x, 0) - toNumber(b.x, 0);
  const dy = toNumber(a.y, 0) - toNumber(b.y, 0);
  const dz = toNumber(a.z, 0) - toNumber(b.z, 0);
  return Math.hypot(dx, dy, dz);
}

function eventPayload(id, payload = {}) {
  return { id, commandId: payload.commandId ?? payload.signalId ?? payload.operationId ?? `${id}:${Date.now?.() ?? 0}`, ...payload };
}

export function createAcousticSignalDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime, "createAcousticSignalDomainKit");
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const AcousticSignalState = defineResource(config.resourceName ?? "acousticSignal.state");
  const SignalEmitted = defineEvent("acousticSignal.emitted");
  const SignalReachedListener = defineEvent("acousticSignal.reachedListener");
  const SignalExpired = defineEvent("acousticSignal.expired");
  const Rejected = defineEvent("acousticSignal.rejected");

  const initial = () => ({
    version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION,
    id: config.id ?? "acoustic-signal-domain",
    tick: 0,
    signals: [],
    listeners: [],
    listenerHits: [],
    consumedHitIds: [],
    descriptors: []
  });

  const descriptorForSignal = (signal) => ({
    id: signal.id,
    kind: "acoustic-signal",
    position: clone(signal.position),
    radius: signal.radius,
    maxRadius: signal.maxRadius,
    intensity: signal.intensity,
    sourceId: signal.sourceId,
    expired: signal.expired
  });

  function system(world) {
    const state = readState(world, AcousticSignalState, initial());
    const dt = toNumber(world.__nexusDelta, 1 / 60);
    state.tick = toNumber(world.__nexusClock?.frame, state.tick + 1);
    const nextSignals = [];

    for (const signal of state.signals) {
      if (signal.expired) continue;
      const next = { ...signal, radius: toNumber(signal.radius, 0) + toNumber(signal.speed, config.defaultSpeed ?? 220) * dt };
      for (const listener of state.listeners) {
        if (listener.disabled) continue;
        const hitId = `${next.id}->${listener.id}`;
        if (state.consumedHitIds.includes(hitId)) continue;
        const reachDistance = distance(next.position, listener.position);
        const listenerRadius = toNumber(listener.radius, 0);
        if (reachDistance <= next.radius + listenerRadius && reachDistance <= toNumber(next.maxRadius, 0) + listenerRadius) {
          const hit = {
            id: hitId,
            signalId: next.id,
            listenerId: listener.id,
            sourceId: next.sourceId,
            position: clone(next.position),
            listenerPosition: clone(listener.position),
            distance: reachDistance,
            intensity: next.intensity,
            tick: state.tick
          };
          state.listenerHits.push(hit);
          state.consumedHitIds.push(hitId);
          world.emit?.(SignalReachedListener, clone(hit));
        }
      }
      if (next.radius >= toNumber(next.maxRadius, 0)) {
        next.expired = true;
        world.emit?.(SignalExpired, { id: next.id, sourceId: next.sourceId, tick: state.tick });
      } else {
        nextSignals.push(next);
      }
    }

    state.signals = nextSignals;
    state.listenerHits = state.listenerHits.slice(-toNumber(config.maxHitHistory, 64));
    state.consumedHitIds = state.consumedHitIds.slice(-toNumber(config.maxConsumedHits, 256));
    state.descriptors = state.signals.map(descriptorForSignal);
    writeState(world, AcousticSignalState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "acoustic-signal-domain-kit",
    provides: ["acoustic:signals", "sensory:hearing-source", "render:acoustic-descriptors"],
    resources: { AcousticSignalState },
    events: { SignalEmitted, SignalReachedListener, SignalExpired, Rejected },
    systems: [{ phase: config.phase ?? "simulate", name: "acousticSignalDomainSystem", system }],
    initWorld({ world }) { writeState(world, AcousticSignalState, initial()); },
    install({ engine, world }) {
      const api = {
        resources: { AcousticSignalState },
        events: { SignalEmitted, SignalReachedListener, SignalExpired, Rejected },
        emitSignal(payload = {}) {
          const state = readState(world, AcousticSignalState, initial());
          const signal = {
            id: String(payload.id ?? payload.signalId ?? `signal-${state.tick}-${state.signals.length + 1}`),
            sourceId: String(payload.sourceId ?? "unknown"),
            position: clone(payload.position ?? { x: 0, y: 0, z: 0 }),
            radius: Math.max(0, toNumber(payload.radius, 0)),
            maxRadius: Math.max(1, toNumber(payload.maxRadius, toNumber(payload.intensity, 1) * toNumber(config.radiusPerIntensity, 160))),
            speed: Math.max(0, toNumber(payload.speed, config.defaultSpeed ?? 220)),
            intensity: Math.max(0, toNumber(payload.intensity, 1)),
            tags: asArray(payload.tags),
            expired: false
          };
          state.signals.push(signal);
          world.emit?.(SignalEmitted, clone(signal));
          return writeState(world, AcousticSignalState, state);
        },
        registerListener(payload = {}) {
          const state = readState(world, AcousticSignalState, initial());
          const listener = {
            id: String(payload.id ?? payload.listenerId),
            ownerId: payload.ownerId ?? payload.id,
            position: clone(payload.position ?? { x: 0, y: 0, z: 0 }),
            radius: Math.max(0, toNumber(payload.radius, 0)),
            disabled: Boolean(payload.disabled),
            tags: asArray(payload.tags)
          };
          if (!listener.id) {
            world.emit?.(Rejected, { reason: "listener-id-required" });
            return { accepted: false, reason: "listener-id-required" };
          }
          state.listeners = state.listeners.filter((item) => item.id !== listener.id).concat(listener);
          return writeState(world, AcousticSignalState, state);
        },
        moveListener(listenerId, position = {}) {
          const state = readState(world, AcousticSignalState, initial());
          state.listeners = state.listeners.map((listener) => listener.id === listenerId ? { ...listener, position: clone(position) } : listener);
          return writeState(world, AcousticSignalState, state);
        },
        consumeHits(listenerId) {
          const state = readState(world, AcousticSignalState, initial());
          const hits = state.listenerHits.filter((hit) => hit.listenerId === listenerId);
          state.listenerHits = state.listenerHits.filter((hit) => hit.listenerId !== listenerId);
          writeState(world, AcousticSignalState, state);
          return clone(hits);
        },
        getState() { return readState(world, AcousticSignalState, initial()); },
        getDescriptors() { return this.getState().descriptors; },
        reset() { return writeState(world, AcousticSignalState, initial()); }
      };
      engine.acousticSignal = api;
      Object.assign(ensureNamespace(engine, "acousticSignal") ?? {}, api);
    },
    metadata: {
      version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION,
      domain: "acoustic-signal",
      layer: "small-domain",
      extendsBase: "DomainServiceKit",
      ownsLoop: true,
      boundary: "Owns gameplay sound signals, listener reach, hit dedupe, and renderer-safe acoustic descriptors. It does not play audio or draw waves."
    }
  });
}

export function createWeightedTriggerDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime, "createWeightedTriggerDomainKit");
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const WeightedTriggerState = defineResource(config.resourceName ?? "weightedTrigger.state");
  const TriggerActivated = defineEvent("weightedTrigger.activated");
  const TriggerReleased = defineEvent("weightedTrigger.released");
  const TriggerWeightChanged = defineEvent("weightedTrigger.weightChanged");

  const initial = () => ({ version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION, triggers: [], weightSources: [], descriptors: [], tick: 0 });
  const boundsContains = (bounds = {}, position = {}) => {
    const x = toNumber(position.x, 0);
    const y = toNumber(position.y, 0);
    const z = toNumber(position.z, 0);
    return x >= toNumber(bounds.x, -Infinity) && x <= toNumber(bounds.x, 0) + toNumber(bounds.w, Infinity)
      && y >= toNumber(bounds.y, -Infinity) && y <= toNumber(bounds.y, 0) + toNumber(bounds.h, Infinity)
      && z >= toNumber(bounds.z, -Infinity) && z <= toNumber(bounds.z, 0) + toNumber(bounds.d, Infinity);
  };

  function system(world) {
    const state = readState(world, WeightedTriggerState, initial());
    state.tick = toNumber(world.__nexusClock?.frame, state.tick + 1);
    state.triggers = state.triggers.map((trigger) => {
      const previousActive = Boolean(trigger.active);
      const sources = state.weightSources.filter((source) => !source.disabled && boundsContains(trigger.bounds, source.position));
      const weight = sources.reduce((sum, source) => sum + toNumber(source.weight, 1), 0);
      const active = weight >= toNumber(trigger.requiredWeight, 1);
      const next = { ...trigger, weight, active, activeSourceIds: sources.map((source) => source.id), tick: state.tick };
      if (weight !== toNumber(trigger.weight, 0)) world.emit?.(TriggerWeightChanged, { id: trigger.id, weight, active, sourceIds: next.activeSourceIds });
      if (active && !previousActive) world.emit?.(TriggerActivated, { id: trigger.id, weight, sourceIds: next.activeSourceIds });
      if (!active && previousActive) world.emit?.(TriggerReleased, { id: trigger.id, weight, sourceIds: next.activeSourceIds });
      return next;
    });
    state.descriptors = state.triggers.map((trigger) => ({ id: trigger.id, kind: "weighted-trigger", bounds: clone(trigger.bounds), weight: trigger.weight, requiredWeight: trigger.requiredWeight, active: trigger.active, sourceIds: trigger.activeSourceIds ?? [] }));
    writeState(world, WeightedTriggerState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "weighted-trigger-domain-kit",
    provides: ["trigger:weighted", "condition:fact-source", "render:trigger-descriptors"],
    resources: { WeightedTriggerState },
    events: { TriggerActivated, TriggerReleased, TriggerWeightChanged },
    systems: [{ phase: config.phase ?? "resolve", name: "weightedTriggerDomainSystem", system }],
    initWorld({ world }) { writeState(world, WeightedTriggerState, initial()); },
    install({ engine, world }) {
      const api = {
        registerTrigger(payload = {}) {
          const state = readState(world, WeightedTriggerState, initial());
          const trigger = { id: String(payload.id), bounds: clone(payload.bounds ?? {}), requiredWeight: Math.max(0, toNumber(payload.requiredWeight, 1)), active: false, weight: 0, activeSourceIds: [] };
          state.triggers = state.triggers.filter((item) => item.id !== trigger.id).concat(trigger);
          return writeState(world, WeightedTriggerState, state);
        },
        setWeightSource(payload = {}) {
          const state = readState(world, WeightedTriggerState, initial());
          const source = { id: String(payload.id ?? payload.sourceId), position: clone(payload.position ?? { x: 0, y: 0, z: 0 }), weight: Math.max(0, toNumber(payload.weight, 1)), disabled: Boolean(payload.disabled), tags: asArray(payload.tags) };
          state.weightSources = state.weightSources.filter((item) => item.id !== source.id).concat(source);
          return writeState(world, WeightedTriggerState, state);
        },
        removeWeightSource(sourceId) {
          const state = readState(world, WeightedTriggerState, initial());
          state.weightSources = state.weightSources.filter((source) => source.id !== sourceId);
          return writeState(world, WeightedTriggerState, state);
        },
        isActive(triggerId) { return Boolean(this.getState().triggers.find((trigger) => trigger.id === triggerId)?.active); },
        getState() { return readState(world, WeightedTriggerState, initial()); },
        getDescriptors() { return this.getState().descriptors; },
        reset() { return writeState(world, WeightedTriggerState, initial()); }
      };
      engine.weightedTrigger = api;
      Object.assign(ensureNamespace(engine, "weightedTrigger") ?? {}, api);
    },
    metadata: { version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION, domain: "weighted-trigger", layer: "small-domain", extendsBase: "DomainServiceKit", ownsLoop: true, boundary: "Owns weight-based trigger facts for plates, counterweights, and balance systems. It does not own object art, door behavior, or renderer collision drawing." }
  });
}

export function createConditionGateDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime, "createConditionGateDomainKit");
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const ConditionGateState = defineResource(config.resourceName ?? "conditionGate.state");
  const GateOpened = defineEvent("conditionGate.opened");
  const GateClosed = defineEvent("conditionGate.closed");
  const GateProgressChanged = defineEvent("conditionGate.progressChanged");
  const initial = () => ({ version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION, facts: {}, gates: [], descriptors: [], tick: 0 });

  function system(world) {
    const state = readState(world, ConditionGateState, initial());
    const dt = toNumber(world.__nexusDelta, 1 / 60);
    state.tick = toNumber(world.__nexusClock?.frame, state.tick + 1);
    state.gates = state.gates.map((gate) => {
      const previousOpen = gate.state === "open";
      const mode = String(gate.mode ?? "all");
      const values = asArray(gate.conditions).map((id) => toBool(state.facts[id]));
      const conditionsMet = values.length === 0 ? true : mode === "any" ? values.some(Boolean) : values.every(Boolean);
      const speed = Math.max(0, toNumber(gate.openRate, 0.75));
      const closeRate = Math.max(0, toNumber(gate.closeRate, speed));
      const target = conditionsMet ? 1 : 0;
      const rate = target > toNumber(gate.progress, 0) ? speed : closeRate;
      const progress = Math.max(0, Math.min(1, toNumber(gate.progress, 0) + Math.sign(target - toNumber(gate.progress, 0)) * rate * dt));
      const nextState = progress >= 1 ? "open" : progress <= 0 ? "closed" : conditionsMet ? "opening" : "closing";
      const next = { ...gate, progress, state: nextState, conditionsMet, tick: state.tick };
      if (progress !== gate.progress) world.emit?.(GateProgressChanged, { id: gate.id, progress, state: nextState });
      if (!previousOpen && nextState === "open") world.emit?.(GateOpened, { id: gate.id });
      if (previousOpen && nextState !== "open") world.emit?.(GateClosed, { id: gate.id });
      return next;
    });
    state.descriptors = state.gates.map((gate) => ({ id: gate.id, kind: "condition-gate", state: gate.state, progress: gate.progress, conditions: clone(gate.conditions), conditionsMet: gate.conditionsMet }));
    writeState(world, ConditionGateState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "condition-gate-domain-kit",
    provides: ["gate:condition", "condition:resolver", "render:gate-descriptors"],
    resources: { ConditionGateState },
    events: { GateOpened, GateClosed, GateProgressChanged },
    systems: [{ phase: config.phase ?? "resolve", name: "conditionGateDomainSystem", system }],
    initWorld({ world }) { writeState(world, ConditionGateState, initial()); },
    install({ engine, world }) {
      const api = {
        registerGate(payload = {}) {
          const state = readState(world, ConditionGateState, initial());
          const gate = { id: String(payload.id), conditions: asArray(payload.conditions), mode: payload.mode ?? "all", progress: Math.max(0, Math.min(1, toNumber(payload.progress, 0))), state: payload.state ?? "closed", openRate: toNumber(payload.openRate, 0.75), closeRate: toNumber(payload.closeRate, payload.openRate ?? 0.75) };
          state.gates = state.gates.filter((item) => item.id !== gate.id).concat(gate);
          return writeState(world, ConditionGateState, state);
        },
        setCondition(id, value = true) {
          const state = readState(world, ConditionGateState, initial());
          state.facts[String(id)] = Boolean(value);
          return writeState(world, ConditionGateState, state);
        },
        getGate(gateId) { return this.getState().gates.find((gate) => gate.id === gateId) ?? null; },
        getState() { return readState(world, ConditionGateState, initial()); },
        getDescriptors() { return this.getState().descriptors; },
        reset() { return writeState(world, ConditionGateState, initial()); }
      };
      engine.conditionGate = api;
      Object.assign(ensureNamespace(engine, "conditionGate") ?? {}, api);
    },
    metadata: { version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION, domain: "condition-gate", layer: "small-domain", extendsBase: "DomainServiceKit", ownsLoop: true, boundary: "Owns multi-condition gate state, progress, and open/close facts. It does not own quest completion, object art, or one game's lock fiction." }
  });
}

export function createPhysicsBodyLiteDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime, "createPhysicsBodyLiteDomainKit");
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const PhysicsBodyLiteState = defineResource(config.resourceName ?? "physicsBodyLite.state");
  const BodyMoved = defineEvent("physicsBodyLite.bodyMoved");
  const BodyImpulsed = defineEvent("physicsBodyLite.bodyImpulsed");
  const BodyContacted = defineEvent("physicsBodyLite.bodyContacted");
  const initial = () => ({ version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION, bodies: [], colliders: asArray(config.colliders), descriptors: [], tick: 0 });

  function overlap(a, b) {
    return toNumber(a.x, 0) + toNumber(a.w, 0) > toNumber(b.x, 0) && toNumber(a.x, 0) < toNumber(b.x, 0) + toNumber(b.w, 0)
      && toNumber(a.y, 0) + toNumber(a.h, 0) > toNumber(b.y, 0) && toNumber(a.y, 0) < toNumber(b.y, 0) + toNumber(b.h, 0);
  }

  function system(world) {
    const state = readState(world, PhysicsBodyLiteState, initial());
    const dt = toNumber(world.__nexusDelta, 1 / 60);
    state.tick = toNumber(world.__nexusClock?.frame, state.tick + 1);
    const gravity = clone(config.gravity ?? { x: 0, y: 980, z: 0 });
    state.bodies = state.bodies.map((body) => {
      if (body.static) return body;
      const previous = clone(body);
      const next = clone(body);
      next.grounded = false;
      next.velocity = next.velocity ?? { x: 0, y: 0, z: 0 };
      next.position = next.position ?? { x: 0, y: 0, z: 0 };
      next.size = next.size ?? { w: 1, h: 1, d: 1 };
      next.velocity.x += toNumber(gravity.x, 0) * dt;
      next.velocity.y += toNumber(gravity.y, 0) * dt;
      next.position.x += toNumber(next.velocity.x, 0) * dt;
      next.position.y += toNumber(next.velocity.y, 0) * dt;
      const rect = { x: next.position.x, y: next.position.y, w: next.size.w, h: next.size.h };
      for (const collider of state.colliders) {
        if (!overlap(rect, collider)) continue;
        if (previous.position.y + next.size.h <= collider.y && next.velocity.y >= 0) {
          next.position.y = collider.y - next.size.h;
          next.velocity.y = 0;
          next.grounded = true;
          world.emit?.(BodyContacted, { id: next.id, colliderId: collider.id, normal: { x: 0, y: -1, z: 0 } });
        }
      }
      next.velocity.x *= Math.max(0, Math.min(1, 1 - toNumber(next.friction, config.defaultFriction ?? 0.08)));
      if (next.position.x !== previous.position.x || next.position.y !== previous.position.y) world.emit?.(BodyMoved, { id: next.id, position: clone(next.position), velocity: clone(next.velocity) });
      return next;
    });
    state.descriptors = state.bodies.map((body) => ({ id: body.id, kind: "physics-body-lite", position: clone(body.position), size: clone(body.size), velocity: clone(body.velocity), grounded: Boolean(body.grounded), tags: asArray(body.tags) }));
    writeState(world, PhysicsBodyLiteState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "physics-body-lite-domain-kit",
    provides: ["physics:body-lite", "motion:body-state", "render:body-descriptors"],
    resources: { PhysicsBodyLiteState },
    events: { BodyMoved, BodyImpulsed, BodyContacted },
    systems: [{ phase: config.phase ?? "simulate", name: "physicsBodyLiteDomainSystem", system }],
    initWorld({ world }) { writeState(world, PhysicsBodyLiteState, initial()); },
    install({ engine, world }) {
      const api = {
        registerBody(payload = {}) {
          const state = readState(world, PhysicsBodyLiteState, initial());
          const body = { id: String(payload.id), position: clone(payload.position ?? { x: 0, y: 0, z: 0 }), size: clone(payload.size ?? { w: 16, h: 16, d: 16 }), velocity: clone(payload.velocity ?? { x: 0, y: 0, z: 0 }), mass: Math.max(0.001, toNumber(payload.mass, 1)), friction: toNumber(payload.friction, config.defaultFriction ?? 0.08), static: Boolean(payload.static), tags: asArray(payload.tags) };
          state.bodies = state.bodies.filter((item) => item.id !== body.id).concat(body);
          return writeState(world, PhysicsBodyLiteState, state);
        },
        setColliders(colliders = []) {
          const state = readState(world, PhysicsBodyLiteState, initial());
          state.colliders = asArray(colliders).map(clone);
          return writeState(world, PhysicsBodyLiteState, state);
        },
        applyImpulse(bodyId, impulse = {}) {
          const state = readState(world, PhysicsBodyLiteState, initial());
          state.bodies = state.bodies.map((body) => {
            if (body.id !== bodyId) return body;
            const mass = Math.max(0.001, toNumber(body.mass, 1));
            const velocity = clone(body.velocity ?? { x: 0, y: 0, z: 0 });
            velocity.x += toNumber(impulse.x, 0) / mass;
            velocity.y += toNumber(impulse.y, 0) / mass;
            velocity.z += toNumber(impulse.z, 0) / mass;
            world.emit?.(BodyImpulsed, { id: bodyId, impulse: clone(impulse) });
            return { ...body, velocity };
          });
          return writeState(world, PhysicsBodyLiteState, state);
        },
        getBody(bodyId) { return this.getState().bodies.find((body) => body.id === bodyId) ?? null; },
        getState() { return readState(world, PhysicsBodyLiteState, initial()); },
        getDescriptors() { return this.getState().descriptors; },
        reset() { return writeState(world, PhysicsBodyLiteState, initial()); }
      };
      engine.physicsBodyLite = api;
      Object.assign(ensureNamespace(engine, "physicsBodyLite") ?? {}, api);
    },
    metadata: { version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION, domain: "physics-body-lite", layer: "small-domain", extendsBase: "DomainServiceKit", ownsLoop: true, boundary: "Owns lightweight deterministic body state, friction, impulses, and coarse collision facts. It is not a full physics engine and owns no renderer." }
  });
}

export function createProjectileLiteDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime, "createProjectileLiteDomainKit");
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const ProjectileLiteState = defineResource(config.resourceName ?? "projectileLite.state");
  const ProjectileSpawned = defineEvent("projectileLite.spawned");
  const ProjectileImpacted = defineEvent("projectileLite.impacted");
  const ProjectileExpired = defineEvent("projectileLite.expired");
  const initial = () => ({ version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION, projectiles: [], colliders: asArray(config.colliders), descriptors: [], tick: 0 });

  function system(world) {
    const state = readState(world, ProjectileLiteState, initial());
    const dt = toNumber(world.__nexusDelta, 1 / 60);
    state.tick = toNumber(world.__nexusClock?.frame, state.tick + 1);
    const gravity = clone(config.gravity ?? { x: 0, y: 980, z: 0 });
    const nextProjectiles = [];
    for (const projectile of state.projectiles) {
      const next = clone(projectile);
      next.age = toNumber(next.age, 0) + dt;
      next.velocity.x += toNumber(gravity.x, 0) * dt;
      next.velocity.y += toNumber(gravity.y, 0) * dt;
      next.position.x += toNumber(next.velocity.x, 0) * dt;
      next.position.y += toNumber(next.velocity.y, 0) * dt;
      let impacted = false;
      for (const collider of state.colliders) {
        if (next.position.x >= collider.x && next.position.x <= collider.x + collider.w && next.position.y >= collider.y && next.position.y <= collider.y + collider.h) {
          impacted = true;
          next.bounces = toNumber(next.bounces, 0) + 1;
          next.velocity.y = -next.velocity.y * toNumber(next.bounce, 0.35);
          next.velocity.x = next.velocity.x * toNumber(next.bounce, 0.35);
          world.emit?.(ProjectileImpacted, { id: next.id, position: clone(next.position), colliderId: collider.id, bounces: next.bounces });
          if (engineRef?.n?.acousticSignal?.emitSignal && toNumber(next.acousticIntensity, 0) > 0) {
            engineRef.n.acousticSignal.emitSignal({ id: `${next.id}:impact:${next.bounces}`, sourceId: next.id, position: clone(next.position), intensity: next.acousticIntensity / Math.max(1, next.bounces), tags: ["projectile", "impact"] });
          }
          break;
        }
      }
      const expired = next.age >= toNumber(next.maxAge, 6) || toNumber(next.bounces, 0) > toNumber(next.maxBounces, 3);
      if (expired) world.emit?.(ProjectileExpired, { id: next.id, age: next.age, bounces: next.bounces });
      if (!expired) nextProjectiles.push(next);
    }
    state.projectiles = nextProjectiles;
    state.descriptors = state.projectiles.map((projectile) => ({ id: projectile.id, kind: "projectile-lite", position: clone(projectile.position), velocity: clone(projectile.velocity), radius: projectile.radius, tags: asArray(projectile.tags) }));
    writeState(world, ProjectileLiteState, state);
  }

  let engineRef = null;
  return defineRuntimeKit({
    id: config.kitId ?? "projectile-lite-domain-kit",
    provides: ["projectile:lite", "render:projectile-descriptors"],
    requires: ["acoustic:signals?"],
    resources: { ProjectileLiteState },
    events: { ProjectileSpawned, ProjectileImpacted, ProjectileExpired },
    systems: [{ phase: config.phase ?? "simulate", name: "projectileLiteDomainSystem", system }],
    initWorld({ world }) { writeState(world, ProjectileLiteState, initial()); },
    install({ engine, world }) {
      engineRef = engine;
      const api = {
        spawnProjectile(payload = {}) {
          const state = readState(world, ProjectileLiteState, initial());
          const projectile = { id: String(payload.id ?? `projectile-${state.tick}-${state.projectiles.length + 1}`), position: clone(payload.position ?? { x: 0, y: 0, z: 0 }), velocity: clone(payload.velocity ?? { x: 0, y: 0, z: 0 }), radius: toNumber(payload.radius, 4), bounce: toNumber(payload.bounce, 0.35), bounces: 0, maxBounces: toNumber(payload.maxBounces, 3), maxAge: toNumber(payload.maxAge, 6), age: 0, acousticIntensity: toNumber(payload.acousticIntensity, 0), tags: asArray(payload.tags) };
          state.projectiles.push(projectile);
          world.emit?.(ProjectileSpawned, clone(projectile));
          return writeState(world, ProjectileLiteState, state);
        },
        setColliders(colliders = []) { const state = readState(world, ProjectileLiteState, initial()); state.colliders = asArray(colliders).map(clone); return writeState(world, ProjectileLiteState, state); },
        getState() { return readState(world, ProjectileLiteState, initial()); },
        getDescriptors() { return this.getState().descriptors; },
        reset() { return writeState(world, ProjectileLiteState, initial()); }
      };
      engine.projectileLite = api;
      Object.assign(ensureNamespace(engine, "projectileLite") ?? {}, api);
    },
    metadata: { version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION, domain: "projectile-lite", layer: "small-domain", extendsBase: "DomainServiceKit", ownsLoop: true, composes: ["acoustic-signal-domain-kit"], boundary: "Owns simple arcing projectile state, bounces, impacts, and expiry. It may emit acoustic signals but does not render trajectory or own input." }
  });
}

export function createSensoryAgentDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime, "createSensoryAgentDomainKit");
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const SensoryAgentState = defineResource(config.resourceName ?? "sensoryAgent.state");
  const AgentRegistered = defineEvent("sensoryAgent.registered");
  const AgentStateChanged = defineEvent("sensoryAgent.stateChanged");
  const AgentTargetUpdated = defineEvent("sensoryAgent.targetUpdated");
  const initial = () => ({ version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION, agents: [], descriptors: [], tick: 0 });
  let engineRef = null;

  function system(world) {
    const state = readState(world, SensoryAgentState, initial());
    const dt = toNumber(world.__nexusDelta, 1 / 60);
    state.tick = toNumber(world.__nexusClock?.frame, state.tick + 1);
    state.agents = state.agents.map((agent) => {
      const previousState = agent.state ?? "patrol";
      const next = clone(agent);
      next.timer = Math.max(0, toNumber(next.timer, 0) - dt);
      const hits = engineRef?.n?.acousticSignal?.consumeHits?.(agent.listenerId ?? agent.id) ?? [];
      if (hits.length > 0) {
        const loudest = hits.reduce((best, hit) => toNumber(hit.intensity, 0) > toNumber(best.intensity, 0) ? hit : best, hits[0]);
        next.target = clone(loudest.position);
        next.lastSignalId = loudest.signalId;
        next.state = toNumber(loudest.intensity, 0) >= toNumber(next.chaseAtIntensity, 1.2) ? "chase" : "investigate";
        next.timer = next.state === "chase" ? toNumber(next.chaseSeconds, 4) : toNumber(next.investigateSeconds, 3);
        world.emit?.(AgentTargetUpdated, { id: next.id, target: clone(next.target), signalId: loudest.signalId, state: next.state });
      } else if ((next.state === "investigate" || next.state === "chase") && next.timer <= 0) {
        next.state = "patrol";
        next.target = null;
      }
      if (next.state !== previousState) world.emit?.(AgentStateChanged, { id: next.id, previousState, state: next.state });
      if (engineRef?.n?.acousticSignal?.moveListener) engineRef.n.acousticSignal.moveListener(next.listenerId ?? next.id, next.position ?? { x: 0, y: 0, z: 0 });
      return next;
    });
    state.descriptors = state.agents.map((agent) => ({ id: agent.id, kind: "sensory-agent", state: agent.state, position: clone(agent.position), target: clone(agent.target), alert: agent.state === "chase" ? 1 : agent.state === "investigate" ? 0.55 : 0.1, tags: asArray(agent.tags) }));
    writeState(world, SensoryAgentState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "sensory-agent-domain-kit",
    provides: ["agent:sensory", "agent:hearing-response", "render:agent-descriptors"],
    requires: ["acoustic:signals"],
    resources: { SensoryAgentState },
    events: { AgentRegistered, AgentStateChanged, AgentTargetUpdated },
    systems: [{ phase: config.phase ?? "resolve", name: "sensoryAgentDomainSystem", system }],
    initWorld({ world }) { writeState(world, SensoryAgentState, initial()); },
    install({ engine, world }) {
      engineRef = engine;
      const api = {
        registerAgent(payload = {}) {
          const state = readState(world, SensoryAgentState, initial());
          const agent = { id: String(payload.id), listenerId: String(payload.listenerId ?? payload.id), position: clone(payload.position ?? { x: 0, y: 0, z: 0 }), state: payload.state ?? "patrol", target: null, timer: 0, hearingRadius: toNumber(payload.hearingRadius, 24), chaseAtIntensity: toNumber(payload.chaseAtIntensity, 1.2), investigateSeconds: toNumber(payload.investigateSeconds, 3), chaseSeconds: toNumber(payload.chaseSeconds, 4), tags: asArray(payload.tags) };
          state.agents = state.agents.filter((item) => item.id !== agent.id).concat(agent);
          engineRef?.n?.acousticSignal?.registerListener?.({ id: agent.listenerId, ownerId: agent.id, position: clone(agent.position), radius: agent.hearingRadius, tags: ["agent", "hearing"] });
          world.emit?.(AgentRegistered, clone(agent));
          return writeState(world, SensoryAgentState, state);
        },
        setAgentPosition(agentId, position = {}) {
          const state = readState(world, SensoryAgentState, initial());
          state.agents = state.agents.map((agent) => agent.id === agentId ? { ...agent, position: clone(position) } : agent);
          engineRef?.n?.acousticSignal?.moveListener?.(agentId, position);
          return writeState(world, SensoryAgentState, state);
        },
        getAgent(agentId) { return this.getState().agents.find((agent) => agent.id === agentId) ?? null; },
        getState() { return readState(world, SensoryAgentState, initial()); },
        getDescriptors() { return this.getState().descriptors; },
        reset() { return writeState(world, SensoryAgentState, initial()); }
      };
      engine.sensoryAgent = api;
      Object.assign(ensureNamespace(engine, "sensoryAgent") ?? {}, api);
    },
    metadata: { version: STONEWAKE_SYSTEMS_DOMAIN_KITS_VERSION, domain: "sensory-agent", layer: "mid-domain", extendsBase: "DomainServiceKit", ownsLoop: true, composes: ["acoustic-signal-domain-kit"], boundary: "Owns generic sensory agent state transitions from patrol to investigate/chase based on domain signals. It does not own creature art, death rules, or audio output." }
  });
}

export function createStonewakeSystemsDomainKits(NexusRealtime, config = {}) {
  return [
    createAcousticSignalDomainKit(NexusRealtime, config.acousticSignal ?? {}),
    createWeightedTriggerDomainKit(NexusRealtime, config.weightedTrigger ?? {}),
    createConditionGateDomainKit(NexusRealtime, config.conditionGate ?? {}),
    createPhysicsBodyLiteDomainKit(NexusRealtime, config.physicsBodyLite ?? {}),
    createProjectileLiteDomainKit(NexusRealtime, config.projectileLite ?? {}),
    createSensoryAgentDomainKit(NexusRealtime, config.sensoryAgent ?? {})
  ];
}

export default createStonewakeSystemsDomainKits;
