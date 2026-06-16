export const DOMAIN_SERVICE_KITS_VERSION = "0.1.0";
export const VIEW_RIG_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const SPATIAL_INTERACTION_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const COMPLETION_LEDGER_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const OBJECTIVE_BRIDGE_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const LOCK_GROUP_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const DAMAGE_HEALTH_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const ENCOUNTER_DIRECTOR_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const RESOURCE_NODE_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const BUILD_PLACEMENT_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const STRUCTURE_RUNTIME_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const DIEGETIC_FEEDBACK_SIGNAL_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const ASSET_DESCRIPTOR_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;

export { HAZARD_DIRECTOR_KIT_VERSION, createHazardDirectorKit } from "../domain-foundation/index.js";

const EMPTY = Object.freeze({});
const isObj = (value) => value && typeof value === "object" && !Array.isArray(value);
const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const idOf = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const sortedKeys = (obj) => Object.keys(obj ?? {}).sort();
const dtOf = (world, maxDelta = 1) => clamp(n(world?.__nexusClock?.delta, 1 / 60), 0, maxDelta);
const unique = (list) => Array.from(new Set(arr(list).filter((value) => value != null).map(String)));
const apiName = (config, fallback) => config.apiName ?? fallback;

function runtime(NexusRealtime, factoryName) {
  const missing = ["defineRuntimeKit", "defineResource", "defineEvent"].filter((name) => typeof NexusRealtime?.[name] !== "function");
  if (missing.length) throw new TypeError(`${factoryName} requires NexusRealtime helpers: ${missing.join(", ")}`);
  return NexusRealtime;
}

function serialSnapshot(world, resource) {
  return clone(world.getResource(resource));
}

function vec2(value = {}, fallback = {}) {
  return {
    x: n(value.x, n(fallback.x, 0)),
    y: n(value.y ?? value.z, n(fallback.y ?? fallback.z, 0))
  };
}

function dist2(a = {}, b = {}) {
  const av = vec2(a);
  const bv = vec2(b);
  return Math.hypot(av.x - bv.x, av.y - bv.y);
}

function norm2(value = {}, fallback = { x: 1, y: 0 }) {
  const v = vec2(value, fallback);
  const length = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / length, y: v.y / length };
}

function dot2(a = {}, b = {}) {
  const av = norm2(a);
  const bv = norm2(b);
  return av.x * bv.x + av.y * bv.y;
}

function mergeHistory(state, entry, max = 64) {
  return { ...state, history: [...(state.history ?? []), entry].slice(-max) };
}

function createDirectionFromYawPitch(yaw = 0, pitch = 0) {
  const cp = Math.cos(pitch);
  return {
    x: Math.sin(yaw) * cp,
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * cp
  };
}

function initialViewRig(config = {}) {
  const yaw = n(config.yaw, 0);
  const pitch = clamp(n(config.pitch, 0), n(config.minPitch, -Math.PI / 2), n(config.maxPitch, Math.PI / 2));
  const origin = { x: n(config.origin?.x, 0), y: n(config.origin?.y, n(config.height, 1.6)), z: n(config.origin?.z, 0) };
  const direction = createDirectionFromYawPitch(yaw, pitch);
  return {
    version: VIEW_RIG_KIT_VERSION,
    id: config.id ?? "view-rig",
    mode: config.mode ?? "free",
    yaw,
    pitch,
    origin,
    direction,
    viewRay: { origin, direction },
    focusTargetId: config.focusTargetId ?? null,
    shake: { amplitude: 0, remaining: 0, duration: 0 },
    bob: 0,
    sway: 0,
    sequence: 0,
    lastReason: "initialized",
    history: []
  };
}

export function createViewRigKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createViewRigKit");
  const ViewRigState = r.defineResource(config.resourceName ?? "viewRig.state");
  const SetPose = r.defineEvent("viewRig.setPose");
  const Look = r.defineEvent("viewRig.look");
  const Focus = r.defineEvent("viewRig.focus");
  const Shake = r.defineEvent("viewRig.shake");
  const Reset = r.defineEvent("viewRig.reset");
  const Changed = r.defineEvent("viewRig.changed");

  function finalize(world, state, reason) {
    const minPitch = n(config.minPitch, -Math.PI / 2);
    const maxPitch = n(config.maxPitch, Math.PI / 2);
    const pitch = clamp(n(state.pitch), minPitch, maxPitch);
    const yaw = n(state.yaw);
    const origin = { x: n(state.origin?.x), y: n(state.origin?.y), z: n(state.origin?.z) };
    const direction = createDirectionFromYawPitch(yaw, pitch);
    const next = mergeHistory({ ...state, yaw, pitch, origin, direction, viewRay: { origin, direction }, sequence: n(state.sequence) + 1, lastReason: reason }, { type: reason, yaw, pitch });
    world.emit(Changed, { id: next.id, reason, yaw, pitch, origin, direction, viewRay: next.viewRay, sequence: next.sequence });
    return next;
  }

  function system(world) {
    let state = clone(world.getResource(ViewRigState) ?? initialViewRig(config));
    let changed = false;
    let reason = "tick";
    const dt = dtOf(world, n(config.maxDelta, 1));
    if (state.shake?.remaining > 0) {
      const remaining = Math.max(0, n(state.shake.remaining) - dt);
      const amplitude = remaining <= 0 ? 0 : n(state.shake.amplitude) * (remaining / Math.max(0.0001, n(state.shake.duration, remaining)));
      state = { ...state, shake: { ...state.shake, remaining, amplitude } };
      changed = true;
      reason = "shake-decay";
    }
    for (const event of world.readEvents(Reset)) { state = initialViewRig({ ...config, ...event }); changed = true; reason = event.reason ?? "reset"; }
    for (const event of world.readEvents(SetPose)) {
      state = { ...state, mode: event.mode ?? state.mode, yaw: n(event.yaw, state.yaw), pitch: n(event.pitch, state.pitch), origin: { ...state.origin, ...(event.origin ?? {}), x: n(event.x, n(event.origin?.x, state.origin?.x)), y: n(event.y, n(event.origin?.y, state.origin?.y)), z: n(event.z, n(event.origin?.z, state.origin?.z)) } };
      changed = true;
      reason = event.reason ?? "pose-set";
    }
    for (const event of world.readEvents(Look)) {
      state = { ...state, yaw: n(state.yaw) + n(event.yawDelta ?? event.dx) * n(event.sensitivity, n(config.yawSensitivity, 1)), pitch: n(state.pitch) + n(event.pitchDelta ?? event.dy) * n(event.sensitivity, n(config.pitchSensitivity, 1)) };
      changed = true;
      reason = event.reason ?? "look";
    }
    for (const event of world.readEvents(Focus)) { state = { ...state, focusTargetId: event.targetId ?? event.id ?? null }; changed = true; reason = event.reason ?? "focus"; }
    for (const event of world.readEvents(Shake)) { const duration = Math.max(0, n(event.duration, n(config.defaultShakeDuration, 0.25))); state = { ...state, shake: { amplitude: Math.max(0, n(event.amplitude, 1)), remaining: duration, duration } }; changed = true; reason = event.reason ?? "shake"; }
    if (changed) state = finalize(world, state, reason);
    world.setResource(ViewRigState, state);
  }

  return r.defineRuntimeKit({
    id: config.kitId ?? "view-rig-kit",
    provides: ["view:rig", "view:ray", "camera:descriptor"],
    resources: { ViewRigState },
    events: { SetPose, Look, Focus, Shake, Reset, Changed },
    systems: [{ phase: config.phase ?? "simulate", name: "viewRigSystem", system }],
    initWorld({ world }) { world.setResource(ViewRigState, initialViewRig(config)); },
    install({ engine, world }) {
      engine[apiName(config, "viewRig")] = {
        resources: { ViewRigState }, events: { SetPose, Look, Focus, Shake, Reset, Changed },
        setPose(payload = {}) { world.emit(SetPose, payload); return world.getResource(ViewRigState); },
        look(payload = {}) { world.emit(Look, payload); return world.getResource(ViewRigState); },
        focus(targetId, payload = {}) { world.emit(Focus, { targetId, ...payload }); return world.getResource(ViewRigState); },
        shake(payload = {}) { world.emit(Shake, payload); return world.getResource(ViewRigState); },
        reset(payload = {}) { world.emit(Reset, payload); return world.getResource(ViewRigState); },
        getState() { return world.getResource(ViewRigState); },
        getSnapshot() { return serialSnapshot(world, ViewRigState); }
      };
    },
    bindings: { viewRigState: ViewRigState },
    metadata: { version: VIEW_RIG_KIT_VERSION, purpose: "Renderer-agnostic view rig, yaw/pitch, view-ray, focus, and shake state." }
  });
}

function initialCompletionLedger(config = {}) {
  return { version: COMPLETION_LEDGER_KIT_VERSION, id: config.id ?? "completion-ledger", completedIds: [], groups: {}, entries: {}, repeatedIds: [], lastCompletion: null, history: [] };
}

export function createCompletionLedgerKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createCompletionLedgerKit");
  const CompletionLedgerState = r.defineResource(config.resourceName ?? "completionLedger.state");
  const Complete = r.defineEvent("completionLedger.complete");
  const Reset = r.defineEvent("completionLedger.reset");
  const FirstCompleted = r.defineEvent("completionLedger.firstCompleted");
  const Repeated = r.defineEvent("completionLedger.repeated");

  function system(world) {
    let state = clone(world.getResource(CompletionLedgerState) ?? initialCompletionLedger(config));
    for (const event of world.readEvents(Reset)) state = { ...initialCompletionLedger(config), lastCompletion: null, history: [{ type: "reset", reason: event.reason ?? "reset" }] };
    for (const event of world.readEvents(Complete)) {
      const id = idOf(event.id ?? event.targetId, "completion");
      const groups = unique([event.group, ...(event.groups ?? []), ...(config.defaultGroups ?? [])]);
      const already = state.completedIds.includes(id);
      const entry = { id, groups, payload: clone(event.payload ?? {}), at: n(world.__nexusClock?.elapsed), reason: event.reason ?? "completed" };
      if (already) {
        state = mergeHistory({ ...state, repeatedIds: unique([...state.repeatedIds, id]), lastCompletion: entry }, { type: "repeated", id, groups });
        world.emit(Repeated, entry);
        continue;
      }
      const groupState = { ...state.groups };
      for (const group of groups) groupState[group] = unique([...(groupState[group] ?? []), id]);
      state = mergeHistory({ ...state, completedIds: unique([...state.completedIds, id]), groups: groupState, entries: { ...state.entries, [id]: entry }, lastCompletion: entry }, { type: "firstCompleted", id, groups });
      world.emit(FirstCompleted, entry);
    }
    world.setResource(CompletionLedgerState, state);
  }

  return r.defineRuntimeKit({
    id: config.kitId ?? "completion-ledger-kit",
    provides: ["completion:ledger", "completion:unique"],
    resources: { CompletionLedgerState }, events: { Complete, Reset, FirstCompleted, Repeated },
    systems: [{ phase: config.phase ?? "simulate", name: "completionLedgerSystem", system }],
    initWorld({ world }) { world.setResource(CompletionLedgerState, initialCompletionLedger(config)); },
    install({ engine, world }) { engine[apiName(config, "completionLedger")] = { resources: { CompletionLedgerState }, events: { Complete, Reset, FirstCompleted, Repeated }, complete(id, payload = {}) { world.emit(Complete, { id, ...payload }); return world.getResource(CompletionLedgerState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(CompletionLedgerState); }, has(id) { return Boolean(world.getResource(CompletionLedgerState)?.completedIds?.includes(String(id))); }, getState() { return world.getResource(CompletionLedgerState); }, getSnapshot() { return serialSnapshot(world, CompletionLedgerState); } }; },
    bindings: { completionLedgerState: CompletionLedgerState },
    metadata: { version: COMPLETION_LEDGER_KIT_VERSION, purpose: "Unique completion ledger with first-completion and repeat suppression events." }
  });
}

function initialObjectiveBridge(config = {}) {
  return { version: OBJECTIVE_BRIDGE_KIT_VERSION, id: config.id ?? "objective-bridge", mappings: clone(config.mappings ?? []), emittedActions: [], countsByAction: {}, seenKeys: [], lastAction: null, history: [] };
}

export function createObjectiveBridgeKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createObjectiveBridgeKit");
  const ObjectiveBridgeState = r.defineResource(config.resourceName ?? "objectiveBridge.state");
  const Input = r.defineEvent("objectiveBridge.input");
  const Reset = r.defineEvent("objectiveBridge.reset");
  const ObjectiveAction = r.defineEvent("objectiveBridge.objectiveAction");

  function chooseAction(input = {}, mappings = []) {
    for (const mapping of mappings) {
      if (mapping.from && mapping.from !== input.from && mapping.from !== input.type) continue;
      if (mapping.group && mapping.group !== input.group) continue;
      return { action: mapping.toAction ?? mapping.action ?? input.action ?? input.type, amount: n(mapping.amount, n(input.amount, 1)), mappingId: mapping.id ?? null };
    }
    return { action: input.action ?? input.type ?? input.from ?? "progress", amount: n(input.amount, 1), mappingId: null };
  }

  function system(world) {
    let state = clone(world.getResource(ObjectiveBridgeState) ?? initialObjectiveBridge(config));
    for (const event of world.readEvents(Reset)) state = { ...initialObjectiveBridge(config), history: [{ type: "reset", reason: event.reason ?? "reset" }] };
    const inputs = [...world.readEvents(Input)];
    for (const source of arr(config.sources)) {
      if (!source?.event) continue;
      for (const event of world.readEvents(source.event)) inputs.push({ ...event, from: source.from ?? source.type ?? source.event.name, group: source.group ?? event.group });
    }
    for (const input of inputs) {
      const key = input.onceKey ?? input.targetId ?? input.id ?? null;
      const once = input.once === true || input.oncePerId === true;
      if (once && key && state.seenKeys.includes(String(key))) continue;
      const chosen = chooseAction(input, state.mappings);
      if (!chosen.action) continue;
      const actionEvent = { action: chosen.action, amount: chosen.amount, id: input.id ?? input.targetId ?? null, group: input.group ?? null, mappingId: chosen.mappingId, payload: clone(input), at: n(world.__nexusClock?.elapsed) };
      state = mergeHistory({ ...state, emittedActions: [...state.emittedActions, actionEvent].slice(-128), countsByAction: { ...state.countsByAction, [chosen.action]: n(state.countsByAction[chosen.action]) + chosen.amount }, seenKeys: once && key ? unique([...state.seenKeys, String(key)]) : state.seenKeys, lastAction: actionEvent }, { type: "objectiveAction", action: chosen.action, id: actionEvent.id });
      world.emit(ObjectiveAction, actionEvent);
      if (config.objectiveActionEvent) world.emit(config.objectiveActionEvent, actionEvent);
    }
    world.setResource(ObjectiveBridgeState, state);
  }

  return r.defineRuntimeKit({
    id: config.kitId ?? "objective-bridge-kit",
    provides: ["objective:bridge", "objective:action-events"],
    resources: { ObjectiveBridgeState }, events: { Input, Reset, ObjectiveAction },
    systems: [{ phase: config.phase ?? "simulate", name: "objectiveBridgeSystem", system }],
    initWorld({ world }) { world.setResource(ObjectiveBridgeState, initialObjectiveBridge(config)); },
    install({ engine, world }) { engine[apiName(config, "objectiveBridge")] = { resources: { ObjectiveBridgeState }, events: { Input, Reset, ObjectiveAction }, input(payload = {}) { world.emit(Input, payload); return world.getResource(ObjectiveBridgeState); }, action(action, payload = {}) { world.emit(Input, { action, ...payload }); return world.getResource(ObjectiveBridgeState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(ObjectiveBridgeState); }, getState() { return world.getResource(ObjectiveBridgeState); }, getSnapshot() { return serialSnapshot(world, ObjectiveBridgeState); } }; },
    bindings: { objectiveBridgeState: ObjectiveBridgeState },
    metadata: { version: OBJECTIVE_BRIDGE_KIT_VERSION, purpose: "Maps domain events into renderer-independent objective action events." }
  });
}

function initialSpatialInteraction(config = {}) {
  return { version: SPATIAL_INTERACTION_KIT_VERSION, id: config.id ?? "spatial-interaction", subjects: {}, targets: {}, holds: {}, cooldowns: {}, completedIds: [], lastRejection: null, lastCompleted: null, history: [] };
}

export function createSpatialInteractionKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createSpatialInteractionKit");
  const SpatialInteractionState = r.defineResource(config.resourceName ?? "spatialInteraction.state");
  const RegisterTarget = r.defineEvent("spatialInteraction.registerTarget");
  const SetSubject = r.defineEvent("spatialInteraction.setSubject");
  const Request = r.defineEvent("spatialInteraction.request");
  const Reset = r.defineEvent("spatialInteraction.reset");
  const Started = r.defineEvent("spatialInteraction.started");
  const Progressed = r.defineEvent("spatialInteraction.progressed");
  const Completed = r.defineEvent("spatialInteraction.completed");
  const Rejected = r.defineEvent("spatialInteraction.rejected");

  function reject(world, state, reason, payload) {
    const rejection = { reason, ...payload, at: n(world.__nexusClock?.elapsed) };
    world.emit(Rejected, rejection);
    return mergeHistory({ ...state, lastRejection: rejection }, { type: "rejected", reason, targetId: payload.targetId });
  }

  function system(world) {
    let state = clone(world.getResource(SpatialInteractionState) ?? initialSpatialInteraction(config));
    const dt = dtOf(world, n(config.maxDelta, 1));
    const cooldowns = { ...state.cooldowns };
    for (const key of sortedKeys(cooldowns)) cooldowns[key] = Math.max(0, n(cooldowns[key]) - dt);
    state = { ...state, cooldowns };
    for (const event of world.readEvents(Reset)) state = { ...initialSpatialInteraction(config), targets: event.keepTargets ? state.targets : {}, subjects: event.keepSubjects ? state.subjects : {}, history: [{ type: "reset", reason: event.reason ?? "reset" }] };
    for (const event of world.readEvents(RegisterTarget)) { const id = idOf(event.id ?? event.targetId, `target-${sortedKeys(state.targets).length + 1}`); state.targets[id] = { id, enabled: true, action: event.action ?? config.defaultAction ?? "interact", maxDistance: n(event.maxDistance, n(config.maxDistance, 2)), maxAngleDegrees: n(event.maxAngleDegrees, n(config.maxAngleDegrees, 75)), holdSeconds: n(event.holdSeconds, n(config.holdSeconds, 0)), cooldownSeconds: n(event.cooldownSeconds, n(config.cooldownSeconds, 0)), requireFacing: event.requireFacing ?? config.requireFacing ?? false, requireLineOfSight: event.requireLineOfSight ?? config.requireLineOfSight ?? false, completeOnce: event.completeOnce ?? config.completeOnce ?? false, ...event, x: n(event.x ?? event.position?.x), y: n(event.y ?? event.z ?? event.position?.y ?? event.position?.z) }; }
    for (const event of world.readEvents(SetSubject)) { const id = idOf(event.id ?? event.subjectId, "player"); state.subjects[id] = { id, ...state.subjects[id], ...event, x: n(event.x ?? event.position?.x, state.subjects[id]?.x), y: n(event.y ?? event.z ?? event.position?.y ?? event.position?.z, state.subjects[id]?.y), facing: norm2(event.facing ?? state.subjects[id]?.facing ?? { x: 1, y: 0 }) }; }
    for (const event of world.readEvents(Request)) {
      const targetId = idOf(event.targetId ?? event.id, "target");
      const subjectId = idOf(event.subjectId, config.defaultSubjectId ?? "player");
      const target = state.targets[targetId];
      const subject = state.subjects[subjectId] ?? { id: subjectId, x: n(event.subject?.x), y: n(event.subject?.y ?? event.subject?.z), facing: norm2(event.facing ?? { x: 1, y: 0 }) };
      if (!target || target.enabled === false) { state = reject(world, state, "target-unavailable", { targetId, subjectId }); continue; }
      if (target.completeOnce && state.completedIds.includes(targetId)) { state = reject(world, state, "already-completed", { targetId, subjectId }); continue; }
      const action = event.action ?? target.action ?? "interact";
      if (target.action && action !== target.action) { state = reject(world, state, "action-mismatch", { targetId, subjectId, action, expectedAction: target.action }); continue; }
      const distance = dist2(subject, target);
      if (distance > n(target.maxDistance, 2)) { state = reject(world, state, "too-far", { targetId, subjectId, distance, maxDistance: target.maxDistance }); continue; }
      if (target.requireFacing) {
        const toTarget = norm2({ x: n(target.x) - n(subject.x), y: n(target.y) - n(subject.y) });
        const dot = dot2(subject.facing, toTarget);
        const minDot = Math.cos((n(target.maxAngleDegrees, 75) * Math.PI) / 180);
        if (dot < minDot) { state = reject(world, state, "not-facing", { targetId, subjectId, dot, minDot }); continue; }
      }
      if (target.requireLineOfSight && event.lineOfSight === false) { state = reject(world, state, "blocked-line-of-sight", { targetId, subjectId }); continue; }
      const cooldownKey = `${subjectId}:${targetId}:${action}`;
      if (n(state.cooldowns[cooldownKey]) > 0) { state = reject(world, state, "cooldown", { targetId, subjectId, remaining: state.cooldowns[cooldownKey] }); continue; }
      const holdKey = cooldownKey;
      const required = Math.max(0, n(target.holdSeconds, 0));
      const previous = state.holds[holdKey] ?? { progress: 0, started: false };
      if (!previous.started) world.emit(Started, { targetId, subjectId, action, required });
      const progress = required <= 0 ? required : Math.min(required, n(previous.progress) + n(event.delta, dt));
      state.holds[holdKey] = { progress, required, started: true };
      world.emit(Progressed, { targetId, subjectId, action, progress, required, ratio: required <= 0 ? 1 : progress / required });
      if (progress >= required) {
        const completed = { targetId, subjectId, action, progress, required, group: target.group ?? event.group ?? null, payload: clone(event.payload ?? {}), at: n(world.__nexusClock?.elapsed) };
        delete state.holds[holdKey];
        state.cooldowns[holdKey] = n(target.cooldownSeconds, 0);
        state = mergeHistory({ ...state, completedIds: unique([...state.completedIds, targetId]), lastCompleted: completed }, { type: "completed", targetId, subjectId, action });
        world.emit(Completed, completed);
        if (config.completionEvent) world.emit(config.completionEvent, completed);
      }
    }
    world.setResource(SpatialInteractionState, state);
  }

  return r.defineRuntimeKit({
    id: config.kitId ?? "spatial-interaction-kit",
    requires: config.requires ?? [],
    provides: ["interaction:spatial", "interaction:validation", "interaction:hold"],
    resources: { SpatialInteractionState }, events: { RegisterTarget, SetSubject, Request, Reset, Started, Progressed, Completed, Rejected },
    systems: [{ phase: config.phase ?? "simulate", name: "spatialInteractionSystem", system }],
    initWorld({ world }) { world.setResource(SpatialInteractionState, initialSpatialInteraction(config)); },
    install({ engine, world }) { engine[apiName(config, "spatialInteraction")] = { resources: { SpatialInteractionState }, events: { RegisterTarget, SetSubject, Request, Reset, Started, Progressed, Completed, Rejected }, registerTarget(target = {}) { world.emit(RegisterTarget, target); return world.getResource(SpatialInteractionState); }, setSubject(subject = {}) { world.emit(SetSubject, subject); return world.getResource(SpatialInteractionState); }, request(targetId, payload = {}) { world.emit(Request, { targetId, ...payload }); return world.getResource(SpatialInteractionState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(SpatialInteractionState); }, getState() { return world.getResource(SpatialInteractionState); }, getSnapshot() { return serialSnapshot(world, SpatialInteractionState); } }; },
    bindings: { spatialInteractionState: SpatialInteractionState },
    metadata: { version: SPATIAL_INTERACTION_KIT_VERSION, purpose: "Distance, facing, LOS, cooldown, and hold-to-complete interaction validation." }
  });
}

function initialLockGroup(config = {}) { return { version: LOCK_GROUP_KIT_VERSION, id: config.id ?? "lock-group", groups: {}, openedGroupIds: [], enteredGroupIds: [], lastEvent: null, history: [] }; }
export function createLockGroupKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createLockGroupKit");
  const LockGroupState = r.defineResource(config.resourceName ?? "lockGroup.state");
  const Register = r.defineEvent("lockGroup.register");
  const Fill = r.defineEvent("lockGroup.fill");
  const Enter = r.defineEvent("lockGroup.enter");
  const Reset = r.defineEvent("lockGroup.reset");
  const Opened = r.defineEvent("lockGroup.opened");
  const Entered = r.defineEvent("lockGroup.entered");
  function system(world) { let state = clone(world.getResource(LockGroupState) ?? initialLockGroup(config)); for (const event of world.readEvents(Reset)) state = { ...initialLockGroup(config), history: [{ type: "reset", reason: event.reason ?? "reset" }] }; for (const event of world.readEvents(Register)) { const id = idOf(event.id ?? event.groupId, `lock-${sortedKeys(state.groups).length + 1}`); state.groups[id] = { id, requiredIds: unique(event.requiredIds ?? []), requiredCount: Math.max(0, n(event.requiredCount, arr(event.requiredIds).length || n(config.requiredCount, 1))), filledIds: unique(event.filledIds ?? []), mode: event.mode ?? "locked", metadata: clone(event.metadata ?? {}) }; } for (const event of world.readEvents(Fill)) { const groupId = idOf(event.groupId ?? event.id, "lock"); const group = state.groups[groupId]; if (!group) continue; const fillId = idOf(event.fillId ?? event.targetId ?? event.socketId, `fill-${group.filledIds.length + 1}`); const allowed = !group.requiredIds.length || group.requiredIds.includes(fillId); if (!allowed) continue; const filledIds = unique([...group.filledIds, fillId]); const requiredCount = Math.max(0, n(group.requiredCount)); let mode = group.mode; if (filledIds.length >= requiredCount && mode !== "open" && mode !== "entered") { mode = "open"; const opened = { groupId, filledIds, requiredCount, reason: event.reason ?? "requirements-met" }; state.openedGroupIds = unique([...state.openedGroupIds, groupId]); state.lastEvent = opened; world.emit(Opened, opened); } state.groups[groupId] = { ...group, filledIds, mode }; state = mergeHistory(state, { type: "fill", groupId, fillId, mode }); } for (const event of world.readEvents(Enter)) { const groupId = idOf(event.groupId ?? event.id, "lock"); const group = state.groups[groupId]; if (!group || group.mode !== "open") continue; state.groups[groupId] = { ...group, mode: "entered" }; state.enteredGroupIds = unique([...state.enteredGroupIds, groupId]); const entered = { groupId, reason: event.reason ?? "entered" }; state.lastEvent = entered; state = mergeHistory(state, { type: "entered", groupId }); world.emit(Entered, entered); } world.setResource(LockGroupState, state); }
  return r.defineRuntimeKit({ id: config.kitId ?? "lock-group-kit", provides: ["lock:group", "gate:unlock", "portal:unlock"], resources: { LockGroupState }, events: { Register, Fill, Enter, Reset, Opened, Entered }, systems: [{ phase: config.phase ?? "simulate", name: "lockGroupSystem", system }], initWorld({ world }) { world.setResource(LockGroupState, initialLockGroup(config)); }, install({ engine, world }) { engine[apiName(config, "lockGroup")] = { resources: { LockGroupState }, events: { Register, Fill, Enter, Reset, Opened, Entered }, register(group = {}) { world.emit(Register, group); return world.getResource(LockGroupState); }, fill(groupId, fillId, payload = {}) { world.emit(Fill, { groupId, fillId, ...payload }); return world.getResource(LockGroupState); }, enter(groupId, payload = {}) { world.emit(Enter, { groupId, ...payload }); return world.getResource(LockGroupState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(LockGroupState); }, getState() { return world.getResource(LockGroupState); }, getSnapshot() { return serialSnapshot(world, LockGroupState); } }; }, bindings: { lockGroupState: LockGroupState }, metadata: { version: LOCK_GROUP_KIT_VERSION, purpose: "Generic locks, gates, sockets, doors, and portal unlock groups." } });
}

function initialDamageHealth(config = {}) { return { version: DAMAGE_HEALTH_KIT_VERSION, id: config.id ?? "damage-health", entities: {}, deadIds: [], lastDamage: null, history: [] }; }
export function createDamageHealthKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createDamageHealthKit"); const DamageHealthState = r.defineResource(config.resourceName ?? "damageHealth.state"); const Register = r.defineEvent("damageHealth.register"); const Damage = r.defineEvent("damageHealth.damage"); const Heal = r.defineEvent("damageHealth.heal"); const SetInvulnerable = r.defineEvent("damageHealth.setInvulnerable"); const Reset = r.defineEvent("damageHealth.reset"); const Damaged = r.defineEvent("damageHealth.damaged"); const Healed = r.defineEvent("damageHealth.healed"); const Died = r.defineEvent("damageHealth.died");
  function system(world) { let state = clone(world.getResource(DamageHealthState) ?? initialDamageHealth(config)); const dt = dtOf(world, n(config.maxDelta, 1)); for (const id of sortedKeys(state.entities)) { const entity = state.entities[id]; if (n(entity.invulnerableRemaining) > 0) state.entities[id] = { ...entity, invulnerableRemaining: Math.max(0, n(entity.invulnerableRemaining) - dt) }; } for (const event of world.readEvents(Reset)) state = { ...initialDamageHealth(config), history: [{ type: "reset", reason: event.reason ?? "reset" }] }; for (const event of world.readEvents(Register)) { const id = idOf(event.id ?? event.entityId, `entity-${sortedKeys(state.entities).length + 1}`); const max = Math.max(1, n(event.maxHealth, n(event.health, n(config.defaultHealth, 100)))); const health = clamp(n(event.health, max), 0, max); state.entities[id] = { id, maxHealth: max, health, alive: event.alive ?? health > 0, faction: event.faction ?? null, invulnerableRemaining: n(event.invulnerableSeconds, 0), metadata: clone(event.metadata ?? {}) }; } for (const event of world.readEvents(SetInvulnerable)) { const id = idOf(event.id ?? event.entityId, "entity"); if (state.entities[id]) state.entities[id] = { ...state.entities[id], invulnerableRemaining: Math.max(0, n(event.seconds, event.duration ?? 0)) }; } for (const event of world.readEvents(Damage)) { const id = idOf(event.id ?? event.entityId, "entity"); const entity = state.entities[id]; if (!entity || entity.alive === false) continue; if (n(entity.invulnerableRemaining) > 0 && !event.ignoreInvulnerable) continue; const amount = Math.max(0, n(event.amount, 0)); const health = clamp(n(entity.health) - amount, 0, n(entity.maxHealth, 1)); const alive = health > 0; const next = { ...entity, health, alive, invulnerableRemaining: alive ? Math.max(n(entity.invulnerableRemaining), n(event.invulnerableSeconds, n(config.damageInvulnerabilitySeconds, 0))) : 0 }; state.entities[id] = next; const damaged = { entityId: id, amount, health, maxHealth: next.maxHealth, alive, sourceId: event.sourceId ?? null, reason: event.reason ?? "damage" }; state.lastDamage = damaged; state = mergeHistory(state, { type: "damaged", entityId: id, amount, health }); world.emit(Damaged, damaged); if (!alive && !state.deadIds.includes(id)) { state.deadIds = unique([...state.deadIds, id]); world.emit(Died, { entityId: id, sourceId: event.sourceId ?? null, reason: event.reason ?? "health-zero" }); } } for (const event of world.readEvents(Heal)) { const id = idOf(event.id ?? event.entityId, "entity"); const entity = state.entities[id]; if (!entity) continue; const amount = Math.max(0, n(event.amount, 0)); const health = clamp(n(entity.health) + amount, 0, n(entity.maxHealth, 1)); state.entities[id] = { ...entity, health, alive: health > 0 }; state = mergeHistory(state, { type: "healed", entityId: id, amount, health }); world.emit(Healed, { entityId: id, amount, health, maxHealth: entity.maxHealth }); } world.setResource(DamageHealthState, state); }
  return r.defineRuntimeKit({ id: config.kitId ?? "damage-health-kit", provides: ["damage:health", "health:pools", "failure:death-events"], resources: { DamageHealthState }, events: { Register, Damage, Heal, SetInvulnerable, Reset, Damaged, Healed, Died }, systems: [{ phase: config.phase ?? "simulate", name: "damageHealthSystem", system }], initWorld({ world }) { world.setResource(DamageHealthState, initialDamageHealth(config)); }, install({ engine, world }) { engine[apiName(config, "damageHealth")] = { resources: { DamageHealthState }, events: { Register, Damage, Heal, SetInvulnerable, Reset, Damaged, Healed, Died }, register(entity = {}) { world.emit(Register, entity); return world.getResource(DamageHealthState); }, damage(entityId, amount, payload = {}) { world.emit(Damage, { entityId, amount, ...payload }); return world.getResource(DamageHealthState); }, heal(entityId, amount, payload = {}) { world.emit(Heal, { entityId, amount, ...payload }); return world.getResource(DamageHealthState); }, setInvulnerable(entityId, seconds, payload = {}) { world.emit(SetInvulnerable, { entityId, seconds, ...payload }); return world.getResource(DamageHealthState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(DamageHealthState); }, getState() { return world.getResource(DamageHealthState); }, getSnapshot() { return serialSnapshot(world, DamageHealthState); } }; }, bindings: { damageHealthState: DamageHealthState }, metadata: { version: DAMAGE_HEALTH_KIT_VERSION, purpose: "Health pools, damage, healing, invulnerability windows, and death events." } });
}

function initialEncounterDirector(config = {}) { return { version: ENCOUNTER_DIRECTOR_KIT_VERSION, id: config.id ?? "encounter-director", encounters: {}, activeId: null, pendingSpawnRequests: [], defeatedActorIds: [], completedEncounterIds: [], history: [] }; }
export function createEncounterDirectorKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createEncounterDirectorKit"); const EncounterDirectorState = r.defineResource(config.resourceName ?? "encounterDirector.state"); const Register = r.defineEvent("encounterDirector.register"); const Start = r.defineEvent("encounterDirector.start"); const ActorSpawned = r.defineEvent("encounterDirector.actorSpawned"); const ActorDefeated = r.defineEvent("encounterDirector.actorDefeated"); const Complete = r.defineEvent("encounterDirector.complete"); const Reset = r.defineEvent("encounterDirector.reset"); const SpawnRequested = r.defineEvent("encounterDirector.spawnRequested"); const Completed = r.defineEvent("encounterDirector.completed");
  function system(world) { let state = clone(world.getResource(EncounterDirectorState) ?? initialEncounterDirector(config)); const dt = dtOf(world, n(config.maxDelta, 1)); for (const event of world.readEvents(Reset)) state = { ...initialEncounterDirector(config), history: [{ type: "reset", reason: event.reason ?? "reset" }] }; for (const event of world.readEvents(Register)) { const id = idOf(event.id ?? event.encounterId, `encounter-${sortedKeys(state.encounters).length + 1}`); state.encounters[id] = { id, mode: "ready", spawnBudget: Math.max(0, n(event.spawnBudget, n(config.spawnBudget, 1))), spawnedCount: 0, defeatedCount: 0, activeActorIds: [], spawnCooldown: n(event.spawnCooldown, n(config.spawnCooldown, 1)), cooldownRemaining: 0, maxActive: Math.max(1, n(event.maxActive, n(config.maxActive, 4))), archetypes: clone(event.archetypes ?? config.archetypes ?? ["enemy"]), metadata: clone(event.metadata ?? {}) }; } for (const event of world.readEvents(Start)) { const id = idOf(event.id ?? event.encounterId, "encounter"); if (state.encounters[id]) { state.encounters[id] = { ...state.encounters[id], mode: "active", cooldownRemaining: 0 }; state.activeId = id; state = mergeHistory(state, { type: "started", encounterId: id }); } } for (const event of world.readEvents(ActorSpawned)) { const encounterId = idOf(event.encounterId ?? state.activeId, "encounter"); const enc = state.encounters[encounterId]; if (!enc) continue; const actorId = idOf(event.actorId ?? event.id, `actor-${enc.spawnedCount}`); state.encounters[encounterId] = { ...enc, activeActorIds: unique([...enc.activeActorIds, actorId]) }; } for (const event of world.readEvents(ActorDefeated)) { const encounterId = idOf(event.encounterId ?? state.activeId, "encounter"); const enc = state.encounters[encounterId]; if (!enc) continue; const actorId = idOf(event.actorId ?? event.id, "actor"); const activeActorIds = enc.activeActorIds.filter((id) => id !== actorId); state.defeatedActorIds = unique([...state.defeatedActorIds, actorId]); state.encounters[encounterId] = { ...enc, activeActorIds, defeatedCount: n(enc.defeatedCount) + 1 }; } for (const id of sortedKeys(state.encounters)) { const enc = state.encounters[id]; if (enc.mode !== "active") continue; let next = { ...enc, cooldownRemaining: Math.max(0, n(enc.cooldownRemaining) - dt) }; if (next.cooldownRemaining <= 0 && n(next.spawnedCount) < n(next.spawnBudget) && next.activeActorIds.length < n(next.maxActive, 1)) { const archetypes = arr(next.archetypes).length ? arr(next.archetypes) : ["enemy"]; const archetype = archetypes[n(next.spawnedCount) % archetypes.length]; const request = { encounterId: id, requestId: `${id}:spawn-${next.spawnedCount + 1}`, archetype, index: next.spawnedCount, at: n(world.__nexusClock?.elapsed) }; next = { ...next, spawnedCount: n(next.spawnedCount) + 1, cooldownRemaining: n(next.spawnCooldown) }; state.pendingSpawnRequests = [...state.pendingSpawnRequests, request].slice(-64); state = mergeHistory(state, { type: "spawnRequested", encounterId: id, archetype }); world.emit(SpawnRequested, request); } if (n(next.spawnedCount) >= n(next.spawnBudget) && next.activeActorIds.length === 0 && n(next.defeatedCount) >= n(next.spawnBudget)) { next = { ...next, mode: "completed" }; state.completedEncounterIds = unique([...state.completedEncounterIds, id]); world.emit(Completed, { encounterId: id, reason: "all-actors-defeated" }); } state.encounters[id] = next; } for (const event of world.readEvents(Complete)) { const id = idOf(event.id ?? event.encounterId, state.activeId ?? "encounter"); if (state.encounters[id]) { state.encounters[id] = { ...state.encounters[id], mode: "completed" }; state.completedEncounterIds = unique([...state.completedEncounterIds, id]); world.emit(Completed, { encounterId: id, reason: event.reason ?? "manual" }); } } world.setResource(EncounterDirectorState, state); }
  return r.defineRuntimeKit({ id: config.kitId ?? "encounter-director-kit", provides: ["encounter:director", "spawn:budget", "waves:director"], resources: { EncounterDirectorState }, events: { Register, Start, ActorSpawned, ActorDefeated, Complete, Reset, SpawnRequested, Completed }, systems: [{ phase: config.phase ?? "simulate", name: "encounterDirectorSystem", system }], initWorld({ world }) { world.setResource(EncounterDirectorState, initialEncounterDirector(config)); }, install({ engine, world }) { engine[apiName(config, "encounterDirector")] = { resources: { EncounterDirectorState }, events: { Register, Start, ActorSpawned, ActorDefeated, Complete, Reset, SpawnRequested, Completed }, register(encounter = {}) { world.emit(Register, encounter); return world.getResource(EncounterDirectorState); }, start(encounterId, payload = {}) { world.emit(Start, { encounterId, ...payload }); return world.getResource(EncounterDirectorState); }, actorSpawned(encounterId, actorId, payload = {}) { world.emit(ActorSpawned, { encounterId, actorId, ...payload }); return world.getResource(EncounterDirectorState); }, actorDefeated(actorId, payload = {}) { world.emit(ActorDefeated, { actorId, ...payload }); return world.getResource(EncounterDirectorState); }, complete(encounterId, payload = {}) { world.emit(Complete, { encounterId, ...payload }); return world.getResource(EncounterDirectorState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(EncounterDirectorState); }, getState() { return world.getResource(EncounterDirectorState); }, getSnapshot() { return serialSnapshot(world, EncounterDirectorState); } }; }, bindings: { encounterDirectorState: EncounterDirectorState }, metadata: { version: ENCOUNTER_DIRECTOR_KIT_VERSION, purpose: "Wave, spawn-budget, and encounter phase director." } });
}

function initialResourceNode(config = {}) { return { version: RESOURCE_NODE_KIT_VERSION, id: config.id ?? "resource-node", nodes: {}, collected: {}, depletedNodeIds: [], history: [] }; }
export function createResourceNodeKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createResourceNodeKit"); const ResourceNodeState = r.defineResource(config.resourceName ?? "resourceNode.state"); const Register = r.defineEvent("resourceNode.register"); const Harvest = r.defineEvent("resourceNode.harvest"); const Reset = r.defineEvent("resourceNode.reset"); const Harvested = r.defineEvent("resourceNode.harvested"); const Depleted = r.defineEvent("resourceNode.depleted"); const Regenerated = r.defineEvent("resourceNode.regenerated");
  function system(world) { let state = clone(world.getResource(ResourceNodeState) ?? initialResourceNode(config)); const dt = dtOf(world, n(config.maxDelta, 1)); for (const id of sortedKeys(state.nodes)) { const node = state.nodes[id]; if (node.depleted && n(node.regenSeconds) > 0) { const remaining = Math.max(0, n(node.regenRemaining) - dt); if (remaining <= 0) { state.nodes[id] = { ...node, depleted: false, remaining: n(node.capacity), regenRemaining: 0 }; state.depletedNodeIds = state.depletedNodeIds.filter((nodeId) => nodeId !== id); world.emit(Regenerated, { nodeId: id, resourceType: node.resourceType }); } else state.nodes[id] = { ...node, regenRemaining: remaining }; } } for (const event of world.readEvents(Reset)) state = { ...initialResourceNode(config), history: [{ type: "reset", reason: event.reason ?? "reset" }] }; for (const event of world.readEvents(Register)) { const id = idOf(event.id ?? event.nodeId, `node-${sortedKeys(state.nodes).length + 1}`); const capacity = Math.max(0, n(event.capacity, n(config.defaultCapacity, 1))); state.nodes[id] = { id, resourceType: event.resourceType ?? event.type ?? config.resourceType ?? "resource", capacity, remaining: n(event.remaining, capacity), depleted: false, regenSeconds: n(event.regenSeconds, n(config.regenSeconds, 0)), regenRemaining: 0, metadata: clone(event.metadata ?? {}) }; } for (const event of world.readEvents(Harvest)) { const nodeId = idOf(event.nodeId ?? event.id, "node"); const node = state.nodes[nodeId]; if (!node || node.depleted) continue; const amount = clamp(n(event.amount, 1), 0, n(node.remaining)); const remaining = Math.max(0, n(node.remaining) - amount); const collectorId = idOf(event.collectorId ?? event.subjectId, "player"); const resourceType = event.resourceType ?? node.resourceType; state.collected[resourceType] = n(state.collected[resourceType]) + amount; state.nodes[nodeId] = { ...node, remaining, depleted: remaining <= 0, regenRemaining: remaining <= 0 ? n(node.regenSeconds) : 0 }; state = mergeHistory(state, { type: "harvested", nodeId, amount, resourceType, collectorId }); world.emit(Harvested, { nodeId, collectorId, amount, resourceType, remaining }); if (remaining <= 0) { state.depletedNodeIds = unique([...state.depletedNodeIds, nodeId]); world.emit(Depleted, { nodeId, resourceType, collectorId }); } } world.setResource(ResourceNodeState, state); }
  return r.defineRuntimeKit({ id: config.kitId ?? "resource-node-kit", provides: ["resource:nodes", "resource:harvest"], resources: { ResourceNodeState }, events: { Register, Harvest, Reset, Harvested, Depleted, Regenerated }, systems: [{ phase: config.phase ?? "simulate", name: "resourceNodeSystem", system }], initWorld({ world }) { world.setResource(ResourceNodeState, initialResourceNode(config)); }, install({ engine, world }) { engine[apiName(config, "resourceNode")] = { resources: { ResourceNodeState }, events: { Register, Harvest, Reset, Harvested, Depleted, Regenerated }, register(node = {}) { world.emit(Register, node); return world.getResource(ResourceNodeState); }, harvest(nodeId, amount = 1, payload = {}) { world.emit(Harvest, { nodeId, amount, ...payload }); return world.getResource(ResourceNodeState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(ResourceNodeState); }, getState() { return world.getResource(ResourceNodeState); }, getSnapshot() { return serialSnapshot(world, ResourceNodeState); } }; }, bindings: { resourceNodeState: ResourceNodeState }, metadata: { version: RESOURCE_NODE_KIT_VERSION, purpose: "Harvestable resource nodes, depletion, drops, and regeneration." } });
}

function initialBuildPlacement(config = {}) { return { version: BUILD_PLACEMENT_KIT_VERSION, id: config.id ?? "build-placement", catalog: clone(config.catalog ?? {}), selectedType: null, preview: null, placed: [], lastRejection: null, history: [] }; }
export function createBuildPlacementKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createBuildPlacementKit"); const BuildPlacementState = r.defineResource(config.resourceName ?? "buildPlacement.state"); const Select = r.defineEvent("buildPlacement.select"); const Preview = r.defineEvent("buildPlacement.preview"); const Place = r.defineEvent("buildPlacement.place"); const Reset = r.defineEvent("buildPlacement.reset"); const Accepted = r.defineEvent("buildPlacement.accepted"); const Rejected = r.defineEvent("buildPlacement.rejected");
  function validate(state, request = {}) { const type = request.type ?? state.selectedType; const def = state.catalog[type] ?? {}; if (!type) return { ok: false, reason: "no-type" }; if (def.enabled === false) return { ok: false, reason: "disabled" }; const resources = request.resources ?? {}; for (const [key, cost] of Object.entries(def.cost ?? {})) if (n(resources[key]) < n(cost)) return { ok: false, reason: "insufficient-resource", resource: key, required: n(cost), available: n(resources[key]) }; if (request.inRange === false) return { ok: false, reason: "out-of-range" }; if (request.blocked === true || request.collision === true) return { ok: false, reason: "blocked" }; if (typeof def.maxDistance === "number" && request.origin) { const distance = dist2(request.origin, request); if (distance > def.maxDistance) return { ok: false, reason: "out-of-range", distance, maxDistance: def.maxDistance }; } return { ok: true, reason: "valid", type, def }; }
  function system(world) { let state = clone(world.getResource(BuildPlacementState) ?? initialBuildPlacement(config)); for (const event of world.readEvents(Reset)) state = { ...initialBuildPlacement(config), history: [{ type: "reset", reason: event.reason ?? "reset" }] }; for (const event of world.readEvents(Select)) state = { ...state, selectedType: event.type ?? null, preview: null }; for (const event of world.readEvents(Preview)) { const result = validate(state, event); state.preview = { type: event.type ?? state.selectedType, x: n(event.x ?? event.position?.x), y: n(event.y ?? event.z ?? event.position?.y ?? event.position?.z), valid: result.ok, reason: result.reason, rotation: n(event.rotation, 0) }; } for (const event of world.readEvents(Place)) { const result = validate(state, event); const type = event.type ?? state.selectedType; if (!result.ok) { const rejection = { type, reason: result.reason, details: result }; state.lastRejection = rejection; state = mergeHistory(state, { type: "rejected", buildType: type, reason: result.reason }); world.emit(Rejected, rejection); continue; } const placement = { id: event.id ?? `${type}-${state.placed.length + 1}`, type, x: n(event.x ?? event.position?.x), y: n(event.y ?? event.z ?? event.position?.y ?? event.position?.z), rotation: n(event.rotation, 0), cost: clone(result.def.cost ?? {}), metadata: clone(event.metadata ?? {}) }; state.placed = [...state.placed, placement]; state.preview = { ...placement, valid: true, reason: "placed" }; state = mergeHistory(state, { type: "accepted", id: placement.id, buildType: type }); world.emit(Accepted, placement); } world.setResource(BuildPlacementState, state); }
  return r.defineRuntimeKit({ id: config.kitId ?? "build-placement-kit", provides: ["build:placement", "build:validation"], resources: { BuildPlacementState }, events: { Select, Preview, Place, Reset, Accepted, Rejected }, systems: [{ phase: config.phase ?? "simulate", name: "buildPlacementSystem", system }], initWorld({ world }) { world.setResource(BuildPlacementState, initialBuildPlacement(config)); }, install({ engine, world }) { engine[apiName(config, "buildPlacement")] = { resources: { BuildPlacementState }, events: { Select, Preview, Place, Reset, Accepted, Rejected }, select(type, payload = {}) { world.emit(Select, { type, ...payload }); return world.getResource(BuildPlacementState); }, preview(payload = {}) { world.emit(Preview, payload); return world.getResource(BuildPlacementState); }, place(payload = {}) { world.emit(Place, payload); return world.getResource(BuildPlacementState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(BuildPlacementState); }, getState() { return world.getResource(BuildPlacementState); }, getSnapshot() { return serialSnapshot(world, BuildPlacementState); } }; }, bindings: { buildPlacementState: BuildPlacementState }, metadata: { version: BUILD_PLACEMENT_KIT_VERSION, purpose: "Build type selection, preview validity, placement acceptance, and rejection reasons." } });
}

function initialStructureRuntime(config = {}) { return { version: STRUCTURE_RUNTIME_KIT_VERSION, id: config.id ?? "structure-runtime", structures: {}, destroyedIds: [], emittedRequests: [], history: [] }; }
export function createStructureRuntimeKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createStructureRuntimeKit"); const StructureRuntimeState = r.defineResource(config.resourceName ?? "structureRuntime.state"); const Register = r.defineEvent("structureRuntime.register"); const Activate = r.defineEvent("structureRuntime.activate"); const Damage = r.defineEvent("structureRuntime.damage"); const Repair = r.defineEvent("structureRuntime.repair"); const Reset = r.defineEvent("structureRuntime.reset"); const Activated = r.defineEvent("structureRuntime.activated"); const ActionRequested = r.defineEvent("structureRuntime.actionRequested"); const Destroyed = r.defineEvent("structureRuntime.destroyed");
  function system(world) { let state = clone(world.getResource(StructureRuntimeState) ?? initialStructureRuntime(config)); const dt = dtOf(world, n(config.maxDelta, 1)); for (const id of sortedKeys(state.structures)) { const structure = state.structures[id]; const cooldownRemaining = Math.max(0, n(structure.cooldownRemaining) - dt); state.structures[id] = { ...structure, cooldownRemaining }; } for (const event of world.readEvents(Reset)) state = { ...initialStructureRuntime(config), history: [{ type: "reset", reason: event.reason ?? "reset" }] }; for (const event of world.readEvents(Register)) { const id = idOf(event.id ?? event.structureId, `structure-${sortedKeys(state.structures).length + 1}`); const maxHealth = Math.max(1, n(event.maxHealth, n(event.health, n(config.defaultHealth, 100)))); state.structures[id] = { id, type: event.type ?? config.defaultType ?? "structure", mode: event.mode ?? "idle", health: clamp(n(event.health, maxHealth), 0, maxHealth), maxHealth, cooldownSeconds: n(event.cooldownSeconds, n(config.cooldownSeconds, 1)), cooldownRemaining: 0, targetId: event.targetId ?? null, metadata: clone(event.metadata ?? {}) }; } for (const event of world.readEvents(Activate)) { const id = idOf(event.id ?? event.structureId, "structure"); const structure = state.structures[id]; if (!structure || structure.health <= 0 || n(structure.cooldownRemaining) > 0) continue; const request = { structureId: id, type: structure.type, targetId: event.targetId ?? structure.targetId ?? null, action: event.action ?? structure.action ?? "activate", at: n(world.__nexusClock?.elapsed) }; state.structures[id] = { ...structure, mode: "active", cooldownRemaining: n(structure.cooldownSeconds) }; state.emittedRequests = [...state.emittedRequests, request].slice(-128); state = mergeHistory(state, { type: "activated", structureId: id }); world.emit(Activated, request); world.emit(ActionRequested, request); } for (const event of world.readEvents(Damage)) { const id = idOf(event.id ?? event.structureId, "structure"); const structure = state.structures[id]; if (!structure || structure.health <= 0) continue; const health = clamp(n(structure.health) - Math.max(0, n(event.amount)), 0, n(structure.maxHealth, 1)); state.structures[id] = { ...structure, health, mode: health <= 0 ? "destroyed" : structure.mode }; if (health <= 0 && !state.destroyedIds.includes(id)) { state.destroyedIds = unique([...state.destroyedIds, id]); state = mergeHistory(state, { type: "destroyed", structureId: id }); world.emit(Destroyed, { structureId: id, reason: event.reason ?? "health-zero" }); } } for (const event of world.readEvents(Repair)) { const id = idOf(event.id ?? event.structureId, "structure"); const structure = state.structures[id]; if (!structure) continue; const health = clamp(n(structure.health) + Math.max(0, n(event.amount)), 0, n(structure.maxHealth, 1)); state.structures[id] = { ...structure, health, mode: health > 0 && structure.mode === "destroyed" ? "idle" : structure.mode }; if (health > 0) state.destroyedIds = state.destroyedIds.filter((entry) => entry !== id); } world.setResource(StructureRuntimeState, state); }
  return r.defineRuntimeKit({ id: config.kitId ?? "structure-runtime-kit", provides: ["structure:runtime", "structure:health", "structure:actions"], resources: { StructureRuntimeState }, events: { Register, Activate, Damage, Repair, Reset, Activated, ActionRequested, Destroyed }, systems: [{ phase: config.phase ?? "simulate", name: "structureRuntimeSystem", system }], initWorld({ world }) { world.setResource(StructureRuntimeState, initialStructureRuntime(config)); }, install({ engine, world }) { engine[apiName(config, "structureRuntime")] = { resources: { StructureRuntimeState }, events: { Register, Activate, Damage, Repair, Reset, Activated, ActionRequested, Destroyed }, register(structure = {}) { world.emit(Register, structure); return world.getResource(StructureRuntimeState); }, activate(structureId, payload = {}) { world.emit(Activate, { structureId, ...payload }); return world.getResource(StructureRuntimeState); }, damage(structureId, amount, payload = {}) { world.emit(Damage, { structureId, amount, ...payload }); return world.getResource(StructureRuntimeState); }, repair(structureId, amount, payload = {}) { world.emit(Repair, { structureId, amount, ...payload }); return world.getResource(StructureRuntimeState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(StructureRuntimeState); }, getState() { return world.getResource(StructureRuntimeState); }, getSnapshot() { return serialSnapshot(world, StructureRuntimeState); } }; }, bindings: { structureRuntimeState: StructureRuntimeState }, metadata: { version: STRUCTURE_RUNTIME_KIT_VERSION, purpose: "Placed structure health, activation, cooldowns, action requests, repair, and destruction." } });
}

function initialDiegeticFeedback(config = {}) { return { version: DIEGETIC_FEEDBACK_SIGNAL_KIT_VERSION, id: config.id ?? "diegetic-feedback-signals", signals: {}, history: [] }; }
export function createDiegeticFeedbackSignalKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createDiegeticFeedbackSignalKit"); const DiegeticFeedbackState = r.defineResource(config.resourceName ?? "diegeticFeedback.state"); const SetSignal = r.defineEvent("diegeticFeedback.setSignal"); const ClearSignal = r.defineEvent("diegeticFeedback.clearSignal"); const ClearGroup = r.defineEvent("diegeticFeedback.clearGroup"); const Reset = r.defineEvent("diegeticFeedback.reset"); const Changed = r.defineEvent("diegeticFeedback.changed");
  function system(world) { let state = clone(world.getResource(DiegeticFeedbackState) ?? initialDiegeticFeedback(config)); const dt = dtOf(world, n(config.maxDelta, 1)); for (const id of sortedKeys(state.signals)) { const signal = state.signals[id]; if (signal.ttl == null) continue; const ttl = n(signal.ttl) - dt; if (ttl <= 0) { delete state.signals[id]; world.emit(Changed, { id, type: "expired" }); } else state.signals[id] = { ...signal, ttl }; } for (const event of world.readEvents(Reset)) state = { ...initialDiegeticFeedback(config), history: [{ type: "reset", reason: event.reason ?? "reset" }] }; for (const event of world.readEvents(SetSignal)) { const id = idOf(event.id ?? event.signalId, `signal-${sortedKeys(state.signals).length + 1}`); const signal = { id, kind: event.kind ?? "marker", group: event.group ?? null, targetId: event.targetId ?? null, x: n(event.x ?? event.position?.x), y: n(event.y ?? event.z ?? event.position?.y ?? event.position?.z), intensity: n(event.intensity, 1), ttl: event.ttl ?? event.duration ?? null, descriptor: clone(event.descriptor ?? {}), metadata: clone(event.metadata ?? {}) }; state.signals[id] = signal; state = mergeHistory(state, { type: "set", id, kind: signal.kind }); world.emit(Changed, { id, type: "set", signal }); } for (const event of world.readEvents(ClearSignal)) { const id = idOf(event.id ?? event.signalId, "signal"); delete state.signals[id]; state = mergeHistory(state, { type: "clear", id }); world.emit(Changed, { id, type: "clear" }); } for (const event of world.readEvents(ClearGroup)) { const group = event.group ?? null; for (const id of sortedKeys(state.signals)) if (state.signals[id].group === group) delete state.signals[id]; state = mergeHistory(state, { type: "clearGroup", group }); world.emit(Changed, { group, type: "clearGroup" }); } world.setResource(DiegeticFeedbackState, state); }
  return r.defineRuntimeKit({ id: config.kitId ?? "diegetic-feedback-signal-kit", provides: ["feedback:diegetic", "render:world-signals"], resources: { DiegeticFeedbackState }, events: { SetSignal, ClearSignal, ClearGroup, Reset, Changed }, systems: [{ phase: config.phase ?? "simulate", name: "diegeticFeedbackSignalSystem", system }], initWorld({ world }) { world.setResource(DiegeticFeedbackState, initialDiegeticFeedback(config)); }, install({ engine, world }) { engine[apiName(config, "diegeticFeedback")] = { resources: { DiegeticFeedbackState }, events: { SetSignal, ClearSignal, ClearGroup, Reset, Changed }, setSignal(signal = {}) { world.emit(SetSignal, signal); return world.getResource(DiegeticFeedbackState); }, clearSignal(id, payload = {}) { world.emit(ClearSignal, { id, ...payload }); return world.getResource(DiegeticFeedbackState); }, clearGroup(group, payload = {}) { world.emit(ClearGroup, { group, ...payload }); return world.getResource(DiegeticFeedbackState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(DiegeticFeedbackState); }, getState() { return world.getResource(DiegeticFeedbackState); }, getSnapshot() { return serialSnapshot(world, DiegeticFeedbackState); } }; }, bindings: { diegeticFeedbackState: DiegeticFeedbackState }, metadata: { version: DIEGETIC_FEEDBACK_SIGNAL_KIT_VERSION, purpose: "World-space prompt, marker, glow, danger, and objective feedback signal descriptors." } });
}

function initialAssetDescriptor(config = {}) { return { version: ASSET_DESCRIPTOR_KIT_VERSION, id: config.id ?? "asset-descriptor", assets: {}, materials: {}, effects: {}, atlases: {}, history: [] }; }
export function createAssetDescriptorKit(NexusRealtime, config = {}) {
  const r = runtime(NexusRealtime, "createAssetDescriptorKit"); const AssetDescriptorState = r.defineResource(config.resourceName ?? "assetDescriptor.state"); const RegisterAsset = r.defineEvent("assetDescriptor.registerAsset"); const RegisterMaterial = r.defineEvent("assetDescriptor.registerMaterial"); const RegisterEffect = r.defineEvent("assetDescriptor.registerEffect"); const RegisterAtlas = r.defineEvent("assetDescriptor.registerAtlas"); const Unregister = r.defineEvent("assetDescriptor.unregister"); const Reset = r.defineEvent("assetDescriptor.reset"); const Changed = r.defineEvent("assetDescriptor.changed");
  function system(world) { let state = clone(world.getResource(AssetDescriptorState) ?? initialAssetDescriptor(config)); for (const event of world.readEvents(Reset)) state = { ...initialAssetDescriptor(config), history: [{ type: "reset", reason: event.reason ?? "reset" }] }; for (const event of world.readEvents(RegisterAtlas)) { const id = idOf(event.id ?? event.atlasId, `atlas-${sortedKeys(state.atlases).length + 1}`); state.atlases[id] = { id, ...event }; world.emit(Changed, { type: "atlas", id }); } for (const event of world.readEvents(RegisterMaterial)) { const id = idOf(event.id ?? event.materialId, `material-${sortedKeys(state.materials).length + 1}`); state.materials[id] = { id, tags: unique(event.tags ?? []), ...event }; world.emit(Changed, { type: "material", id }); } for (const event of world.readEvents(RegisterEffect)) { const id = idOf(event.id ?? event.effectId, `effect-${sortedKeys(state.effects).length + 1}`); state.effects[id] = { id, kind: event.kind ?? "effect", tags: unique(event.tags ?? []), ...event }; world.emit(Changed, { type: "effect", id }); } for (const event of world.readEvents(RegisterAsset)) { const id = idOf(event.id ?? event.assetId, `asset-${sortedKeys(state.assets).length + 1}`); state.assets[id] = { id, kind: event.kind ?? event.type ?? "sprite", layer: event.layer ?? "world", tags: unique(event.tags ?? []), materialId: event.materialId ?? null, atlasId: event.atlasId ?? null, src: event.src ?? null, descriptor: clone(event.descriptor ?? {}), metadata: clone(event.metadata ?? {}) }; world.emit(Changed, { type: "asset", id }); } for (const event of world.readEvents(Unregister)) { const id = idOf(event.id, "asset"); const collection = event.collection ?? event.type ?? "assets"; if (state[collection]) delete state[collection][id]; world.emit(Changed, { type: "unregister", collection, id }); } world.setResource(AssetDescriptorState, state); }
  return r.defineRuntimeKit({ id: config.kitId ?? "asset-descriptor-kit", provides: ["asset:descriptors", "render:asset-registry"], resources: { AssetDescriptorState }, events: { RegisterAsset, RegisterMaterial, RegisterEffect, RegisterAtlas, Unregister, Reset, Changed }, systems: [{ phase: config.phase ?? "simulate", name: "assetDescriptorSystem", system }], initWorld({ world }) { world.setResource(AssetDescriptorState, initialAssetDescriptor(config)); }, install({ engine, world }) { engine[apiName(config, "assetDescriptor")] = { resources: { AssetDescriptorState }, events: { RegisterAsset, RegisterMaterial, RegisterEffect, RegisterAtlas, Unregister, Reset, Changed }, registerAsset(asset = {}) { world.emit(RegisterAsset, asset); return world.getResource(AssetDescriptorState); }, registerMaterial(material = {}) { world.emit(RegisterMaterial, material); return world.getResource(AssetDescriptorState); }, registerEffect(effect = {}) { world.emit(RegisterEffect, effect); return world.getResource(AssetDescriptorState); }, registerAtlas(atlas = {}) { world.emit(RegisterAtlas, atlas); return world.getResource(AssetDescriptorState); }, unregister(id, payload = {}) { world.emit(Unregister, { id, ...payload }); return world.getResource(AssetDescriptorState); }, reset(payload = {}) { world.emit(Reset, payload); return world.getResource(AssetDescriptorState); }, getState() { return world.getResource(AssetDescriptorState); }, getSnapshot() { return serialSnapshot(world, AssetDescriptorState); } }; }, bindings: { assetDescriptorState: AssetDescriptorState }, metadata: { version: ASSET_DESCRIPTOR_KIT_VERSION, purpose: "Renderer-agnostic asset, material, atlas, and effect descriptor registry." } });
}

export function createDomainServiceKits(NexusRealtime, config = {}) {
  const cfg = config ?? {};
  const kitConfig = (name) => ({ ...(cfg[name] ?? {}) });
  const kits = [
    createViewRigKit(NexusRealtime, kitConfig("viewRig")),
    createCompletionLedgerKit(NexusRealtime, kitConfig("completionLedger")),
    createObjectiveBridgeKit(NexusRealtime, kitConfig("objectiveBridge")),
    createSpatialInteractionKit(NexusRealtime, kitConfig("spatialInteraction")),
    createLockGroupKit(NexusRealtime, kitConfig("lockGroup")),
    createDamageHealthKit(NexusRealtime, kitConfig("damageHealth")),
    createEncounterDirectorKit(NexusRealtime, kitConfig("encounterDirector")),
    createResourceNodeKit(NexusRealtime, kitConfig("resourceNode")),
    createBuildPlacementKit(NexusRealtime, kitConfig("buildPlacement")),
    createStructureRuntimeKit(NexusRealtime, kitConfig("structureRuntime")),
    createDiegeticFeedbackSignalKit(NexusRealtime, kitConfig("diegeticFeedback")),
    createAssetDescriptorKit(NexusRealtime, kitConfig("assetDescriptor"))
  ];
  if (cfg.includeHazardDirector && typeof cfg.createHazardDirectorKit === "function") kits.push(cfg.createHazardDirectorKit(NexusRealtime, kitConfig("hazardDirector")));
  return kits;
}

export default createDomainServiceKits;
