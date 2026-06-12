export const GENERIC_KIT_UTILS_VERSION = "0.1.0";

function fallbackDefineRuntimeKit(config) {
  return Object.freeze({
    id: config.id,
    components: config.components ?? {},
    resources: config.resources ?? {},
    events: config.events ?? {},
    systems: config.systems ?? [],
    shaders: config.shaders ?? [],
    materials: config.materials ?? [],
    sequences: config.sequences ?? [],
    subscriptions: config.subscriptions ?? [],
    requires: config.requires ?? [],
    provides: config.provides ?? [],
    bindings: Object.freeze({ ...(config.bindings ?? {}) }),
    initWorld: config.initWorld,
    install: config.install,
    metadata: Object.freeze({ ...(config.metadata ?? {}) })
  });
}

export function createGenericProtoKit(NexusRealtime, definition, config = {}) {
  const defineRuntimeKit = NexusRealtime?.defineRuntimeKit ?? fallbackDefineRuntimeKit;
  const id = config.id ?? definition.id;
  const stateBindingName = `${definition.camelName}State`;
  const apiBindingName = `${definition.camelName}Api`;
  const State = typeof NexusRealtime?.defineResource === "function" ? NexusRealtime.defineResource(`${id}.state`) : `${id}.state`;
  const Configured = typeof NexusRealtime?.defineEvent === "function" ? NexusRealtime.defineEvent(`${id}.configured`) : `${id}.configured`;

  function createInitialState() {
    return {
      id,
      version: definition.version ?? "0.1.0",
      status: "ready",
      category: definition.category,
      tier: definition.tier ?? "atomic",
      provides: [...(definition.provides ?? [])],
      requires: [...(definition.requires ?? [])],
      config: { ...config }
    };
  }

  function getState(world) {
    return typeof world?.getResource === "function" ? world.getResource(State) : createInitialState();
  }

  return defineRuntimeKit({
    id,
    provides: [...(definition.provides ?? [])],
    requires: [...(definition.requires ?? [])],
    resources: { State },
    events: { Configured },
    systems: [
      {
        phase: definition.phase ?? "simulate",
        name: `${id}:generic-noop-system`,
        system(world) {
          const previous = world.getResource(State);
          if (!previous) world.setResource(State, createInitialState());
        }
      }
    ],
    initWorld({ world }) {
      world.setResource(State, createInitialState());
      world.emit?.(Configured, { id, category: definition.category });
    },
    install({ engine, world }) {
      const api = {
        id,
        definition,
        getState() {
          return getState(world);
        },
        configure(nextConfig = {}) {
          const previous = getState(world);
          const next = { ...previous, config: { ...previous.config, ...nextConfig } };
          world.setResource?.(State, next);
          world.emit?.(Configured, { id, config: next.config });
          return next;
        }
      };
      if (!engine.genericProtoKits) engine.genericProtoKits = {};
      engine.genericProtoKits[id] = api;
      if (definition.engineKey) engine[definition.engineKey] = api;
    },
    bindings: {
      [stateBindingName]: State,
      [apiBindingName]: Object.freeze({ id, definition })
    },
    metadata: {
      protoKit: id,
      category: definition.category,
      tier: definition.tier ?? "atomic",
      status: "functional-scaffold",
      purpose: definition.purpose ?? "Generic compositional ProtoKit."
    }
  });
}
