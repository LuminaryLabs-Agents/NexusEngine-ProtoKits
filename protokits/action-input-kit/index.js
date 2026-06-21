export const ACTION_INPUT_KIT_VERSION = "0.2.0";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clone = (value) => JSON.parse(JSON.stringify(value));
const keyName = (value) => String(value ?? "").trim().toLowerCase();
const actionName = (value) => String(value ?? "").trim();

function normVec(x, y, fallback = { x: 0.01, y: 0.45 }) {
  const nx = Number.isFinite(Number(x)) ? Number(x) : fallback.x;
  const ny = Number.isFinite(Number(y)) ? Number(y) : fallback.y;
  const d = Math.hypot(nx, ny) || 1;
  return { x: nx / d, y: ny / d };
}

export function createDefaultActionInputBindings(bindings = {}) {
  return {
    left: ["a", "arrowleft"],
    right: ["d", "arrowright"],
    up: ["w", "arrowup"],
    down: ["s", "arrowdown"],
    primary: [" ", "space", "pointer0"],
    secondary: ["shift", "pointer2"],
    restart: ["r"],
    debugAdvance: ["n"],
    pause: ["p", "escape"],
    inspect: ["i", "e"],
    rotateLeft: ["q"],
    rotateRight: ["e"],
    activate: ["enter", "pointer0"],
    pickup: ["f"],
    drop: ["g"],
    cycleVariant: ["tab"],
    resetProof: ["backspace"],
    ...bindings
  };
}

function normalizeBindings(bindings = {}) {
  const out = {};
  for (const [action, keys] of Object.entries(createDefaultActionInputBindings(bindings))) {
    out[action] = (Array.isArray(keys) ? keys : [keys]).map(keyName).filter(Boolean);
  }
  return out;
}

function createKeyMap(bindings) {
  const map = {};
  for (const [action, keys] of Object.entries(bindings)) {
    for (const key of keys) {
      if (!map[key]) map[key] = [];
      map[key].push(action);
    }
  }
  return map;
}

function axisFromHeld(held = {}) {
  const x = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  const y = (held.up ? 1 : 0) - (held.down ? 1 : 0);
  return { x: clamp(x, -1, 1), y: clamp(y, -1, 1), horizontal: clamp(x, -1, 1), vertical: clamp(y, -1, 1) };
}

function sameAxis(a = {}, b = {}) {
  return Math.abs(Number(a.x ?? a.horizontal ?? 0) - Number(b.x ?? b.horizontal ?? 0)) < 0.0001 &&
    Math.abs(Number(a.y ?? a.vertical ?? 0) - Number(b.y ?? b.vertical ?? 0)) < 0.0001;
}

function sameVec(a = {}, b = {}) {
  return Math.abs(Number(a.x ?? 0) - Number(b.x ?? 0)) < 0.0001 && Math.abs(Number(a.y ?? 0) - Number(b.y ?? 0)) < 0.0001;
}

function initialState(config = {}) {
  const bindings = normalizeBindings(config.bindings);
  const held = Object.fromEntries(Object.keys(bindings).map((action) => [action, false]));
  return {
    version: ACTION_INPUT_KIT_VERSION,
    context: config.context ?? "default",
    bindings,
    keyMap: createKeyMap(bindings),
    held,
    heldKeys: {},
    objectTargets: {},
    hoveredObjectId: null,
    inspectedObjectId: null,
    axis: axisFromHeld(held),
    aim: normVec(config.defaultAim?.x, config.defaultAim?.y),
    sequence: 0,
    changed: false,
    edges: [],
    objectEvents: [],
    semanticEvents: []
  };
}

export function createActionInputKit(NexusRealtime, config = {}) {
  const { defineResource, defineEvent, defineRuntimeKit } = NexusRealtime;
  const ActionInputState = defineResource(config.resourceName ?? "actionInput.state");
  const InputKey = defineEvent("actionInput.key");
  const InputPress = defineEvent("actionInput.press");
  const InputRelease = defineEvent("actionInput.release");
  const InputAim = defineEvent("actionInput.aim");
  const InputObject = defineEvent("actionInput.object");
  const InputClear = defineEvent("actionInput.clear");
  const ActionPressed = defineEvent("actionInput.pressed");
  const ActionReleased = defineEvent("actionInput.released");
  const ActionChanged = defineEvent("actionInput.changed");
  const AxisChanged = defineEvent("actionInput.axisChanged");
  const AimChanged = defineEvent("actionInput.aimChanged");
  const ObjectInputEvent = defineEvent("actionInput.objectEvent");
  const Cleared = defineEvent("actionInput.cleared");

  function semantic(world, state, eventDef, type, payload = {}) {
    const event = { type, context: state.context, sequence: ++state.sequence, ...payload };
    state.semanticEvents.push(event);
    world.emit(eventDef, event);
    return event;
  }

  function setAction(world, state, action, down, source = "host") {
    const name = actionName(action);
    if (!name || Boolean(state.held[name]) === Boolean(down)) return;
    state.held[name] = Boolean(down);
    state.changed = true;
    const event = semantic(world, state, down ? ActionPressed : ActionReleased, down ? "pressed" : "released", { action: name, down: Boolean(down), source });
    state.edges.push(event);
    world.emit(ActionChanged, event);
  }

  function setKey(world, state, key, down, source = "host") {
    const name = keyName(key);
    if (!name || Boolean(state.heldKeys[name]) === Boolean(down)) return;
    state.heldKeys[name] = Boolean(down);
    for (const action of state.keyMap[name] ?? []) setAction(world, state, action, down, source);
  }

  function updateAxis(world, state, source = "derived") {
    const next = axisFromHeld(state.held);
    if (sameAxis(state.axis, next)) return;
    state.axis = next;
    semantic(world, state, AxisChanged, "axisChanged", { axis: next, source });
  }

  function setAim(world, state, event = {}) {
    const aim = normVec(event.x, event.y, state.aim);
    if (sameVec(state.aim, aim)) return;
    state.aim = aim;
    state.changed = true;
    semantic(world, state, AimChanged, "aimChanged", { aim, source: event.source ?? "host" });
  }

  function setObjectInput(world, state, event = {}) {
    const objectId = event.objectId ?? event.id ?? null;
    const action = actionName(event.action ?? event.type ?? "object");
    const payload = { action, objectId, source: event.source ?? "host", point: event.point ?? null, variant: event.variant ?? null, metadata: event.metadata ?? {} };
    if (action === "hover") state.hoveredObjectId = objectId;
    if (action === "inspect") state.inspectedObjectId = objectId;
    if (objectId) state.objectTargets[objectId] = { ...(state.objectTargets[objectId] ?? {}), lastAction: action, lastSequence: state.sequence + 1, hovered: action === "hover" ? true : state.objectTargets[objectId]?.hovered, inspected: action === "inspect" ? true : state.objectTargets[objectId]?.inspected };
    const next = semantic(world, state, ObjectInputEvent, "objectEvent", payload);
    state.objectEvents.push(next);
    state.changed = true;
  }

  function clear(world, state, source = "clear") {
    for (const key of Object.keys(state.heldKeys)) state.heldKeys[key] = false;
    for (const action of Object.keys(state.held)) state.held[action] = false;
    const next = axisFromHeld(state.held);
    state.hoveredObjectId = null;
    state.inspectedObjectId = null;
    state.changed = true;
    semantic(world, state, Cleared, "cleared", { source });
    if (!sameAxis(state.axis, next)) {
      state.axis = next;
      semantic(world, state, AxisChanged, "axisChanged", { axis: next, source });
    }
  }

  function system(world) {
    const state = clone(world.getResource(ActionInputState) ?? initialState(config));
    state.changed = false;
    state.edges = [];
    state.objectEvents = [];
    state.semanticEvents = [];
    for (const event of world.readEvents(InputClear)) clear(world, state, event?.source ?? "clear");
    for (const event of world.readEvents(InputKey)) setKey(world, state, event?.key, Boolean(event?.down), event?.source ?? "host");
    for (const event of world.readEvents(InputPress)) setAction(world, state, event?.action, true, event?.source ?? "host");
    for (const event of world.readEvents(InputRelease)) setAction(world, state, event?.action, false, event?.source ?? "host");
    for (const event of world.readEvents(InputAim)) setAim(world, state, event);
    for (const event of world.readEvents(InputObject)) setObjectInput(world, state, event);
    updateAxis(world, state);
    world.setResource(ActionInputState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "action-input-kit",
    provides: ["input:actions", "input:contextual-actions", "object-input-events", "semantic-action-events"],
    resources: { ActionInputState },
    events: { InputKey, InputPress, InputRelease, InputAim, InputObject, InputClear, ActionPressed, ActionReleased, ActionChanged, AxisChanged, AimChanged, ObjectInputEvent, Cleared },
    systems: [{ phase: config.phase ?? "simulate", system, name: "actionInputSystem" }],
    initWorld({ world }) { world.setResource(ActionInputState, initialState(config)); },
    install({ engine, world }) {
      const apiName = config.apiName ?? "actionInput";
      engine[apiName] = {
        resources: { ActionInputState },
        events: { InputKey, InputPress, InputRelease, InputAim, InputObject, InputClear, ActionPressed, ActionReleased, ActionChanged, AxisChanged, AimChanged, ObjectInputEvent, Cleared },
        key(key, down, payload = {}) { world.emit(InputKey, { key, down: Boolean(down), ...payload }); return world.getResource(ActionInputState); },
        press(action, payload = {}) { world.emit(InputPress, { action, ...payload }); return world.getResource(ActionInputState); },
        release(action, payload = {}) { world.emit(InputRelease, { action, ...payload }); return world.getResource(ActionInputState); },
        aim(x, y, payload = {}) { world.emit(InputAim, { x, y, ...payload }); return world.getResource(ActionInputState); },
        object(action, objectId, payload = {}) { world.emit(InputObject, { action, objectId, ...payload }); return world.getResource(ActionInputState); },
        hover(objectId, payload = {}) { return this.object("hover", objectId, payload); },
        inspect(objectId, payload = {}) { return this.object("inspect", objectId, payload); },
        activate(objectId, payload = {}) { return this.object("activate", objectId, payload); },
        pickup(objectId, payload = {}) { return this.object("pickup", objectId, payload); },
        drop(objectId, payload = {}) { return this.object("drop", objectId, payload); },
        cycleVariant(objectId, payload = {}) { return this.object("cycleVariant", objectId, payload); },
        resetProof(objectId, payload = {}) { return this.object("resetProof", objectId, payload); },
        clear(payload = {}) { world.emit(InputClear, payload); return world.getResource(ActionInputState); },
        getState() { return world.getResource(ActionInputState); },
        getIntent() {
          const state = world.getResource(ActionInputState);
          return state ? { context: state.context, held: { ...state.held }, axis: { ...state.axis }, aim: { ...state.aim }, hoveredObjectId: state.hoveredObjectId, inspectedObjectId: state.inspectedObjectId } : null;
        }
      };
    },
    bindings: { actionInputContext: config.context ?? "default", actionInputBindings: normalizeBindings(config.bindings) },
    metadata: { version: ACTION_INPUT_KIT_VERSION, purpose: "Contextual action input and object-proof semantic input events for game hosts and subscribed kits." }
  });
}

export default createActionInputKit;
