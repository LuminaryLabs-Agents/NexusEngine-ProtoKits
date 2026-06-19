export const FLUID_FIELD_KIT_VERSION = "0.1.0";

export function cloneFluidValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function toFluidNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function asFluidArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

export function clampFluid(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, toFluidNumber(value, min)));
}

export function sampleFluidWave(position = {}, options = {}) {
  const x = toFluidNumber(position.x, 0);
  const z = toFluidNumber(position.z ?? position.y, 0);
  const time = toFluidNumber(options.time, 0);
  const amplitude = toFluidNumber(options.amplitude, 0.2);
  const frequency = toFluidNumber(options.frequency, 0.08);
  const flow = options.flow ?? { x: 0.8, z: 0.4 };
  const phase = x * frequency * toFluidNumber(flow.x, 1) + z * frequency * toFluidNumber(flow.z, 0.5) + time;
  return Math.sin(phase) * amplitude + Math.sin(phase * 0.37 + z * frequency) * amplitude * 0.42;
}

function requireNexus(NexusRealtime, factoryName) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`${factoryName} requires NexusRealtime.${key}.`);
    }
  }
}

function createFallbackState(spec, config = {}) {
  const initial = typeof spec.createInitial === "function" ? spec.createInitial(config) : cloneFluidValue(spec.initial ?? {});
  return {
    version: spec.version,
    id: String(config.id ?? spec.defaultId ?? spec.kitId),
    domain: spec.domain ?? "fluid",
    service: spec.service ?? spec.kitId,
    status: "ready",
    config: cloneFluidValue(config),
    lastActions: [],
    updatedAtTick: 0,
    ...initial
  };
}

export function createFluidServiceKit(NexusRealtime, spec = {}, config = {}) {
  const factoryName = spec.factoryName ?? "createFluidServiceKit";
  requireNexus(NexusRealtime, factoryName);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const State = defineResource(config.resourceName ?? spec.resourceName ?? `${spec.service ?? spec.kitId}.state`);
  const Action = defineEvent(config.actionEventName ?? `${spec.eventStem ?? spec.service ?? spec.kitId}.action`);
  const Updated = defineEvent(config.updatedEventName ?? `${spec.eventStem ?? spec.service ?? spec.kitId}.updated`);
  const Reset = defineEvent(config.resetEventName ?? `${spec.eventStem ?? spec.service ?? spec.kitId}.reset`);

  const createState = (override = {}) => createFallbackState(spec, { ...config, ...override });

  function setState(world, next, reason = "set") {
    const state = { ...next, updatedAtTick: toFluidNumber(world.__nexusClock?.frame, next.updatedAtTick), lastReason: reason };
    world.setResource(State, state);
    world.emit(Updated, { id: state.id, reason, service: state.service });
    return state;
  }

  function system(world) {
    let state = world.getResource(State) ?? createState();
    const dt = Math.max(0, toFluidNumber(world.__nexusClock?.delta, 0));
    const actions = asFluidArray(world.readEvents(Action));
    let next = { ...state, lastActions: actions.map((event) => cloneFluidValue(event)).slice(-8) };
    for (const event of actions) {
      if (typeof spec.reduceAction === "function") {
        next = spec.reduceAction(next, event, { config, world, dt, State, Action, Updated, Reset, clone: cloneFluidValue, toNumber: toFluidNumber, asArray: asFluidArray, clamp: clampFluid, sampleWave: sampleFluidWave });
      }
    }
    if (typeof spec.tick === "function") {
      next = spec.tick(next, { config, world, dt, State, Action, Updated, Reset, clone: cloneFluidValue, toNumber: toFluidNumber, asArray: asFluidArray, clamp: clampFluid, sampleWave: sampleFluidWave });
    }
    next = { ...next, updatedAtTick: toFluidNumber(world.__nexusClock?.frame, next.updatedAtTick) };
    world.setResource(State, next);
  }

  return defineRuntimeKit({
    id: config.kitId ?? spec.kitId,
    requires: asFluidArray(config.requires ?? spec.requires),
    provides: asFluidArray(config.provides ?? spec.provides),
    resources: { State },
    events: { Action, Updated, Reset },
    systems: [{ phase: config.phase ?? spec.phase ?? "simulate", name: spec.systemName ?? `${spec.engineKey}System`, system }],
    initWorld({ world }) {
      world.setResource(State, createState());
    },
    install({ engine, world }) {
      const getState = () => cloneFluidValue(world.getResource(State) ?? createState());
      const replaceState = (next, reason = "set") => cloneFluidValue(setState(world, next, reason));
      const patchState = (patch = {}, reason = "configure") => {
        const current = world.getResource(State) ?? createState();
        return cloneFluidValue(setState(world, { ...current, ...cloneFluidValue(patch) }, reason));
      };
      const helpers = { world, engine, State, Action, Updated, Reset, config, getState, replaceState, patchState, createState, clone: cloneFluidValue, toNumber: toFluidNumber, asArray: asFluidArray, clamp: clampFluid, sampleWave: sampleFluidWave };
      engine[spec.engineKey] = {
        resources: { State },
        events: { Action, Updated, Reset },
        action(payload = {}) {
          world.emit(Action, cloneFluidValue(payload));
          return getState();
        },
        configure(patch = {}) {
          return patchState({ config: { ...getState().config, ...cloneFluidValue(patch) } }, "configure");
        },
        reset(payload = {}) {
          const next = createState(payload);
          world.setResource(State, next);
          world.emit(Reset, { id: next.id, reason: payload.reason ?? "reset" });
          return getState();
        },
        getState,
        ...(typeof spec.methods === "function" ? spec.methods(helpers) : {})
      };
    },
    metadata: {
      purpose: spec.purpose ?? "Fluid service kit.",
      boundary: spec.boundary ?? "Owns service state and descriptors; renderers present snapshots."
    }
  });
}

function normalizeField(field = {}, index = 0) {
  const id = String(field.id ?? `field-${index + 1}`);
  return {
    id,
    kind: String(field.kind ?? "scalar"),
    value: toFluidNumber(field.value, 0),
    amplitude: toFluidNumber(field.amplitude, 0.2),
    frequency: toFluidNumber(field.frequency, 0.08),
    flow: cloneFluidValue(field.flow ?? { x: 1, z: 0.35 }),
    bounds: cloneFluidValue(field.bounds ?? { x: 0, z: 0, width: 128, depth: 128 }),
    metadata: cloneFluidValue(field.metadata ?? {})
  };
}

function createInitial(config = {}) {
  const fields = asFluidArray(config.fields ?? [{ id: "surface-height", amplitude: 0.22, frequency: 0.085 }]).map(normalizeField);
  return {
    fields,
    fieldsById: Object.fromEntries(fields.map((field) => [field.id, field])),
    sampleCount: 0
  };
}

export function createFluidFieldKit(NexusRealtime, config = {}) {
  return createFluidServiceKit(NexusRealtime, {
    version: FLUID_FIELD_KIT_VERSION,
    factoryName: "createFluidFieldKit",
    kitId: "fluid-field-kit",
    engineKey: "fluidField",
    resourceName: "fluidField.state",
    eventStem: "fluidField",
    domain: "fluid",
    service: "field",
    provides: ["fluid:field", "fluid:scalar-field", "fluid:vector-field"],
    purpose: "Generic scalar/vector fluid field descriptors and deterministic sampling.",
    createInitial,
    reduceAction(state, event) {
      if (event.type === "set-fields") {
        const fields = asFluidArray(event.fields).map(normalizeField);
        return { ...state, fields, fieldsById: Object.fromEntries(fields.map((field) => [field.id, field])) };
      }
      return state;
    },
    methods({ getState, patchState, toNumber, sampleWave }) {
      function setFields(fields) {
        const normalized = asFluidArray(fields).map(normalizeField);
        return patchState({ fields: normalized, fieldsById: Object.fromEntries(normalized.map((field) => [field.id, field])) }, "set-fields");
      }
      function sample(fieldId = "surface-height", position = {}, options = {}) {
        const state = getState();
        const field = state.fieldsById[fieldId] ?? state.fields[0] ?? normalizeField({ id: fieldId });
        const value = field.value + sampleWave(position, { ...field, time: toNumber(options.time, state.updatedAtTick * 0.016) });
        return { fieldId: field.id, position: cloneFluidValue(position), value, normal: { x: -value * 0.08, y: 1, z: value * 0.05 }, flow: cloneFluidValue(field.flow), kind: field.kind };
      }
      return { setFields, sample };
    }
  }, config);
}

export default createFluidFieldKit;
