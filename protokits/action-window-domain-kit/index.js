export const ACTION_WINDOW_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createActionWindowDomainKit requires NexusRealtime.${key}.`);
    }
  }
}

function normalizeWindow(window = {}, index = 0) {
  const id = String(window.id ?? `window-${index + 1}`);
  const opensAt = Math.max(0, toNumber(window.opensAt, 0));
  const closesAt = Math.max(opensAt, toNumber(window.closesAt ?? window.duration, opensAt + 1));
  return {
    id,
    label: String(window.label ?? id),
    opensAt,
    closesAt,
    completed: Boolean(window.completed),
    attempts: 0,
    tags: asArray(window.tags).map(String)
  };
}

function createState(config = {}) {
  const windows = asArray(config.windows).map(normalizeWindow);
  return {
    version: ACTION_WINDOW_DOMAIN_KIT_VERSION,
    id: config.stateId ?? "action-window-domain",
    domain: "action-window",
    time: 0,
    windows,
    windowsById: Object.fromEntries(windows.map((window) => [window.id, window])),
    attempts: [],
    lastResult: null
  };
}

function statusFor(window, time) {
  if (window.completed) return "completed";
  if (time < window.opensAt) return "pending";
  if (time <= window.closesAt) return "open";
  return "expired";
}

function rebuild(state) {
  return {
    ...state,
    windowsById: Object.fromEntries(state.windows.map((window) => [window.id, { ...window, status: statusFor(window, state.time) }]))
  };
}

export function createActionWindowDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;

  const ActionWindowState = defineResource(config.resourceName ?? "actionWindowDomain.state");
  const ActionWindowAttempted = defineEvent("actionWindow.attempted");
  const ActionWindowSucceeded = defineEvent("actionWindow.succeeded");
  const ActionWindowFailed = defineEvent("actionWindow.failed");

  function system(world) {
    let state = rebuild(world.getResource(ActionWindowState) ?? createState(config));
    state = rebuild({ ...state, time: state.time + Math.max(0, toNumber(world.__nexusClock?.delta, 0)) });

    for (const event of world.readEvents(ActionWindowAttempted)) {
      const id = String(event.id ?? event.windowId ?? "");
      const window = state.windowsById[id];
      const result = { id, action: event.action ?? null, time: state.time, routeId: event.routeId ?? null };

      if (!window || window.status !== "open") {
        const failed = { ...result, reason: !window ? "missing-window" : `window-${window.status}` };
        state = { ...state, attempts: [...state.attempts, failed], lastResult: failed };
        world.emit(ActionWindowFailed, failed);
        continue;
      }

      const windows = state.windows.map((item) => item.id === id ? { ...item, completed: true, attempts: item.attempts + 1 } : item);
      const succeeded = { ...result, status: "completed" };
      state = rebuild({ ...state, windows, attempts: [...state.attempts, succeeded], lastResult: succeeded });
      world.emit(ActionWindowSucceeded, succeeded);
    }

    world.setResource(ActionWindowState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "action-window-domain-kit",
    provides: ["n:action-window", "validation:timing-window"],
    resources: { ActionWindowState },
    events: { ActionWindowAttempted, ActionWindowSucceeded, ActionWindowFailed },
    systems: [
      {
        phase: config.phase ?? "simulate",
        name: "actionWindowDomainSystem",
        system
      }
    ],
    initWorld({ world }) {
      world.setResource(ActionWindowState, rebuild(createState(config)));
    },
    install({ engine, world }) {
      engine.actionWindowDomain = {
        attempt(id, payload = {}) {
          world.emit(ActionWindowAttempted, { id, ...payload });
          return world.getResource(ActionWindowState);
        },
        getState() {
          return clone(world.getResource(ActionWindowState));
        }
      };
    },
    metadata: {
      domain: "action-window",
      scope: "large-domain",
      extendsBase: "DomainServiceKit",
      composes: ["input-action-domain-kit", "pressure-domain-kit"],
      ownsLoop: false,
      purpose: "Owns reusable action timing windows for pulses, parries, forge strikes, repairs, lockpicks, and beats."
    }
  });
}

export default createActionWindowDomainKit;
