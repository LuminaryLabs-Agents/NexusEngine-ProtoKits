export const GENERIC_PRESSURE_LOOP_KIT_VERSION = "0.1.0";
export const GENERIC_PRESSURE_LOOP_ENGINE_NAMESPACE = "genericPressureLoop";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createGenericPressureLoopKit requires NexusRealtime.${key}.`);
    }
  }
}

function ensureEngineNamespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[GENERIC_PRESSURE_LOOP_ENGINE_NAMESPACE] || typeof engine.n[GENERIC_PRESSURE_LOOP_ENGINE_NAMESPACE] !== "object") {
    engine.n[GENERIC_PRESSURE_LOOP_ENGINE_NAMESPACE] = {};
  }
  return engine.n[GENERIC_PRESSURE_LOOP_ENGINE_NAMESPACE];
}

export function syncGenericPressureLoopEngineNamespace(engine) {
  const namespace = ensureEngineNamespace(engine);
  const facade = engine?.genericPressureLoop;
  if (namespace && facade && typeof facade === "object") Object.assign(namespace, facade);
  return namespace;
}

export function normalizePressureChannel(channel = {}, index = 0) {
  const id = String(channel.id ?? channel.name ?? `pressure-${index + 1}`).trim();
  if (!id) throw new TypeError("Pressure channels require a stable id.");
  const max = Math.max(1, toNumber(channel.max, 100));
  const min = Math.min(max, toNumber(channel.min, 0));
  const value = Math.max(min, Math.min(max, toNumber(channel.value ?? channel.initial, min)));
  const warningAt = Math.max(min, Math.min(max, toNumber(channel.warningAt, max * 0.7)));
  const failAt = Math.max(warningAt, Math.min(max, toNumber(channel.failAt, max)));
  return {
    id,
    index,
    label: String(channel.label ?? id),
    value,
    min,
    max,
    warningAt,
    failAt,
    risePerSecond: toNumber(channel.risePerSecond, 0),
    fallPerSecond: toNumber(channel.fallPerSecond, 0),
    status: value >= failAt ? "failed" : value >= warningAt ? "warning" : "stable",
    tags: asArray(channel.tags).map(String).filter(Boolean),
    metadata: clone(channel.metadata ?? {})
  };
}

function createState(config = {}) {
  const channels = asArray(config.channels).map(normalizePressureChannel);
  return {
    version: GENERIC_PRESSURE_LOOP_KIT_VERSION,
    id: config.stateId ?? "generic-pressure-loop",
    status: channels.some((channel) => channel.status === "failed") ? "failed" : channels.some((channel) => channel.status === "warning") ? "warning" : "stable",
    channels,
    channelsById: Object.fromEntries(channels.map((channel) => [channel.id, channel])),
    lastEvents: [],
    updatedAtTick: 0
  };
}

function classify(channel) {
  return channel.value >= channel.failAt ? "failed" : channel.value >= channel.warningAt ? "warning" : "stable";
}

function updateStatus(state) {
  const channelsById = Object.fromEntries(state.channels.map((channel) => [channel.id, channel]));
  return {
    ...state,
    channelsById,
    status: state.channels.some((channel) => channel.status === "failed") ? "failed" : state.channels.some((channel) => channel.status === "warning") ? "warning" : "stable"
  };
}

function applyDelta(channel, amount) {
  const value = Math.max(channel.min, Math.min(channel.max, channel.value + amount));
  return { ...channel, value, status: classify({ ...channel, value }) };
}

export function createGenericPressureLoopKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;

  const PressureLoopState = defineResource(config.resourceName ?? "genericPressureLoop.state");
  const PressureAdjusted = defineEvent("genericPressureLoop.adjusted");
  const PressureWarning = defineEvent("genericPressureLoop.warning");
  const PressurePeaked = defineEvent("genericPressureLoop.peaked");
  const PressureRecovered = defineEvent("genericPressureLoop.recovered");
  const PressureReset = defineEvent("genericPressureLoop.reset");

  function emitTransition(world, before, after, reason) {
    const event = { id: after.id, before: before.value, after: after.value, status: after.status, reason };
    world.emit(PressureAdjusted, event);
    if (before.status !== "warning" && after.status === "warning") world.emit(PressureWarning, event);
    if (before.status !== "failed" && after.status === "failed") world.emit(PressurePeaked, event);
    if (before.status !== "stable" && after.status === "stable") world.emit(PressureRecovered, event);
    return event;
  }

  function system(world) {
    let state = world.getResource(PressureLoopState) ?? createState(config);
    const dt = Math.max(0, toNumber(world.__nexusClock?.delta, 0));
    const lastEvents = [];
    const channels = state.channels.map((channel) => {
      const before = channel;
      let next = channel;
      const passive = channel.risePerSecond - channel.fallPerSecond;
      if (dt > 0 && passive !== 0) next = applyDelta(next, passive * dt);
      if (next.value !== before.value || next.status !== before.status) lastEvents.push(emitTransition(world, before, next, "tick"));
      return next;
    });
    state = updateStatus({ ...state, channels, lastEvents, updatedAtTick: toNumber(world.__nexusClock?.frame, state.updatedAtTick) });
    world.setResource(PressureLoopState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? config.id ?? "generic-pressure-loop-kit",
    provides: ["pressure:loop", "pressure:channels", "validation:pressure"],
    resources: { PressureLoopState },
    events: { PressureAdjusted, PressureWarning, PressurePeaked, PressureRecovered, PressureReset },
    systems: [{ phase: config.phase ?? "simulate", name: "genericPressureLoopSystem", system }],
    initWorld({ world }) {
      world.setResource(PressureLoopState, createState(config));
    },
    install({ engine, world }) {
      function setChannels(channels, reason = "set") {
        const state = updateStatus({ ...world.getResource(PressureLoopState), channels: asArray(channels).map(normalizePressureChannel), lastEvents: [{ reason }] });
        world.setResource(PressureLoopState, state);
        world.emit(PressureReset, { reason, count: state.channels.length });
        return state;
      }
      function adjust(id, amount, reason = "adjust") {
        const state = world.getResource(PressureLoopState);
        const channels = state.channels.map((channel) => {
          if (channel.id !== id) return channel;
          const next = applyDelta(channel, toNumber(amount, 0));
          return next;
        });
        const nextState = updateStatus({ ...state, channels, lastEvents: [{ id, amount, reason }] });
        world.setResource(PressureLoopState, nextState);
        return nextState.channelsById[id] ?? null;
      }
      const facade = {
        resources: { PressureLoopState },
        events: { PressureAdjusted, PressureWarning, PressurePeaked, PressureRecovered, PressureReset },
        setChannels,
        adjust,
        recover(id, amount, reason = "recover") {
          return adjust(id, -Math.abs(toNumber(amount, 0)), reason);
        },
        reset(payload = {}) {
          return setChannels(payload.channels ?? config.channels ?? [], payload.reason ?? "reset");
        },
        getState() {
          return clone(world.getResource(PressureLoopState));
        },
        getChannel(id) {
          return clone(world.getResource(PressureLoopState)?.channelsById?.[id] ?? null);
        }
      };

      engine.genericPressureLoop = facade;
      syncGenericPressureLoopEngineNamespace(engine);
    },
    metadata: {
      engineNamespace: `engine.n.${GENERIC_PRESSURE_LOOP_ENGINE_NAMESPACE}`,
      purpose: "Generic deterministic pressure channels for heat, storm, alert, oxygen debt, radiation, corruption, collapse, or similar loops.",
      boundary: "Owns pressure state, thresholds, and transition events. Hosts render descriptors and game-specific fiction elsewhere.",
      apiSurface: {
        resources: ["genericPressureLoop.state"],
        events: ["genericPressureLoop.adjusted", "genericPressureLoop.warning", "genericPressureLoop.peaked", "genericPressureLoop.recovered", "genericPressureLoop.reset"],
        methods: ["engine.n.genericPressureLoop.setChannels", "engine.n.genericPressureLoop.adjust", "engine.n.genericPressureLoop.recover", "engine.n.genericPressureLoop.reset", "engine.n.genericPressureLoop.getState", "engine.n.genericPressureLoop.getChannel", "engine.genericPressureLoop.setChannels", "engine.genericPressureLoop.adjust", "engine.genericPressureLoop.recover", "engine.genericPressureLoop.reset", "engine.genericPressureLoop.getState", "engine.genericPressureLoop.getChannel"],
        snapshots: ["channels", "channelsById", "status", "lastEvents", "updatedAtTick"],
        descriptors: []
      }
    }
  });
}

export default createGenericPressureLoopKit;
