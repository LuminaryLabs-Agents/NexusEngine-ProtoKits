export const PRODUCTION_DOMAIN_KIT_VERSION = "0.1.0";

export const clone = (value) => value === undefined
  ? undefined
  : typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export const list = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
export const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
export const integer = (value, fallback = 0) => Math.max(0, Math.floor(number(value, fallback)));
export const clamp = (value, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, number(value)));

export function stableId(value, label = "Value") {
  const id = String(value ?? "").trim();
  if (!id) throw new TypeError(`${label} requires a stable id.`);
  return id;
}

export function seededUnit(seed) {
  const text = String(seed ?? "seed");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function requireNexus(NexusEngine, factoryName) {
  for (const key of ["defineDomainServiceKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`${factoryName} requires NexusEngine.${key}.`);
    }
  }
}

export function createProductionDomainKit(
  NexusEngine,
  spec,
  config,
  createInitialState,
  createServices
) {
  requireNexus(NexusEngine, spec.factory);
  const State = NexusEngine.defineResource(config.resourceName ?? spec.resource);
  const eventRefs = Object.fromEntries(spec.events.map((name) => [name, NexusEngine.defineEvent(name)]));
  const initial = {
    schema: spec.schema,
    version: PRODUCTION_DOMAIN_KIT_VERSION,
    revision: 1,
    journal: [],
    processedCommands: {},
    lastResult: null,
    ...clone(createInitialState(config))
  };
  const journalLimit = Math.max(8, integer(config.journalLimit, 128));
  const commandLimit = Math.max(32, integer(config.commandLimit, 512));

  return NexusEngine.defineDomainServiceKit({
    id: config.kitId ?? config.id ?? spec.kitId,
    domain: spec.domain,
    domainPath: spec.domainPath,
    parentDomainPath: spec.parentDomainPath,
    apiName: config.apiName ?? spec.apiName,
    version: PRODUCTION_DOMAIN_KIT_VERSION,
    stability: config.stability ?? "protokit",
    services: spec.services,
    provides: spec.provides,
    requires: config.requires ?? [],
    resources: { State },
    events: eventRefs,
    metadata: {
      purpose: spec.purpose,
      classification: "feature-domain",
      deterministic: true,
      rendererAgnostic: true,
      browserAgnostic: true,
      snapshotPolicy: "versioned-serializable",
      resetPolicy: "deterministic-initial-state",
      ownership: clone(spec.ownership),
      exclusions: clone(spec.exclusions),
      dependencies: clone(spec.dependencies),
      ...(config.metadata ?? {})
    },
    initWorld({ world }) {
      world.setResource(State, clone(initial));
    },
    createApi({ world }) {
      const read = () => world.getResource(State) ?? clone(initial);
      const write = (state) => {
        world.setResource(State, clone(state));
        return clone(state);
      };
      const emit = (eventName, payload) => {
        const ref = eventRefs[eventName];
        if (!ref) throw new TypeError(`${spec.factory} does not declare event ${eventName}.`);
        world.emit(ref, clone(payload));
      };
      const previousCommand = (commandId) => commandId == null
        ? null
        : read().processedCommands[String(commandId)] ?? null;
      const commit = ({ result, transform = (state) => state, eventName = null, commandId = null }) => {
        const normalizedCommandId = commandId == null ? null : stableId(commandId, "Command");
        const previous = previousCommand(normalizedCommandId);
        if (previous) return { ...clone(previous), duplicate: true };

        const current = read();
        const transformed = transform(clone(current));
        const normalizedResult = clone(result);
        const processedCommands = { ...current.processedCommands };
        if (normalizedCommandId) processedCommands[normalizedCommandId] = normalizedResult;
        const commandIds = Object.keys(processedCommands);
        for (const expiredId of commandIds.slice(0, Math.max(0, commandIds.length - commandLimit))) {
          delete processedCommands[expiredId];
        }
        const next = {
          ...transformed,
          revision: number(current.revision, 0) + 1,
          journal: [...list(current.journal), normalizedResult].slice(-journalLimit),
          processedCommands,
          lastResult: normalizedResult
        };
        write(next);
        if (eventName) emit(eventName, normalizedResult);
        return clone(normalizedResult);
      };
      const reject = (reason, payload = {}, commandId = payload.commandId ?? null) => commit({
        result: { ok: false, reason, ...clone(payload) },
        eventName: spec.rejectedEvent,
        commandId
      });
      const reset = (payload = {}) => {
        write(clone(initial));
        emit(spec.resetEvent, { reason: payload.reason ?? "reset", revision: initial.revision });
        return clone(initial);
      };
      const loadSnapshot = (snapshot) => {
        if (snapshot?.schema !== spec.schema || snapshot?.version !== PRODUCTION_DOMAIN_KIT_VERSION) {
          throw new TypeError(`Unsupported ${spec.domain} snapshot.`);
        }
        return write(clone(snapshot));
      };
      const services = createServices({
        config,
        read,
        write,
        emit,
        commit,
        reject,
        previousCommand
      });
      return Object.freeze({
        ...services,
        getState: () => clone(read()),
        getSnapshot: () => clone(read()),
        loadSnapshot,
        reset
      });
    }
  });
}
