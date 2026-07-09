export const PRESSURE_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`createPressureDomainKit requires NexusEngine.${key}.`);
    }
  }
}

function normalizeChannel(channel = {}, index = 0) {
  const id = String(channel.id ?? `pressure-${index + 1}`);
  const min = toNumber(channel.min, 0);
  const max = Math.max(min + 1, toNumber(channel.max, 100));
  const value = Math.max(min, Math.min(max, toNumber(channel.value ?? channel.initial, min)));
  const failAt = Math.max(min, Math.min(max, toNumber(channel.failAt, max)));
  const warningAt = Math.max(min, Math.min(failAt, toNumber(channel.warningAt, failAt * 0.7)));
  return {
    id,
    label: String(channel.label ?? id),
    min,
    max,
    value,
    warningAt,
    failAt,
    risePerSecond: toNumber(channel.risePerSecond, 0),
    fallPerSecond: toNumber(channel.fallPerSecond, 0),
    status: value >= failAt ? "failed" : value >= warningAt ? "warning" : "stable"
  };
}

function createState(config = {}) {
  const channels = asArray(config.channels).map(normalizeChannel);
  return {
    version: PRESSURE_DOMAIN_KIT_VERSION,
    id: config.stateId ?? "pressure-domain",
    domain: "pressure",
    channels,
    channelsById: Object.fromEntries(channels.map((item) => [item.id, item])),
    status: channels.some((item) => item.status === "failed") ? "failed" : channels.some((item) => item.status === "warning") ? "warning" : "stable",
    lastChange: null
  };
}

function classify(channel) {
  return channel.value >= channel.failAt ? "failed" : channel.value >= channel.warningAt ? "warning" : "stable";
}

function rebuild(state) {
  const channelsById = Object.fromEntries(state.channels.map((item) => [item.id, item]));
  return {
    ...state,
    channelsById,
    status: state.channels.some((item) => item.status === "failed") ? "failed" : state.channels.some((item) => item.status === "warning") ? "warning" : "stable"
  };
}

export function createPressureDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;

  const PressureDomainState = defineResource(config.resourceName ?? "pressureDomain.state");
  const PressureChanged = defineEvent("pressure.changed");
  const PressureFailed = defineEvent("pressure.failed");
  const PressureWarning = defineEvent("pressure.warning");

  function system(world) {
    let state = world.getResource(PressureDomainState) ?? createState(config);
    const dt = Math.max(0, toNumber(world.__nexusClock?.delta, 0));
    const changes = [];
    const channels = state.channels.map((channel) => {
      let value = channel.value + (channel.risePerSecond - channel.fallPerSecond) * dt;
      value = Math.max(channel.min, Math.min(channel.max, value));
      const next = { ...channel, value, status: classify({ ...channel, value }) };
      if (next.value !== channel.value || next.status !== channel.status) {
        changes.push({ id: channel.id, before: channel.value, after: next.value, status: next.status, reason: "tick" });
      }
      return next;
    });

    state = rebuild({ ...state, channels, lastChange: changes.at(-1) ?? state.lastChange });
    for (const change of changes) {
      world.emit(PressureChanged, change);
      if (change.status === "warning") world.emit(PressureWarning, change);
      if (change.status === "failed") world.emit(PressureFailed, change);
    }
    world.setResource(PressureDomainState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "pressure-domain-kit",
    provides: ["n:pressure", "pressure:channels"],
    resources: { PressureDomainState },
    events: { PressureChanged, PressureFailed, PressureWarning },
    systems: [{ phase: config.phase ?? "simulate", name: "pressureDomainSystem", system }],
    initWorld({ world }) {
      world.setResource(PressureDomainState, createState(config));
    },
    install({ engine, world }) {
      engine.pressureDomain = {
        adjust(id, amount, reason = "adjust") {
          let state = world.getResource(PressureDomainState) ?? createState(config);
          const channels = state.channels
            .map((channel) => channel.id === id ? { ...channel, value: Math.max(channel.min, Math.min(channel.max, channel.value + toNumber(amount, 0))) } : channel)
            .map((channel) => ({ ...channel, status: classify(channel) }));
          state = rebuild({ ...state, channels, lastChange: { id, amount, reason } });
          world.setResource(PressureDomainState, state);
          world.emit(PressureChanged, { id, amount, reason });
          return clone(state.channelsById[id] ?? null);
        },
        getState() {
          return clone(world.getResource(PressureDomainState));
        }
      };
    },
    metadata: {
      domain: "pressure",
      scope: "large-domain",
      extendsBase: "DomainServiceKit",
      composes: ["resource-meter-domain-kit", "timed-pressure-domain-kit", "telemetry"],
      ownsLoop: false,
      purpose: "Owns reusable rising/falling pressure state, thresholds, and transition events."
    }
  });
}

export default createPressureDomainKit;
