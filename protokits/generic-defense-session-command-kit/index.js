export const GENERIC_DEFENSE_SESSION_COMMAND_VERSION = "0.1.0";

export const GENERIC_DEFENSE_SESSION_COMMAND_ENGINE_NAMESPACE = "genericDefense";

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function n(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function idOf(value, fallback = "id") {
  const text = String(value ?? fallback).trim();
  return text || fallback;
}

function ensureNamespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[GENERIC_DEFENSE_SESSION_COMMAND_ENGINE_NAMESPACE] || typeof engine.n[GENERIC_DEFENSE_SESSION_COMMAND_ENGINE_NAMESPACE] !== "object") {
    engine.n[GENERIC_DEFENSE_SESSION_COMMAND_ENGINE_NAMESPACE] = {};
  }
  return engine.n[GENERIC_DEFENSE_SESSION_COMMAND_ENGINE_NAMESPACE];
}

function sessionFacade(engine) {
  return engine?.n?.genericDefense?.sessionFacade ?? engine?.genericDefense ?? null;
}

function resourcesFor(engine) {
  return engine?.n?.genericDefense?.resources ?? engine?.genericDefense?.resources ?? {};
}

function eventsFor(engine) {
  return engine?.n?.genericDefense?.events ?? engine?.genericDefense?.events ?? {};
}

function snapshotFor(engine) {
  return sessionFacade(engine)?.getSnapshot?.() ?? engine?.genericDefense?.getSnapshot?.() ?? {};
}

function emitIfPresent(world, event, payload = {}) {
  if (event) world.emit(event, payload);
}

function reject(world, engine, payload = {}) {
  emitIfPresent(world, eventsFor(engine).Rejected, payload);
  return { accepted: false, ...payload };
}

export function createGenericDefenseSessionCommandKit(NexusEngine, config = {}) {
  if (typeof NexusEngine?.defineRuntimeKit !== "function") {
    throw new TypeError("createGenericDefenseSessionCommandKit requires NexusEngine.defineRuntimeKit.");
  }

  const processedCommandIds = new Set();

  return NexusEngine.defineRuntimeKit({
    id: config.kitId ?? "generic-defense-session-command-kit",
    requires: ["game:generic-defense"],
    provides: ["session:commands", "build:blueprint-selection", "structure:sell"],
    resources: {},
    events: {},
    systems: [],
    install({ engine, world }) {
      const namespace = ensureNamespace(engine);
      if (!namespace) return;

      function setBlueprint(blueprintId, payload = {}) {
        const resources = resourcesFor(engine);
        if (!resources.SessionState) return reject(world, engine, { reason: "session-resource-missing", blueprintId });
        const snapshot = snapshotFor(engine);
        const blueprints = snapshot.structures?.blueprints ?? snapshot.level?.blueprints ?? {};
        const id = idOf(blueprintId, snapshot.session?.blueprintId ?? "");
        const blueprint = blueprints[id];
        if (!blueprint) return reject(world, engine, { reason: "unknown-blueprint", blueprintId: id, commandId: payload.commandId });
        const session = world.getResource(resources.SessionState) ?? snapshot.session ?? {};
        const next = {
          ...session,
          blueprintId: id,
          message: payload.message ?? `${blueprint.label ?? id} selected.`
        };
        world.setResource(resources.SessionState, next);
        return { accepted: true, blueprintId: id, session: clone(next) };
      }

      function sell(structureId, payload = {}) {
        const resources = resourcesFor(engine);
        if (!resources.StructureState || !resources.EconomyState) {
          return reject(world, engine, { reason: "resources-missing", structureId, commandId: payload.commandId });
        }
        const id = idOf(structureId, "");
        const commandId = payload.commandId ?? `sell:${id}`;
        if (processedCommandIds.has(commandId)) return { accepted: false, duplicate: true, commandId, structureId: id };
        processedCommandIds.add(commandId);

        const structures = world.getResource(resources.StructureState);
        const target = structures?.structures?.[id];
        if (!target) return reject(world, engine, { reason: "unknown-structure", structureId: id, commandId });

        const blueprints = structures.blueprints ?? {};
        const blueprint = blueprints[target.blueprintId] ?? {};
        const refund = Math.max(0, Math.round(n(blueprint.cost, 0) * n(config.sellRefundRatio, 0.65)));
        const nextStructures = { ...(structures.structures ?? {}) };
        delete nextStructures[id];
        world.setResource(resources.StructureState, { ...structures, structures: nextStructures });
        emitIfPresent(world, eventsFor(engine).EconomyCredit, { amount: refund, commandId: `${commandId}:refund`, reason: "sell", structureId: id });

        const session = world.getResource(resources.SessionState);
        if (session?.selectedId === id) {
          emitIfPresent(world, eventsFor(engine).Select, { id: null, kind: null, message: "Structure sold." });
        }
        return { accepted: true, commandId, structureId: id, refund };
      }

      const commands = {
        setBlueprint,
        sell,
        getSnapshot: () => clone(snapshotFor(engine)?.session ?? {})
      };
      const commandExtensions = { setBlueprint, sell };

      namespace.sessionCommands = commands;
      if (namespace.sessionFacade && typeof namespace.sessionFacade === "object") Object.assign(namespace.sessionFacade, commandExtensions);
      if (engine.genericDefense && typeof engine.genericDefense === "object") Object.assign(engine.genericDefense, commandExtensions);
    },
    metadata: {
      version: GENERIC_DEFENSE_SESSION_COMMAND_VERSION,
      purpose: "Renderer-agnostic host-input command extension for generic defense session state.",
      dskBoundary: {
        id: "sessionCommands",
        resources: ["genericDefense.session.state", "genericDefense.structure.state", "genericDefense.economy.state"],
        events: ["genericDefense.select", "genericDefense.economy.credit", "genericDefense.command.rejected"],
        methods: [
          "engine.n.genericDefense.sessionFacade.setBlueprint",
          "engine.n.genericDefense.sessionFacade.sell",
          "engine.n.genericDefense.sessionCommands.setBlueprint",
          "engine.n.genericDefense.sessionCommands.sell"
        ],
        snapshots: ["session.blueprintId", "structures.structures", "economy.currency"],
        descriptors: [],
        boundary: "Host-input commands for blueprint selection and structure sell without DOM, Canvas, renderer, or browser ownership."
      },
      engineNamespace: "engine.n.genericDefense.sessionCommands",
      apiSurface: {
        resources: ["genericDefense.session.state", "genericDefense.structure.state", "genericDefense.economy.state"],
        events: ["genericDefense.select", "genericDefense.economy.credit", "genericDefense.command.rejected"],
        methods: ["setBlueprint", "sell", "getSnapshot"],
        snapshots: ["session.blueprintId", "structures.structures", "economy.currency"],
        descriptors: []
      }
    }
  });
}

export default createGenericDefenseSessionCommandKit;
