import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const ASYNC_DOMAIN_LOAD_KIT_VERSION = "0.1.0";

function time(world) { return number(world?.__nexusClock?.elapsed, 0); }
function clamp01(value) { return Math.max(0, Math.min(1, number(value, 0))); }
function idOf(value, fallback) { return String(value ?? fallback).trim() || fallback; }

export function normalizeAsyncLoadTask(task = {}, index = 0) {
  const id = idOf(task.id ?? task.key, `${task.domain ?? task.kind ?? "task"}-${index + 1}`);
  return {
    id,
    domain: idOf(task.domain ?? task.kind, "generic"),
    kind: idOf(task.kind ?? task.type, "task"),
    label: String(task.label ?? task.title ?? id),
    priority: number(task.priority, 0),
    weight: Math.max(0.0001, number(task.weight, 1)),
    status: task.status ?? "queued",
    progress: clamp01(task.progress),
    bytesLoaded: number(task.bytesLoaded, 0),
    bytesTotal: number(task.bytesTotal ?? task.sizeBytes, 0),
    attempts: number(task.attempts, 0),
    queuedAt: number(task.queuedAt, 0),
    startedAt: task.startedAt ?? null,
    endedAt: task.endedAt ?? null,
    error: task.error ?? null,
    result: clone(task.result ?? null),
    metadata: clone(task.metadata ?? {})
  };
}

export function createAsyncDomainLoadState(options = {}) {
  const tasks = asList(options.tasks).map(normalizeAsyncLoadTask);
  return {
    version: ASYNC_DOMAIN_LOAD_KIT_VERSION,
    namespace: options.namespace ?? "asyncDomainLoad",
    policy: { maxActive: Math.max(1, number(options.maxActive, 4)), retryLimit: Math.max(0, number(options.retryLimit, 1)) },
    tasks: Object.fromEntries(tasks.map((task) => [task.id, task])),
    history: []
  };
}

export function summarizeAsyncDomainLoadState(state = {}) {
  const tasks = Object.values(state.tasks ?? {});
  const totalWeight = tasks.reduce((sum, task) => sum + number(task.weight, 1), 0) || 1;
  const doneWeight = tasks.reduce((sum, task) => sum + number(task.weight, 1) * (task.status === "done" ? 1 : task.status === "failed" || task.status === "cancelled" ? 0 : clamp01(task.progress)), 0);
  return {
    total: tasks.length,
    queued: tasks.filter((task) => task.status === "queued").length,
    running: tasks.filter((task) => task.status === "running").length,
    done: tasks.filter((task) => task.status === "done").length,
    failed: tasks.filter((task) => task.status === "failed").length,
    cancelled: tasks.filter((task) => task.status === "cancelled").length,
    progress: tasks.length ? clamp01(doneWeight / totalWeight) : 1,
    bytesLoaded: tasks.reduce((sum, task) => sum + number(task.bytesLoaded, 0), 0),
    bytesTotal: tasks.reduce((sum, task) => sum + number(task.bytesTotal, 0), 0)
  };
}

function updateTask(state, task, event) {
  state.tasks[task.id] = task;
  state.history = [event, ...(state.history ?? [])].slice(0, 96);
  return state;
}

function sortedQueued(state, filter = {}) {
  return Object.values(state.tasks ?? {})
    .filter((task) => task.status === "queued")
    .filter((task) => !filter.domain || task.domain === filter.domain)
    .filter((task) => !filter.kind || task.kind === filter.kind)
    .sort((a, b) => number(b.priority, 0) - number(a.priority, 0));
}

export function createAsyncDomainLoadKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const State = resource(options.resourceName ?? "asyncDomainLoad.state");
  const Updated = event("asyncDomainLoad.updated");
  const TaskQueued = event("asyncDomainLoad.taskQueued");
  const TaskStarted = event("asyncDomainLoad.taskStarted");
  const TaskProgressed = event("asyncDomainLoad.taskProgressed");
  const TaskCompleted = event("asyncDomainLoad.taskCompleted");
  const TaskFailed = event("asyncDomainLoad.taskFailed");
  const TaskCancelled = event("asyncDomainLoad.taskCancelled");
  const initial = () => createAsyncDomainLoadState(options);

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "async-domain-load-kit",
    resources: { State },
    events: { Updated, TaskQueued, TaskStarted, TaskProgressed, TaskCompleted, TaskFailed, TaskCancelled },
    provides: ["async-domain-load", "load-queue-state", "load-metrics", "load-readiness"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const publish = (next, evt) => { world.setResource(State, next); world.emit?.(Updated, { event: clone(evt), summary: summarizeAsyncDomainLoadState(next), state: clone(next) }); return clone(next); };
      const api = {
        getState: state,
        snapshot: () => clone(state()),
        summarize: () => summarizeAsyncDomainLoadState(state()),
        queue(task = {}) {
          const next = state();
          const normalized = normalizeAsyncLoadTask({ ...task, status: "queued", queuedAt: time(world) }, Object.keys(next.tasks).length);
          const evt = { at: time(world), type: "queued", taskId: normalized.id };
          updateTask(next, normalized, evt);
          world.emit?.(TaskQueued, { task: clone(normalized) });
          return publish(next, evt);
        },
        queueMany(tasks = []) { return asList(tasks).map((task) => this.queue(task)); },
        claimNext(filter = {}) {
          const next = state();
          const running = Object.values(next.tasks).filter((task) => task.status === "running").length;
          if (running >= next.policy.maxActive) return null;
          const task = sortedQueued(next, filter)[0];
          return task ? this.start(task.id, { source: filter.source ?? "claimNext" }).tasks[task.id] : null;
        },
        start(id, payload = {}) {
          const next = state();
          const task = next.tasks[id];
          if (!task) throw new Error(`Unknown async load task: ${id}`);
          const started = { ...task, status: "running", attempts: number(task.attempts, 0) + 1, startedAt: time(world), error: null };
          const evt = { at: time(world), type: "started", taskId: id, payload: clone(payload) };
          updateTask(next, started, evt);
          world.emit?.(TaskStarted, { task: clone(started), payload: clone(payload) });
          return publish(next, evt);
        },
        progress(id, payload = {}) {
          const next = state();
          const task = next.tasks[id];
          if (!task) throw new Error(`Unknown async load task: ${id}`);
          const updated = { ...task, status: task.status === "queued" ? "running" : task.status, progress: clamp01(payload.progress ?? task.progress), bytesLoaded: number(payload.bytesLoaded, task.bytesLoaded), bytesTotal: number(payload.bytesTotal, task.bytesTotal), metadata: { ...task.metadata, ...(payload.metadata ?? {}) } };
          const evt = { at: time(world), type: "progress", taskId: id, progress: updated.progress };
          updateTask(next, updated, evt);
          world.emit?.(TaskProgressed, { task: clone(updated), payload: clone(payload) });
          return publish(next, evt);
        },
        complete(id, result = null, payload = {}) {
          const next = state();
          const task = next.tasks[id];
          if (!task) throw new Error(`Unknown async load task: ${id}`);
          const done = { ...task, status: "done", progress: 1, endedAt: time(world), result: clone(result), bytesLoaded: number(payload.bytesLoaded, task.bytesTotal || task.bytesLoaded) };
          const evt = { at: time(world), type: "done", taskId: id };
          updateTask(next, done, evt);
          world.emit?.(TaskCompleted, { task: clone(done), result: clone(result) });
          return publish(next, evt);
        },
        fail(id, error, payload = {}) {
          const next = state();
          const task = next.tasks[id];
          if (!task) throw new Error(`Unknown async load task: ${id}`);
          const failed = { ...task, status: "failed", endedAt: time(world), error: String(error?.message ?? error), metadata: { ...task.metadata, ...(payload.metadata ?? {}) } };
          const evt = { at: time(world), type: "failed", taskId: id, error: failed.error };
          updateTask(next, failed, evt);
          world.emit?.(TaskFailed, { task: clone(failed), error: failed.error });
          return publish(next, evt);
        },
        cancel(id, reason = "cancelled") {
          const next = state();
          const task = next.tasks[id];
          if (!task) return clone(next);
          const cancelled = { ...task, status: "cancelled", endedAt: time(world), error: reason };
          const evt = { at: time(world), type: "cancelled", taskId: id, reason };
          updateTask(next, cancelled, evt);
          world.emit?.(TaskCancelled, { task: clone(cancelled), reason });
          return publish(next, evt);
        },
        list(filter = {}) { return Object.values(state().tasks ?? {}).filter((task) => (!filter.status || task.status === filter.status) && (!filter.domain || task.domain === filter.domain) && (!filter.kind || task.kind === filter.kind)).map(clone); },
        getTask(id) { return clone(state().tasks?.[id] ?? null); },
        reset() { world.setResource(State, initial()); return this.snapshot(); }
      };
      engine.asyncDomainLoad = api;
      engine.n ??= {};
      engine.n.asyncDomainLoad = api;
    },
    metadata: { version: ASYNC_DOMAIN_LOAD_KIT_VERSION, purpose: "Bounded async loading domain state, queue metrics, and host-adapter handoff without owning browser IO." }
  });
}

export default createAsyncDomainLoadKit;
