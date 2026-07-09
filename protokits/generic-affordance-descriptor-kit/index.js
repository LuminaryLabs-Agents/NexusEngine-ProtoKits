export const GENERIC_AFFORDANCE_DESCRIPTOR_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`createGenericAffordanceDescriptorKit requires NexusEngine.${key}.`);
    }
  }
}

export function normalizeAffordance(affordance = {}, index = 0) {
  const id = String(affordance.id ?? affordance.name ?? `affordance-${index + 1}`).trim();
  if (!id) throw new TypeError("Affordances require a stable id.");
  return {
    id,
    index,
    label: String(affordance.label ?? id),
    actionIds: asArray(affordance.actionIds).map(String).filter(Boolean),
    targetId: String(affordance.targetId ?? id),
    enabled: affordance.enabled !== false,
    blocked: Boolean(affordance.blocked),
    completed: Boolean(affordance.completed),
    hidden: Boolean(affordance.hidden),
    dangerous: Boolean(affordance.dangerous),
    priority: toNumber(affordance.priority, index),
    rejectionReason: String(affordance.rejectionReason ?? "affordance-unavailable"),
    descriptor: {
      icon: String(affordance.descriptor?.icon ?? "target"),
      glow: affordance.descriptor?.glow !== false,
      prompt: String(affordance.descriptor?.prompt ?? affordance.label ?? id),
      worldAnchorId: String(affordance.descriptor?.worldAnchorId ?? affordance.targetId ?? id),
      tone: String(affordance.descriptor?.tone ?? "neutral"),
      tags: asArray(affordance.descriptor?.tags ?? affordance.tags).map(String).filter(Boolean)
    },
    useCount: 0,
    lastUsedAt: null,
    lastChangedAt: null
  };
}

function createState(config = {}) {
  const affordances = asArray(config.affordances).map(normalizeAffordance);
  return {
    version: GENERIC_AFFORDANCE_DESCRIPTOR_KIT_VERSION,
    id: config.stateId ?? "generic-affordance",
    affordances,
    affordancesById: Object.fromEntries(affordances.map((affordance) => [affordance.id, affordance])),
    recentChanges: [],
    recentUses: [],
    tick: 0
  };
}

function updateIndex(state) {
  return { ...state, affordancesById: Object.fromEntries(state.affordances.map((affordance) => [affordance.id, affordance])) };
}

function available(affordance, config, actionId = null) {
  if (!affordance.enabled || affordance.blocked || affordance.hidden) return false;
  if (affordance.completed && (config.hideCompleted ?? false)) return false;
  if (affordance.completed) return false;
  if (actionId && affordance.actionIds.length && !affordance.actionIds.includes(actionId)) return false;
  return true;
}

export function createGenericAffordanceDescriptorKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;

  const AffordanceState = defineResource(config.resourceName ?? "genericAffordance.state");
  const UseRequested = defineEvent("genericAffordance.useRequested");
  const Used = defineEvent("genericAffordance.used");
  const Rejected = defineEvent("genericAffordance.rejected");
  const EnabledChanged = defineEvent("genericAffordance.enabledChanged");
  const BlockedChanged = defineEvent("genericAffordance.blockedChanged");
  const CompletedChanged = defineEvent("genericAffordance.completedChanged");
  const DescriptorChanged = defineEvent("genericAffordance.descriptorChanged");
  const Reset = defineEvent("genericAffordance.reset");

  function change(world, id, patch, eventDef, reason = "change") {
    let state = world.getResource(AffordanceState);
    const now = toNumber(world.__nexusClock?.elapsed, 0);
    let result = null;
    state.affordances = state.affordances.map((affordance) => {
      if (affordance.id !== id) return affordance;
      result = { id, reason, before: clone(affordance), patch };
      return { ...affordance, ...patch, lastChangedAt: now };
    });
    if (!result) return null;
    state = updateIndex({ ...state, recentChanges: [result, ...state.recentChanges].slice(0, 12), tick: toNumber(world.__nexusClock?.frame, state.tick) });
    world.setResource(AffordanceState, state);
    world.emit(eventDef, result);
    return clone(state.affordancesById[id]);
  }

  return defineRuntimeKit({
    id: config.kitId ?? config.id ?? "generic-affordance-descriptor-kit",
    provides: ["affordance:descriptor", "affordance:availability", "validation:affordance"],
    resources: { AffordanceState },
    events: { UseRequested, Used, Rejected, EnabledChanged, BlockedChanged, CompletedChanged, DescriptorChanged, Reset },
    systems: [{
      phase: config.phase ?? "simulate",
      name: "genericAffordanceDescriptorSystem",
      system(world) {
        const state = world.getResource(AffordanceState) ?? createState(config);
        world.setResource(AffordanceState, updateIndex({ ...state, tick: toNumber(world.__nexusClock?.frame, state.tick) }));
      }
    }],
    initWorld({ world }) {
      world.setResource(AffordanceState, createState(config));
    },
    install({ engine, world }) {
      engine.genericAffordances = {
        resources: { AffordanceState },
        events: { UseRequested, Used, Rejected, EnabledChanged, BlockedChanged, CompletedChanged, DescriptorChanged, Reset },
        getState() {
          return clone(world.getResource(AffordanceState));
        },
        getAffordance(id) {
          return clone(world.getResource(AffordanceState)?.affordancesById?.[id] ?? null);
        },
        getAvailable(actionId = null) {
          return clone((world.getResource(AffordanceState)?.affordances ?? []).filter((affordance) => available(affordance, config, actionId)).sort((a, b) => a.priority - b.priority));
        },
        setEnabled(id, enabled, reason = "setEnabled") {
          return change(world, id, { enabled: Boolean(enabled) }, EnabledChanged, reason);
        },
        setBlocked(id, blocked, reason = "setBlocked") {
          return change(world, id, { blocked: Boolean(blocked), rejectionReason: reason }, BlockedChanged, reason);
        },
        setCompleted(id, completed, reason = "setCompleted") {
          return change(world, id, { completed: Boolean(completed), hidden: Boolean(completed) && Boolean(config.hideCompleted) }, CompletedChanged, reason);
        },
        setDescriptor(id, descriptor = {}, reason = "setDescriptor") {
          const current = world.getResource(AffordanceState)?.affordancesById?.[id];
          if (!current) return null;
          return change(world, id, { descriptor: { ...current.descriptor, ...descriptor } }, DescriptorChanged, reason);
        },
        requestUse(id, actionId, payload = {}) {
          let state = world.getResource(AffordanceState);
          const now = toNumber(world.__nexusClock?.elapsed, 0);
          const current = state.affordancesById[id];
          world.emit(UseRequested, { id, actionId, payload });
          if (!current || !available(current, config, actionId)) {
            const event = { id, actionId, payload, reason: current?.rejectionReason ?? config.defaultRejectionReason ?? "affordance-unavailable" };
            world.emit(Rejected, event);
            state = { ...state, recentUses: [event, ...state.recentUses].slice(0, 12) };
            world.setResource(AffordanceState, state);
            return clone(event);
          }
          const next = { ...current, useCount: current.useCount + 1, lastUsedAt: now };
          const event = { id, actionId, payload, descriptor: next.descriptor, usedAt: now };
          state.affordances = state.affordances.map((affordance) => affordance.id === id ? next : affordance);
          state = updateIndex({ ...state, recentUses: [event, ...state.recentUses].slice(0, 12) });
          world.setResource(AffordanceState, state);
          world.emit(Used, event);
          return clone(event);
        },
        reset(payload = {}) {
          const state = createState({ ...config, affordances: payload.affordances ?? config.affordances ?? [] });
          world.setResource(AffordanceState, state);
          world.emit(Reset, { reason: payload.reason ?? "reset", count: state.affordances.length });
          return clone(state);
        }
      };
    },
    metadata: {
      purpose: "Generic deterministic interactable availability and renderable affordance descriptors.",
      boundary: "Owns usable, blocked, completed, hidden, dangerous, targetable, rejection, and descriptor state. Renderers only display descriptors."
    }
  });
}

export default createGenericAffordanceDescriptorKit;
