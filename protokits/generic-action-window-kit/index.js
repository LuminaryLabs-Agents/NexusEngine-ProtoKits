export const GENERIC_ACTION_WINDOW_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`createGenericActionWindowKit requires NexusEngine.${key}.`);
    }
  }
}

export function normalizeActionWindow(window = {}, index = 0) {
  const id = String(window.id ?? window.name ?? `action-window-${index + 1}`).trim();
  if (!id) throw new TypeError("Action windows require a stable id.");
  const durationSeconds = Math.max(0.01, toNumber(window.durationSeconds, 1));
  const cooldownSeconds = Math.max(0, toNumber(window.cooldownSeconds, 0));
  const good = window.good ?? { startSeconds: 0, endSeconds: durationSeconds };
  const perfect = window.perfect ?? { startSeconds: durationSeconds * 0.35, endSeconds: durationSeconds * 0.65 };
  return {
    id,
    index,
    label: String(window.label ?? id),
    enabled: window.enabled !== false,
    status: window.enabled === false ? "disabled" : "closed",
    durationSeconds,
    cooldownSeconds,
    openedAt: null,
    closesAt: null,
    cooldownUntil: null,
    perfectStart: Math.max(0, toNumber(perfect.startSeconds, durationSeconds * 0.35)),
    perfectEnd: Math.max(0, toNumber(perfect.endSeconds, durationSeconds * 0.65)),
    goodStart: Math.max(0, toNumber(good.startSeconds, 0)),
    goodEnd: Math.max(0, toNumber(good.endSeconds, durationSeconds)),
    maxAttempts: Math.max(1, toNumber(window.maxAttempts, 1)),
    closeOnSuccess: window.closeOnSuccess !== false,
    closeOnMiss: Boolean(window.closeOnMiss),
    attempts: 0,
    successes: 0,
    misses: 0,
    lastResult: null,
    lastRejectionReason: null,
    tags: asArray(window.tags).map(String).filter(Boolean),
    metadata: clone(window.metadata ?? {})
  };
}

function createState(config = {}) {
  const windows = asArray(config.windows).map(normalizeActionWindow);
  return {
    version: GENERIC_ACTION_WINDOW_KIT_VERSION,
    id: config.stateId ?? "generic-action-window",
    windows,
    windowsById: Object.fromEntries(windows.map((window) => [window.id, window])),
    recentResults: [],
    tick: 0
  };
}

function updateIndex(state) {
  return {
    ...state,
    windowsById: Object.fromEntries(state.windows.map((window) => [window.id, window]))
  };
}

function nowFrom(world) {
  return toNumber(world.__nexusClock?.elapsed, 0);
}

function pushRecent(state, result) {
  return { ...state, recentResults: [result, ...state.recentResults].slice(0, 12) };
}

function closeWindowState(window, now, reason = "close") {
  if (window.cooldownSeconds > 0) {
    return { ...window, status: "cooldown", cooldownUntil: now + window.cooldownSeconds, openedAt: null, closesAt: null, lastResult: reason };
  }
  return { ...window, status: "closed", cooldownUntil: null, openedAt: null, closesAt: null, lastResult: reason };
}

function classifyAttempt(window, now) {
  const elapsed = now - toNumber(window.openedAt, now);
  if (elapsed >= window.perfectStart && elapsed <= window.perfectEnd) return "perfect";
  if (elapsed >= window.goodStart && elapsed <= window.goodEnd) return "good";
  return "miss";
}

export function createGenericActionWindowKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;

  const ActionWindowState = defineResource(config.resourceName ?? "genericActionWindow.state");
  const OpenRequested = defineEvent("genericActionWindow.openRequested");
  const Opened = defineEvent("genericActionWindow.opened");
  const ActionRequested = defineEvent("genericActionWindow.actionRequested");
  const ActionAccepted = defineEvent("genericActionWindow.actionAccepted");
  const ActionPerfect = defineEvent("genericActionWindow.actionPerfect");
  const ActionGood = defineEvent("genericActionWindow.actionGood");
  const ActionMissed = defineEvent("genericActionWindow.actionMissed");
  const CooldownStarted = defineEvent("genericActionWindow.cooldownStarted");
  const Closed = defineEvent("genericActionWindow.closed");
  const Rejected = defineEvent("genericActionWindow.rejected");
  const Reset = defineEvent("genericActionWindow.reset");

  function reject(world, state, id, reason, payload = {}) {
    const result = { id, reason, payload };
    world.emit(Rejected, result);
    state = pushRecent(state, result);
    state.windows = state.windows.map((window) => window.id === id ? { ...window, lastRejectionReason: reason } : window);
    state = updateIndex(state);
    world.setResource(ActionWindowState, state);
    return clone(result);
  }

  function system(world) {
    let state = world.getResource(ActionWindowState) ?? createState(config);
    const now = nowFrom(world);
    const recentResults = [];
    const windows = state.windows.map((window) => {
      if (window.status === "open" && window.closesAt != null && now >= window.closesAt) {
        const next = closeWindowState(window, now, "expired");
        const event = { id: window.id, reason: "expired", at: now };
        world.emit(Closed, event);
        if (next.status === "cooldown") world.emit(CooldownStarted, { id: window.id, cooldownUntil: next.cooldownUntil, reason: "expired" });
        recentResults.push(event);
        return next;
      }
      if (window.status === "cooldown" && window.cooldownUntil != null && now >= window.cooldownUntil) {
        return { ...window, status: "closed", cooldownUntil: null };
      }
      return window;
    });
    state = updateIndex({ ...state, windows, recentResults, tick: toNumber(world.__nexusClock?.frame, state.tick) });
    world.setResource(ActionWindowState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? config.id ?? "generic-action-window-kit",
    provides: ["action:window", "action:timing", "validation:action-window"],
    resources: { ActionWindowState },
    events: { OpenRequested, Opened, ActionRequested, ActionAccepted, ActionPerfect, ActionGood, ActionMissed, CooldownStarted, Closed, Rejected, Reset },
    systems: [{ phase: config.phase ?? "simulate", name: "genericActionWindowSystem", system }],
    initWorld({ world }) {
      world.setResource(ActionWindowState, createState(config));
    },
    install({ engine, world }) {
      engine.genericActionWindow = {
        resources: { ActionWindowState },
        events: { OpenRequested, Opened, ActionRequested, ActionAccepted, ActionPerfect, ActionGood, ActionMissed, CooldownStarted, Closed, Rejected, Reset },
        openWindow(id, options = {}) {
          let state = world.getResource(ActionWindowState);
          const now = nowFrom(world);
          const current = state.windowsById[id];
          world.emit(OpenRequested, { id, options });
          if (!current) return reject(world, state, id, "unknown window", options);
          if (!current.enabled) return reject(world, state, id, "window disabled", options);
          if (current.status === "cooldown" && !config.allowOpenWhileCooldown) return reject(world, state, id, "window cooldown", options);
          const duration = Math.max(0.01, toNumber(options.durationSeconds, current.durationSeconds));
          const next = { ...current, status: "open", openedAt: now, closesAt: now + duration, cooldownUntil: null, attempts: 0, lastResult: "opened", lastRejectionReason: null };
          const result = { id, openedAt: next.openedAt, closesAt: next.closesAt };
          state.windows = state.windows.map((window) => window.id === id ? next : window);
          state = updateIndex(pushRecent(state, result));
          world.setResource(ActionWindowState, state);
          world.emit(Opened, result);
          return clone(state.windowsById[id]);
        },
        requestAction(id, payload = {}) {
          let state = world.getResource(ActionWindowState);
          const now = nowFrom(world);
          const current = state.windowsById[id];
          world.emit(ActionRequested, { id, payload });
          if (!current) return reject(world, state, id, "unknown window", payload);
          if (!current.enabled) return reject(world, state, id, "window disabled", payload);
          if (current.status !== "open") return reject(world, state, id, `window ${current.status}`, payload);
          const resultType = classifyAttempt(current, now);
          const accepted = resultType === "perfect" || resultType === "good";
          let next = {
            ...current,
            attempts: current.attempts + 1,
            successes: current.successes + (accepted ? 1 : 0),
            misses: current.misses + (accepted ? 0 : 1),
            lastResult: resultType,
            lastRejectionReason: null
          };
          const result = { id, result: resultType, accepted, at: now, payload };
          if (resultType === "perfect") world.emit(ActionPerfect, result);
          if (resultType === "good") world.emit(ActionGood, result);
          if (resultType === "miss") world.emit(ActionMissed, result);
          if (accepted) world.emit(ActionAccepted, result);
          if ((accepted && next.closeOnSuccess) || (!accepted && next.closeOnMiss) || next.attempts >= next.maxAttempts) {
            next = closeWindowState(next, now, resultType);
            world.emit(Closed, { id, reason: resultType, at: now });
            if (next.status === "cooldown") world.emit(CooldownStarted, { id, cooldownUntil: next.cooldownUntil, reason: resultType });
          }
          state.windows = state.windows.map((window) => window.id === id ? next : window);
          state = updateIndex(pushRecent(state, result));
          world.setResource(ActionWindowState, state);
          return clone(result);
        },
        closeWindow(id, reason = "manual") {
          let state = world.getResource(ActionWindowState);
          const current = state.windowsById[id];
          if (!current) return reject(world, state, id, "unknown window", { reason });
          const next = closeWindowState(current, nowFrom(world), reason);
          state.windows = state.windows.map((window) => window.id === id ? next : window);
          state = updateIndex(pushRecent(state, { id, reason }));
          world.setResource(ActionWindowState, state);
          world.emit(Closed, { id, reason, at: nowFrom(world) });
          return clone(state.windowsById[id]);
        },
        setEnabled(id, enabled, reason = "setEnabled") {
          let state = world.getResource(ActionWindowState);
          state.windows = state.windows.map((window) => window.id === id ? { ...window, enabled: Boolean(enabled), status: enabled ? "closed" : "disabled", lastResult: reason } : window);
          state = updateIndex(pushRecent(state, { id, enabled: Boolean(enabled), reason }));
          world.setResource(ActionWindowState, state);
          return clone(state.windowsById[id] ?? null);
        },
        reset(payload = {}) {
          const state = createState({ ...config, windows: payload.windows ?? config.windows ?? [] });
          world.setResource(ActionWindowState, state);
          world.emit(Reset, { reason: payload.reason ?? "reset", count: state.windows.length });
          return clone(state);
        },
        getState() {
          return clone(world.getResource(ActionWindowState));
        },
        getWindow(id) {
          return clone(world.getResource(ActionWindowState)?.windowsById?.[id] ?? null);
        }
      };
    },
    metadata: {
      purpose: "Generic deterministic timing, commit, and cooldown windows for reusable player or simulation actions.",
      boundary: "Owns timing judgment, cooldowns, accepted/missed/rejected results, and window state. Renderers only display descriptors."
    }
  });
}

export default createGenericActionWindowKit;
