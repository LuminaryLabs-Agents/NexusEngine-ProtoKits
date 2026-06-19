export const TIMED_PRESSURE_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createTimedPressureDomainKit requires NexusRealtime.${key}.`);
    }
  }
}

function createState(config = {}) {
  const duration = Math.max(0, toNumber(config.duration ?? config.remaining, 10));
  return {
    version: TIMED_PRESSURE_DOMAIN_KIT_VERSION,
    id: config.stateId ?? "timed-pressure-domain",
    domain: "timed-pressure",
    status: duration <= 0 ? "expired" : "running",
    duration,
    remaining: duration,
    completed: false,
    expired: duration <= 0,
    lastEvent: null
  };
}

export function createTimedPressureDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;

  const TimedPressureState = defineResource(config.resourceName ?? "timedPressureDomain.state");
  const TimedPressureExpired = defineEvent("timedPressure.expired");
  const TimedPressureCompleted = defineEvent("timedPressure.completed");
  const TimedPressureExtended = defineEvent("timedPressure.extended");

  function system(world) {
    const state = world.getResource(TimedPressureState) ?? createState(config);
    if (state.completed || state.expired || state.status !== "running") {
      world.setResource(TimedPressureState, state);
      return;
    }

    const remaining = Math.max(0, state.remaining - Math.max(0, toNumber(world.__nexusClock?.delta, 0)));
    const next = {
      ...state,
      remaining,
      expired: remaining <= 0,
      status: remaining <= 0 ? "expired" : "running"
    };

    if (!state.expired && next.expired) {
      const event = { id: next.id, remaining: 0 };
      next.lastEvent = event;
      world.emit(TimedPressureExpired, event);
    }

    world.setResource(TimedPressureState, next);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "timed-pressure-domain-kit",
    provides: ["n:timed-pressure", "pressure:timer"],
    resources: { TimedPressureState },
    events: { TimedPressureExpired, TimedPressureCompleted, TimedPressureExtended },
    systems: [{ phase: config.phase ?? "simulate", name: "timedPressureDomainSystem", system }],
    initWorld({ world }) {
      world.setResource(TimedPressureState, createState(config));
    },
    install({ engine, world }) {
      engine.timedPressureDomain = {
        extend(amount = 1) {
          const state = world.getResource(TimedPressureState) ?? createState(config);
          const next = {
            ...state,
            remaining: Math.max(0, state.remaining + Math.abs(toNumber(amount, 0))),
            expired: false,
            status: "running",
            lastEvent: { reason: "extend", amount }
          };
          world.setResource(TimedPressureState, next);
          world.emit(TimedPressureExtended, { id: next.id, amount });
          return clone(next);
        },
        complete(reason = "complete") {
          const state = world.getResource(TimedPressureState) ?? createState(config);
          const next = { ...state, completed: true, status: "completed", lastEvent: { reason } };
          world.setResource(TimedPressureState, next);
          world.emit(TimedPressureCompleted, { id: next.id, reason });
          return clone(next);
        },
        getState() {
          return clone(world.getResource(TimedPressureState));
        }
      };
    },
    metadata: {
      domain: "timed-pressure",
      scope: "large-domain",
      extendsBase: "DomainServiceKit",
      composes: ["pressure-domain-kit", "scenario-duration"],
      ownsLoop: false,
      purpose: "Owns deterministic countdown pressure such as storm timers, eclipse windows, closing gates, and verdict gears."
    }
  });
}

export default createTimedPressureDomainKit;
