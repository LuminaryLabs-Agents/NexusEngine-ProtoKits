export const GENERIC_RESOURCE_LOOP_KIT_VERSION = "0.1.0";
export const GENERIC_RESOURCE_LOOP_ENGINE_NAMESPACE = "genericResourceLoop";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createGenericResourceLoopKit requires NexusRealtime.${key}.`);
    }
  }
}

function ensureEngineNamespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[GENERIC_RESOURCE_LOOP_ENGINE_NAMESPACE] || typeof engine.n[GENERIC_RESOURCE_LOOP_ENGINE_NAMESPACE] !== "object") {
    engine.n[GENERIC_RESOURCE_LOOP_ENGINE_NAMESPACE] = {};
  }
  return engine.n[GENERIC_RESOURCE_LOOP_ENGINE_NAMESPACE];
}

export function syncGenericResourceLoopEngineNamespace(engine) {
  const namespace = ensureEngineNamespace(engine);
  const facade = engine?.genericResourceLoop;
  if (namespace && facade && typeof facade === "object") Object.assign(namespace, facade);
  return namespace;
}

function normalizeThreshold(threshold = {}, index = 0) {
  const id = String(threshold.id ?? `threshold-${index + 1}`).trim();
  if (!id) throw new TypeError("Resource thresholds require a stable id.");
  const direction = threshold.direction === "above" ? "above" : "below";
  return { id, value: toNumber(threshold.value, 0), direction };
}

function thresholdMatches(resource, threshold) {
  return threshold.direction === "above" ? resource.value >= threshold.value : resource.value <= threshold.value;
}

function thresholdStatesFor(resource) {
  return Object.fromEntries(resource.thresholds.map((threshold) => [threshold.id, thresholdMatches(resource, threshold)]));
}

export function normalizeResourceMeter(resource = {}, index = 0) {
  const id = String(resource.id ?? resource.name ?? `resource-${index + 1}`).trim();
  if (!id) throw new TypeError("Resource meters require a stable id.");
  const max = Math.max(1, toNumber(resource.max, 100));
  const min = Math.min(max, toNumber(resource.min, 0));
  const initial = Math.max(min, Math.min(max, toNumber(resource.initial ?? resource.value, max)));
  const thresholds = asArray(resource.thresholds).map(normalizeThreshold);
  const meter = {
    id,
    index,
    label: String(resource.label ?? id),
    initial,
    value: initial,
    min,
    max,
    ratePerSecond: toNumber(resource.ratePerSecond, 0),
    empty: initial <= min,
    full: initial >= max,
    locked: Boolean(resource.locked),
    thresholds,
    thresholdStates: {},
    tags: asArray(resource.tags).map(String).filter(Boolean),
    lastChangeReason: null,
    lastThresholdEvent: null,
    metadata: clone(resource.metadata ?? {})
  };
  meter.thresholdStates = thresholdStatesFor(meter);
  return meter;
}

function createState(config = {}) {
  const resources = asArray(config.resources).map(normalizeResourceMeter);
  return {
    version: GENERIC_RESOURCE_LOOP_KIT_VERSION,
    id: config.stateId ?? "generic-resource-loop",
    resources,
    resourcesById: Object.fromEntries(resources.map((resource) => [resource.id, resource])),
    recentChanges: [],
    tick: 0
  };
}

function updateIndex(state) {
  return {
    ...state,
    resourcesById: Object.fromEntries(state.resources.map((resource) => [resource.id, resource]))
  };
}

function emitThresholds(world, ThresholdCrossed, before, after, reason) {
  const events = [];
  for (const threshold of after.thresholds) {
    const wasMatched = Boolean(before.thresholdStates?.[threshold.id]);
    const isMatched = thresholdMatches(after, threshold);
    if (!wasMatched && isMatched) {
      const event = { id: after.id, thresholdId: threshold.id, value: after.value, threshold: threshold.value, direction: threshold.direction, reason };
      events.push(event);
      world.emit(ThresholdCrossed, event);
      after.lastThresholdEvent = event;
    }
    after.thresholdStates[threshold.id] = isMatched;
  }
  return events;
}

function applyValue(resource, nextValue, reason, clamp = true) {
  const min = resource.min;
  const max = resource.max;
  const value = clamp ? Math.max(min, Math.min(max, nextValue)) : nextValue;
  return {
    ...resource,
    value,
    empty: value <= min,
    full: value >= max,
    lastChangeReason: reason,
    thresholdStates: { ...resource.thresholdStates },
    lastThresholdEvent: null
  };
}

export function createGenericResourceLoopKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;

  const ResourceLoopState = defineResource(config.resourceName ?? "genericResourceLoop.state");
  const SpendRequested = defineEvent("genericResource.spendRequested");
  const RestoreRequested = defineEvent("genericResource.restoreRequested");
  const RateChanged = defineEvent("genericResource.rateChanged");
  const LockChanged = defineEvent("genericResource.lockChanged");
  const Changed = defineEvent("genericResource.changed");
  const ThresholdCrossed = defineEvent("genericResource.thresholdCrossed");
  const Emptied = defineEvent("genericResource.emptied");
  const Filled = defineEvent("genericResource.filled");
  const Rejected = defineEvent("genericResource.rejected");
  const Reset = defineEvent("genericResource.reset");

  function changeResource(world, id, amount, reason, eventDef) {
    let state = world.getResource(ResourceLoopState);
    const recentChanges = [];
    const resources = state.resources.map((resource) => {
      if (resource.id !== id) return resource;
      if (resource.locked && !config.allowLockedOverride) {
        const rejection = { id, reason, message: "resource locked" };
        world.emit(Rejected, rejection);
        recentChanges.push(rejection);
        return resource;
      }
      const before = resource;
      const after = applyValue(resource, resource.value + amount, reason, config.clamp !== false);
      const event = { id, before: before.value, after: after.value, amount, reason };
      world.emit(eventDef, event);
      world.emit(Changed, event);
      if (!before.empty && after.empty) world.emit(Emptied, event);
      if (!before.full && after.full) world.emit(Filled, event);
      recentChanges.push(event, ...emitThresholds(world, ThresholdCrossed, before, after, reason));
      return after;
    });
    state = updateIndex({ ...state, resources, recentChanges });
    world.setResource(ResourceLoopState, state);
    return state.resourcesById[id] ? clone(state.resourcesById[id]) : null;
  }

  function setRate(world, id, ratePerSecond, reason = "setRate") {
    let state = world.getResource(ResourceLoopState);
    const recentChanges = [];
    const resources = state.resources.map((resource) => {
      if (resource.id !== id) return resource;
      const after = { ...resource, ratePerSecond: toNumber(ratePerSecond, 0), lastChangeReason: reason };
      const event = { id, ratePerSecond: after.ratePerSecond, reason };
      world.emit(RateChanged, event);
      recentChanges.push(event);
      return after;
    });
    state = updateIndex({ ...state, resources, recentChanges });
    world.setResource(ResourceLoopState, state);
    return clone(state.resourcesById[id] ?? null);
  }

  function system(world) {
    let state = world.getResource(ResourceLoopState) ?? createState(config);
    const dt = Math.max(0, toNumber(world.__nexusClock?.delta, 0));
    const recentChanges = [];
    const resources = state.resources.map((resource) => {
      if (resource.ratePerSecond === 0 || dt === 0 || resource.locked) return resource;
      const before = resource;
      const after = applyValue(resource, resource.value + resource.ratePerSecond * dt, "tick", config.clamp !== false);
      if (after.value !== before.value) {
        const event = { id: resource.id, before: before.value, after: after.value, amount: after.value - before.value, reason: "tick" };
        world.emit(Changed, event);
        if (!before.empty && after.empty) world.emit(Emptied, event);
        if (!before.full && after.full) world.emit(Filled, event);
        recentChanges.push(event, ...emitThresholds(world, ThresholdCrossed, before, after, "tick"));
      }
      return after;
    });
    state = updateIndex({ ...state, resources, recentChanges, tick: toNumber(world.__nexusClock?.frame, state.tick) });
    world.setResource(ResourceLoopState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? config.id ?? "generic-resource-loop-kit",
    provides: ["resource:loop", "resource:meters", "validation:resources"],
    resources: { ResourceLoopState },
    events: { SpendRequested, RestoreRequested, RateChanged, LockChanged, Changed, ThresholdCrossed, Emptied, Filled, Rejected, Reset },
    systems: [{ phase: config.phase ?? "simulate", name: "genericResourceLoopSystem", system }],
    initWorld({ world }) {
      world.setResource(ResourceLoopState, createState(config));
    },
    install({ engine, world }) {
      const facade = {
        resources: { ResourceLoopState },
        events: { SpendRequested, RestoreRequested, RateChanged, LockChanged, Changed, ThresholdCrossed, Emptied, Filled, Rejected, Reset },
        spend(id, amount, reason = "spend") {
          return changeResource(world, id, -Math.abs(toNumber(amount, 0)), reason, SpendRequested);
        },
        restore(id, amount, reason = "restore") {
          return changeResource(world, id, Math.abs(toNumber(amount, 0)), reason, RestoreRequested);
        },
        drain(id, amountPerSecond, reason = "drain") {
          return setRate(world, id, -Math.abs(toNumber(amountPerSecond, 0)), reason);
        },
        setRate(id, ratePerSecond, reason = "setRate") {
          return setRate(world, id, ratePerSecond, reason);
        },
        setLocked(id, locked, reason = "setLocked") {
          let state = world.getResource(ResourceLoopState);
          const resources = state.resources.map((resource) => resource.id === id ? { ...resource, locked: Boolean(locked), lastChangeReason: reason } : resource);
          state = updateIndex({ ...state, resources, recentChanges: [{ id, locked: Boolean(locked), reason }] });
          world.setResource(ResourceLoopState, state);
          world.emit(LockChanged, { id, locked: Boolean(locked), reason });
          return clone(state.resourcesById[id] ?? null);
        },
        reset(payload = {}) {
          const state = createState({ ...config, resources: payload.resources ?? config.resources ?? [] });
          world.setResource(ResourceLoopState, state);
          world.emit(Reset, { reason: payload.reason ?? "reset", count: state.resources.length });
          return clone(state);
        },
        getState() {
          return clone(world.getResource(ResourceLoopState));
        },
        getResource(id) {
          return clone(world.getResource(ResourceLoopState)?.resourcesById?.[id] ?? null);
        }
      };

      engine.genericResourceLoop = facade;
      syncGenericResourceLoopEngineNamespace(engine);
    },
    metadata: {
      engineNamespace: `engine.n.${GENERIC_RESOURCE_LOOP_ENGINE_NAMESPACE}`,
      purpose: "Generic deterministic resource meters for stamina, oxygen, oil, charge, hull, ink, tether tension, corruption, debt, or similar loops.",
      boundary: "Owns resource values, rates, locks, threshold events, and reset state. Hosts provide fiction, controls, and renderer descriptors.",
      apiSurface: {
        resources: ["genericResourceLoop.state"],
        events: ["genericResource.spendRequested", "genericResource.restoreRequested", "genericResource.rateChanged", "genericResource.lockChanged", "genericResource.changed", "genericResource.thresholdCrossed", "genericResource.emptied", "genericResource.filled", "genericResource.rejected", "genericResource.reset"],
        methods: ["engine.n.genericResourceLoop.spend", "engine.n.genericResourceLoop.restore", "engine.n.genericResourceLoop.drain", "engine.n.genericResourceLoop.setRate", "engine.n.genericResourceLoop.setLocked", "engine.n.genericResourceLoop.reset", "engine.n.genericResourceLoop.getState", "engine.n.genericResourceLoop.getResource", "engine.genericResourceLoop.spend", "engine.genericResourceLoop.restore", "engine.genericResourceLoop.drain", "engine.genericResourceLoop.setRate", "engine.genericResourceLoop.setLocked", "engine.genericResourceLoop.reset", "engine.genericResourceLoop.getState", "engine.genericResourceLoop.getResource"],
        snapshots: ["resources", "resourcesById", "recentChanges", "tick"],
        descriptors: []
      }
    }
  });
}

export default createGenericResourceLoopKit;
