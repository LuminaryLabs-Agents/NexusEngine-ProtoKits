export const HARNESS_SERVICE_FACTORY_VERSION = "0.1.0";

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

function fallbackRuntime() {
  return Object.freeze({
    defineResource(name) { return Object.freeze({ kind: "resource", name }); },
    defineEvent(name) { return Object.freeze({ kind: "event", name }); },
    defineRuntimeKit(config = {}) { return Object.freeze({ kind: "runtime-kit", ...config }); }
  });
}

function resourceKey(resource) { return resource?.name ?? String(resource); }

export function createMemoryWorld() {
  const resources = new Map();
  const events = new Map();
  return {
    __nexusClock: { delta: 1 / 60, elapsed: 0, frame: 0 },
    getResource(resource) { return resources.get(resourceKey(resource)); },
    setResource(resource, value) { resources.set(resourceKey(resource), value); },
    emit(event, payload = {}) {
      const key = resourceKey(event);
      events.set(key, [...(events.get(key) ?? []), payload]);
    },
    readEvents(event) { return events.get(resourceKey(event)) ?? []; },
    clearEvents() { events.clear(); },
    snapshot() { return Object.fromEntries(resources.entries()); }
  };
}

function getPath(source, path) {
  if (!path) return source;
  return String(path).split(".").reduce((value, part) => value?.[part], source);
}

function setPath(target, path, value) {
  const parts = String(path).split(".");
  let cursor = target;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== "object") cursor[part] = {};
    cursor = cursor[part];
  }
  cursor[parts.at(-1)] = value;
  return target;
}

function appendUnique(list, item, key = "id") {
  if (item === undefined || item === null) return list;
  const next = Array.isArray(list) ? [...list] : [];
  const itemKey = typeof item === "object" ? item?.[key] : item;
  const index = next.findIndex((entry) => (typeof entry === "object" ? entry?.[key] : entry) === itemKey);
  if (index >= 0) next[index] = { ...(typeof next[index] === "object" ? next[index] : {}), ...(typeof item === "object" ? item : { value: item }) };
  else next.push(item);
  return next;
}

function createGenerated(kind, descriptor, command) {
  const id = command.id ?? `${descriptor.id}:${kind}:${Math.abs(JSON.stringify(command).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0))}`;
  return { id, kind, serviceId: descriptor.id, createdAt: "1970-01-01T00:00:00.000Z", input: clone(command) };
}

function deriveCoverage(descriptor, command) {
  const candidates = command.candidates ?? [];
  const existingProvides = new Set(command.existingProvides ?? []);
  const missing = [];
  const duplicate = [];
  for (const candidate of candidates) {
    for (const token of candidate.requires ?? []) if (!existingProvides.has(token)) missing.push({ candidate: candidate.id, token });
    for (const token of candidate.provides ?? []) if (existingProvides.has(token)) duplicate.push({ candidate: candidate.id, token });
  }
  return { ...createGenerated("coverage-report", descriptor, command), missing, duplicate, recommendation: duplicate.length ? "compose-or-rename" : missing.length ? "create-supporting-provider" : "reuse-and-compose" };
}

function makeBrief(descriptor, command) {
  return { ...createGenerated("agent-brief", descriptor, command), sections: command.sections ?? [], graph: command.graph ?? null, rules: command.rules ?? [], buildPlan: command.buildPlan ?? null };
}

function makeBuildPlan(descriptor, command) {
  const nodes = command.nodes ?? [];
  const recipe = command.recipe ?? { files: [] };
  const files = nodes.flatMap((node) => (recipe.files ?? []).map((file) => ({ path: String(file.pathTemplate ?? "").replaceAll("{{kitId}}", node.id), templateRef: file.templateRef, nodeId: node.id })));
  return { ...createGenerated("build-plan", descriptor, command), nodes: clone(nodes), files };
}

function makePromotionReview(descriptor, command) {
  const findings = [];
  const kit = command.kit ?? {};
  if (!String(kit.id ?? "").endsWith("-kit")) findings.push({ gate: "must-end-kit", status: "fail" });
  if ((kit.imports ?? []).some((item) => ["three", "canvas"].includes(item))) findings.push({ gate: "renderer-independent", status: "fail" });
  return { ...createGenerated("promotion-review", descriptor, command), kitId: kit.id ?? null, status: findings.length ? "blocked" : "pass", findings };
}

function applyReducer(state, descriptor, reducer, command) {
  const next = clone(state);
  const current = getPath(next, reducer.path);
  const fromValue = reducer.value !== undefined ? reducer.value : getPath(command, reducer.from);
  switch (reducer.op) {
    case "set": return setPath(next, reducer.path, fromValue);
    case "mergeObject": return setPath(next, reducer.path, { ...(current ?? {}), ...(fromValue ?? {}) });
    case "appendUnique": return setPath(next, reducer.path, appendUnique(current, fromValue, reducer.key));
    case "appendManyUnique": {
      const items = Array.isArray(fromValue) ? fromValue : [];
      return setPath(next, reducer.path, items.reduce((list, item) => appendUnique(list, item, reducer.key), current ?? []));
    }
    case "mergeById": {
      const id = getPath(command, reducer.idFrom);
      const patch = fromValue ?? {};
      const list = Array.isArray(current) ? current : [];
      return setPath(next, reducer.path, list.map((item) => item?.id === id ? { ...item, ...patch } : item));
    }
    case "markStatus": {
      const id = getPath(command, reducer.idFrom);
      const list = Array.isArray(current) ? current : [];
      return setPath(next, reducer.path, list.map((item) => item?.id === id ? { ...item, status: reducer.status } : item));
    }
    case "snapshot": {
      const source = getPath(next, reducer.sourcePath);
      return setPath(next, reducer.path, [...(current ?? []), { id: `${descriptor.id}:snapshot:${(current ?? []).length + 1}`, value: clone(source) }]);
    }
    case "coverageReport": return setPath(next, reducer.path, deriveCoverage(descriptor, command));
    case "brief": return setPath(next, reducer.path, makeBrief(descriptor, command));
    case "buildPlan": return setPath(next, reducer.path, makeBuildPlan(descriptor, command));
    case "promotionReview": return setPath(next, reducer.path, makePromotionReview(descriptor, command));
    case "appendGenerated": return setPath(next, reducer.path, appendUnique(current, getPath(next, reducer.sourcePath), reducer.key));
    case "validateRefs": return setPath(next, reducer.path, []);
    default: return next;
  }
}

export function createInitialServiceState(descriptor, config = {}) {
  return { id: descriptor.id, version: descriptor.version ?? "0.1.0", domain: descriptor.domain, scope: descriptor.scope, kind: descriptor.kind, status: "ready", provides: [...(descriptor.provides ?? [])], requires: [...(descriptor.requires ?? [])], config: clone(config), ...clone(descriptor.state ?? {}), history: [] };
}

export function createHarnessServiceKit(NexusRealtime, descriptor, config = {}) {
  const runtime = NexusRealtime?.defineRuntimeKit ? NexusRealtime : fallbackRuntime();
  const State = runtime.defineResource?.(`${descriptor.id}.state`) ?? `${descriptor.id}.state`;
  const Command = runtime.defineEvent?.(`${descriptor.id}.command`) ?? `${descriptor.id}.command`;
  const Updated = runtime.defineEvent?.(`${descriptor.id}.updated`) ?? `${descriptor.id}.updated`;
  const Rejected = runtime.defineEvent?.(`${descriptor.id}.rejected`) ?? `${descriptor.id}.rejected`;
  const initial = () => createInitialServiceState(descriptor, config);
  return runtime.defineRuntimeKit({
    id: descriptor.id,
    requires: [...(descriptor.requires ?? [])],
    provides: [...(descriptor.provides ?? [])],
    resources: { State },
    events: { Command, Updated, Rejected },
    systems: [{ phase: descriptor.phase ?? "simulate", name: `${descriptor.id}:descriptor-system`, system(world) {
      let state = world.getResource?.(State) ?? initial();
      for (const command of world.readEvents?.(Command) ?? []) {
        try {
          let next = state;
          for (const reducer of descriptor.reducers ?? []) if (reducer.on === command.type) next = applyReducer(next, descriptor, reducer, command);
          next.history = [{ type: command.type, at: next.history.length }, ...(next.history ?? [])].slice(0, 64);
          state = next;
        } catch (error) {
          world.emit?.(Rejected, { serviceId: descriptor.id, reason: error?.message ?? String(error), command });
        }
      }
      world.setResource?.(State, state);
      world.emit?.(Updated, { serviceId: descriptor.id, state: clone(state) });
    } }],
    initWorld({ world }) { world.setResource?.(State, initial()); },
    install({ engine, world }) {
      const api = { id: descriptor.id, descriptor: clone(descriptor), command(payload = {}) { world.emit?.(Command, payload); return api.getState(); }, getState() { return world.getResource?.(State) ?? initial(); }, reset() { world.setResource?.(State, initial()); return api.getState(); }, snapshot() { return clone(api.getState()); } };
      for (const command of descriptor.commands ?? []) if (command.method && !api[command.method]) api[command.method] = (payload = {}) => api.command({ type: command.id, ...payload });
      engine[descriptor.engineKey ?? descriptor.id.replace(/-([a-z])/g, (_, char) => char.toUpperCase()).replace(/-kit$/, "")] = api;
      engine.domainHarnessServices ??= {};
      engine.domainHarnessServices[descriptor.id] = api;
    },
    metadata: { purpose: descriptor.purpose, domain: descriptor.domain, scope: descriptor.scope, kind: descriptor.kind }
  });
}

export function createServiceApis(descriptors, config = {}) {
  const world = createMemoryWorld();
  const engine = {};
  const runtime = fallbackRuntime();
  const kits = descriptors.map((descriptor) => createHarnessServiceKit(runtime, descriptor, config[descriptor.id] ?? {}));
  for (const kit of kits) { kit.initWorld?.({ world, engine }); kit.install?.({ world, engine }); }
  return { engine, world, kits };
}
