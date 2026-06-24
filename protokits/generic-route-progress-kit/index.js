export const GENERIC_ROUTE_PROGRESS_KIT_VERSION = "0.1.0";
export const GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE = "genericRouteProgress";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createGenericRouteProgressKit requires NexusRealtime.${key}.`);
    }
  }
}

function ensureEngineNamespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE] || typeof engine.n[GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE] !== "object") {
    engine.n[GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE] = {};
  }
  return engine.n[GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE];
}

export function syncGenericRouteProgressEngineNamespace(engine) {
  const namespace = ensureEngineNamespace(engine);
  const facade = engine?.genericRouteProgress;
  if (namespace && facade && typeof facade === "object") Object.assign(namespace, facade);
  return namespace;
}

function stableId(value, fallback) {
  const id = String(value ?? fallback).trim();
  if (!id) throw new TypeError("Route progress checkpoints require stable ids.");
  return id;
}

export function normalizeRouteCheckpoint(checkpoint = {}, index = 0) {
  const id = stableId(checkpoint.id ?? checkpoint.name, `checkpoint-${index + 1}`);
  return {
    id,
    index,
    label: String(checkpoint.label ?? checkpoint.name ?? id),
    objective: String(checkpoint.objective ?? checkpoint.label ?? id),
    required: checkpoint.required !== false,
    order: toNumber(checkpoint.order, index),
    position: checkpoint.position ? clone(checkpoint.position) : checkpoint.x != null || checkpoint.y != null ? { x: toNumber(checkpoint.x), y: toNumber(checkpoint.y) } : null,
    radius: Math.max(0, toNumber(checkpoint.radius, 0)),
    tags: asArray(checkpoint.tags).map(String).filter(Boolean),
    descriptor: clone(checkpoint.descriptor ?? {}),
    metadata: clone(checkpoint.metadata ?? {})
  };
}

function normalizeCheckpoints(config = {}) {
  return asArray(config.checkpoints ?? config.route?.checkpoints)
    .map(normalizeRouteCheckpoint)
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map((checkpoint, index) => ({ ...checkpoint, index }));
}

function createDescriptors(state) {
  return state.checkpoints.map((checkpoint) => {
    const completed = state.completedIds.includes(checkpoint.id);
    const active = state.activeId === checkpoint.id;
    return {
      id: checkpoint.id,
      kind: "route-checkpoint",
      label: checkpoint.label,
      objective: checkpoint.objective,
      index: checkpoint.index,
      required: checkpoint.required,
      status: completed ? "completed" : active ? "active" : state.status === "completed" ? "completed" : "pending",
      active,
      completed,
      position: clone(checkpoint.position),
      radius: checkpoint.radius,
      tags: [...checkpoint.tags],
      ...clone(checkpoint.descriptor)
    };
  });
}

function createState(config = {}) {
  const checkpoints = normalizeCheckpoints(config);
  const activeIndex = checkpoints.length > 0 ? 0 : -1;
  const state = {
    version: GENERIC_ROUTE_PROGRESS_KIT_VERSION,
    id: String(config.stateId ?? config.routeId ?? config.route?.id ?? "generic-route-progress"),
    label: String(config.label ?? config.route?.label ?? "Generic Route Progress"),
    status: checkpoints.length > 0 ? "active" : "empty",
    activeIndex,
    activeId: checkpoints[activeIndex]?.id ?? null,
    completedIds: [],
    checkpoints,
    checkpointsById: Object.fromEntries(checkpoints.map((checkpoint) => [checkpoint.id, checkpoint])),
    descriptors: [],
    lastEvents: [],
    updatedAtTick: 0
  };
  return { ...state, descriptors: createDescriptors(state) };
}

function refreshState(state, patch = {}) {
  const next = {
    ...state,
    ...patch,
    checkpointsById: Object.fromEntries((patch.checkpoints ?? state.checkpoints).map((checkpoint) => [checkpoint.id, checkpoint]))
  };
  return { ...next, descriptors: createDescriptors(next) };
}

function reject(world, Rejected, reason, payload = {}) {
  const event = { reason, ...payload };
  world.emit(Rejected, event);
  return { accepted: false, reason, event };
}

export function createGenericRouteProgressKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;

  const RouteProgressState = defineResource(config.resourceName ?? "genericRouteProgress.state");
  const CheckpointEntered = defineEvent("genericRouteProgress.checkpoint.entered");
  const CheckpointCompleted = defineEvent("genericRouteProgress.checkpoint.completed");
  const RouteAdvanced = defineEvent("genericRouteProgress.advanced");
  const RouteCompleted = defineEvent("genericRouteProgress.completed");
  const RouteReset = defineEvent("genericRouteProgress.reset");
  const Rejected = defineEvent("genericRouteProgress.rejected");

  function setState(world, state) {
    const next = refreshState(state, { updatedAtTick: toNumber(world.__nexusClock?.frame, state.updatedAtTick) });
    world.setResource(RouteProgressState, next);
    return next;
  }

  function system(world) {
    const state = world.getResource(RouteProgressState) ?? createState(config);
    world.setResource(RouteProgressState, refreshState(state, { updatedAtTick: toNumber(world.__nexusClock?.frame, state.updatedAtTick) }));
  }

  return defineRuntimeKit({
    id: config.kitId ?? config.id ?? "generic-route-progress-kit",
    provides: ["route:progress", "checkpoint:ledger", "objective:descriptors"],
    resources: { RouteProgressState },
    events: { CheckpointEntered, CheckpointCompleted, RouteAdvanced, RouteCompleted, RouteReset, Rejected },
    systems: [{ phase: config.phase ?? "resolve", name: "genericRouteProgressSystem", system }],
    initWorld({ world }) {
      world.setResource(RouteProgressState, createState(config));
    },
    install({ engine, world }) {
      function currentState() {
        return world.getResource(RouteProgressState) ?? createState(config);
      }

      function reset(payload = {}) {
        const state = createState({ ...config, ...(payload.route ?? {}) });
        world.setResource(RouteProgressState, state);
        world.emit(RouteReset, { reason: payload.reason ?? "reset", routeId: state.id, checkpointCount: state.checkpoints.length });
        return clone(state);
      }

      function enter(checkpointId, payload = {}) {
        const state = currentState();
        const id = checkpointId ?? state.activeId;
        const checkpoint = state.checkpointsById[id];
        if (!checkpoint) return reject(world, Rejected, "unknown-checkpoint", { checkpointId: id, commandId: payload.commandId });
        world.emit(CheckpointEntered, { checkpointId: checkpoint.id, active: state.activeId === checkpoint.id, commandId: payload.commandId, actorId: payload.actorId });
        const next = setState(world, refreshState(state, { lastEvents: [{ type: "entered", checkpointId: checkpoint.id, commandId: payload.commandId }] }));
        return { accepted: true, checkpoint: clone(checkpoint), state: clone(next) };
      }

      function complete(checkpointId, payload = {}) {
        const state = currentState();
        if (state.status === "completed") return { accepted: true, completed: true, state: clone(state) };
        const id = checkpointId ?? state.activeId;
        const checkpoint = state.checkpointsById[id];
        if (!checkpoint) return reject(world, Rejected, "unknown-checkpoint", { checkpointId: id, commandId: payload.commandId });
        if (id !== state.activeId && payload.allowOutOfOrder !== true) {
          return reject(world, Rejected, "inactive-checkpoint", { checkpointId: id, activeId: state.activeId, commandId: payload.commandId });
        }
        if (state.completedIds.includes(id)) return { accepted: true, duplicate: true, checkpoint: clone(checkpoint), state: clone(state) };

        const completedIds = [...state.completedIds, id];
        const nextIndex = state.activeIndex + 1;
        const done = nextIndex >= state.checkpoints.length;
        const nextActive = done ? null : state.checkpoints[nextIndex];
        const next = setState(world, refreshState(state, {
          status: done ? "completed" : "active",
          activeIndex: done ? state.checkpoints.length : nextIndex,
          activeId: nextActive?.id ?? null,
          completedIds,
          lastEvents: [{ type: "completed", checkpointId: id, commandId: payload.commandId }]
        }));

        world.emit(CheckpointCompleted, { checkpointId: id, index: checkpoint.index, commandId: payload.commandId, actorId: payload.actorId });
        if (done) {
          world.emit(RouteCompleted, { routeId: next.id, completedIds: [...completedIds], commandId: payload.commandId });
        } else {
          world.emit(RouteAdvanced, { routeId: next.id, fromCheckpointId: id, toCheckpointId: nextActive.id, activeIndex: nextIndex, commandId: payload.commandId });
        }
        return { accepted: true, completed: done, checkpoint: clone(checkpoint), activeCheckpoint: clone(nextActive), state: clone(next) };
      }

      const facade = {
        resources: { RouteProgressState },
        events: { CheckpointEntered, CheckpointCompleted, RouteAdvanced, RouteCompleted, RouteReset, Rejected },
        enter,
        complete,
        advance(payload = {}) {
          return complete(currentState().activeId, payload);
        },
        reset,
        setRoute(route = {}, payload = {}) {
          return reset({ ...payload, route, reason: payload.reason ?? "set-route" });
        },
        getState() {
          return clone(currentState());
        },
        getActiveCheckpoint() {
          const state = currentState();
          return clone(state.checkpointsById[state.activeId] ?? null);
        },
        getDescriptors() {
          return clone(currentState().descriptors);
        }
      };

      engine.genericRouteProgress = facade;
      syncGenericRouteProgressEngineNamespace(engine);
    },
    metadata: {
      version: GENERIC_ROUTE_PROGRESS_KIT_VERSION,
      engineNamespace: `engine.n.${GENERIC_ROUTE_PROGRESS_ENGINE_NAMESPACE}`,
      purpose: "Generic deterministic route, checkpoint, and objective-progress ledger for delivery, extraction, traversal, survey, and encounter routes.",
      boundary: "Owns ordered checkpoint state, completion events, active objective snapshots, and renderer-agnostic checkpoint descriptors. Hosts own input capture, collision/hit testing, camera, rendering, and route fiction.",
      apiSurface: {
        resources: ["genericRouteProgress.state"],
        events: ["genericRouteProgress.checkpoint.entered", "genericRouteProgress.checkpoint.completed", "genericRouteProgress.advanced", "genericRouteProgress.completed", "genericRouteProgress.reset", "genericRouteProgress.rejected"],
        methods: ["engine.n.genericRouteProgress.enter", "engine.n.genericRouteProgress.complete", "engine.n.genericRouteProgress.advance", "engine.n.genericRouteProgress.reset", "engine.n.genericRouteProgress.setRoute", "engine.n.genericRouteProgress.getState", "engine.n.genericRouteProgress.getActiveCheckpoint", "engine.n.genericRouteProgress.getDescriptors", "engine.genericRouteProgress.enter", "engine.genericRouteProgress.complete", "engine.genericRouteProgress.advance", "engine.genericRouteProgress.reset", "engine.genericRouteProgress.setRoute", "engine.genericRouteProgress.getState", "engine.genericRouteProgress.getActiveCheckpoint", "engine.genericRouteProgress.getDescriptors"],
        snapshots: ["route", "activeCheckpoint", "completedIds", "descriptors"],
        descriptors: ["route-checkpoint"]
      }
    }
  });
}

export default createGenericRouteProgressKit;
