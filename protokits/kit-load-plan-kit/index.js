import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const KIT_LOAD_PLAN_KIT_VERSION = "0.1.0";

function clock(world) { return number(world?.__nexusClock?.elapsed, 0); }
function cleanId(value, fallback = "entry") { return String(value ?? fallback).trim() || fallback; }

export function normalizeKitLoadEntry(entry = {}, index = 0) {
  const id = cleanId(entry.id ?? entry.name ?? entry.path, `kit-${index + 1}`);
  return {
    id,
    label: String(entry.label ?? entry.title ?? id),
    url: entry.url ?? null,
    specifier: entry.specifier ?? entry.import ?? entry.url ?? null,
    kind: entry.kind ?? "protokit",
    phase: entry.phase ?? "kits",
    required: entry.required ?? true,
    priority: number(entry.priority, index),
    status: entry.status ?? "pending",
    startedAt: entry.startedAt ?? null,
    endedAt: entry.endedAt ?? null,
    durationMs: number(entry.durationMs, 0),
    exports: asList(entry.exports),
    metrics: clone(entry.metrics ?? {}),
    error: entry.error ?? null,
    metadata: clone(entry.metadata ?? {})
  };
}

export function createKitLoadPlanState(options = {}) {
  const entries = asList(options.entries ?? options.kits).map(normalizeKitLoadEntry);
  return {
    version: KIT_LOAD_PLAN_KIT_VERSION,
    id: options.planId ?? "kit-load-plan",
    mode: options.mode ?? "sequential",
    entries: Object.fromEntries(entries.map((entry) => [entry.id, entry])),
    order: entries.map((entry) => entry.id),
    history: []
  };
}

export function summarizeKitLoadPlan(state = {}) {
  const entries = Object.values(state.entries ?? {});
  return {
    total: entries.length,
    pending: entries.filter((entry) => entry.status === "pending").length,
    running: entries.filter((entry) => entry.status === "running").length,
    done: entries.filter((entry) => entry.status === "done").length,
    failed: entries.filter((entry) => entry.status === "failed").length,
    optionalFailed: entries.filter((entry) => entry.status === "failed" && entry.required === false).length,
    requiredFailed: entries.filter((entry) => entry.status === "failed" && entry.required !== false).length,
    progress: entries.length ? entries.filter((entry) => entry.status === "done").length / entries.length : 1,
    durationMs: entries.reduce((sum, entry) => sum + number(entry.durationMs, 0), 0)
  };
}

function publish(world, State, Updated, next, eventRecord) {
  next.history = eventRecord ? [eventRecord, ...(next.history ?? [])].slice(0, 96) : next.history;
  world.setResource(State, next);
  world.emit?.(Updated, { event: clone(eventRecord), summary: summarizeKitLoadPlan(next), state: clone(next) });
  return clone(next);
}

export function createKitLoadPlanKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "kitLoadPlan.state");
  const Updated = event("kitLoadPlan.updated");
  const EntryUpdated = event("kitLoadPlan.entryUpdated");
  const initial = () => createKitLoadPlanState(options);

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "kit-load-plan-kit",
    resources: { State },
    events: { Updated, EntryUpdated },
    provides: ["kit-load-plan", "module-load-plan", "boot-load-metrics", "loader-progress-descriptors"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const api = {
        getState: state,
        snapshot: () => clone(state()),
        summarize: () => summarizeKitLoadPlan(state()),
        setPlan(entries = []) {
          const next = createKitLoadPlanState({ ...options, entries });
          return publish(world, State, Updated, next, { at: clock(world), type: "setPlan", count: next.order.length });
        },
        register(entry = {}) {
          const next = state();
          const normalized = normalizeKitLoadEntry(entry, next.order.length);
          next.entries[normalized.id] = normalized;
          if (!next.order.includes(normalized.id)) next.order.push(normalized.id);
          const evt = { at: clock(world), type: "register", id: normalized.id, status: normalized.status };
          world.emit?.(EntryUpdated, { entry: clone(normalized), event: evt });
          return publish(world, State, Updated, next, evt);
        },
        mark(id, status, payload = {}) {
          const next = state();
          const entry = next.entries[id];
          if (!entry) throw new Error(`Unknown kit load entry: ${id}`);
          const nextEntry = {
            ...entry,
            status,
            startedAt: status === "running" ? clock(world) : entry.startedAt,
            endedAt: ["done", "failed", "skipped"].includes(status) ? clock(world) : entry.endedAt,
            durationMs: ["done", "failed", "skipped"].includes(status) ? Math.round((clock(world) - number(entry.startedAt, clock(world))) * 1000) : entry.durationMs,
            exports: asList(payload.exports ?? entry.exports),
            metrics: { ...entry.metrics, ...(payload.metrics ?? {}) },
            error: payload.error ?? (status === "failed" ? entry.error : null),
            metadata: { ...entry.metadata, ...(payload.metadata ?? {}) }
          };
          next.entries[id] = nextEntry;
          const evt = { at: clock(world), type: "mark", id, status };
          world.emit?.(EntryUpdated, { entry: clone(nextEntry), event: evt });
          return publish(world, State, Updated, next, evt);
        },
        getNext(status = "pending") {
          const next = state();
          const id = next.order.find((entryId) => next.entries[entryId]?.status === status);
          return clone(id ? next.entries[id] : null);
        },
        list(filter = {}) {
          const next = state();
          return next.order.map((id) => next.entries[id]).filter(Boolean).filter((entry) => (!filter.status || entry.status === filter.status) && (!filter.kind || entry.kind === filter.kind) && (!filter.phase || entry.phase === filter.phase)).map(clone);
        },
        reset() { world.setResource(State, initial()); return this.snapshot(); }
      };
      engine.kitLoadPlan = api;
      engine.n ??= {};
      engine.n.kitLoadPlan = api;
    },
    metadata: { version: KIT_LOAD_PLAN_KIT_VERSION, purpose: "Deterministic kit/module load plan state and boot progress metrics for thin experiment hosts." }
  });
}

export default createKitLoadPlanKit;
