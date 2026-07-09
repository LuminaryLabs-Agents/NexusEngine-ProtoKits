export const SPATIAL_AUTHORING_KITS_VERSION = "0.3.0";

export const REQUIRED_HAND_AUTHORING_KITS = Object.freeze([
  "webxr-hand-adapter-dsk",
  "openxr-hand-adapter-dsk",
  "hand-gesture-dsk",
  "spatial-scene-graph-dsk",
  "selection-dsk",
  "transform-dsk",
  "widget-dsk",
  "interaction-dsk",
  "persistence-dsk"
]);

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clockFrame = (world) => toNumber(world?.__nexusClock?.frame, 0);

export function requireNexus(NexusEngine, name = "hand authoring dsk") {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`${name} requires NexusEngine.${key}.`);
    }
  }
}

export function vec3(value = {}, fallback = {}) {
  return {
    x: toNumber(value.x, toNumber(fallback.x, 0)),
    y: toNumber(value.y, toNumber(fallback.y, 0)),
    z: toNumber(value.z, toNumber(fallback.z, 0))
  };
}

export function quat(value = {}, fallback = {}) {
  return {
    x: toNumber(value.x, toNumber(fallback.x, 0)),
    y: toNumber(value.y, toNumber(fallback.y, 0)),
    z: toNumber(value.z, toNumber(fallback.z, 0)),
    w: toNumber(value.w, toNumber(fallback.w, 1))
  };
}

export function normalizeTransform(value = {}) {
  return {
    space: String(value.space ?? value.referenceSpace ?? "local-floor"),
    position: vec3(value.position),
    rotation: quat(value.rotation),
    scale: vec3(value.scale, { x: 1, y: 1, z: 1 })
  };
}

export function normalizeSpatialObject(value = {}, index = 0) {
  const id = String(value.id ?? `object-${index}`).trim();
  if (!id) throw new TypeError("Spatial objects require a stable id.");
  const capabilities = value.capabilities ?? {};
  return {
    id,
    type: String(value.type ?? "spatial.object"),
    name: String(value.name ?? id),
    tags: asArray(value.tags).map(String).filter(Boolean),
    parentId: value.parentId ?? null,
    transform: normalizeTransform(value.transform ?? {}),
    bounds: {
      center: vec3(value.bounds?.center),
      size: vec3(value.bounds?.size, { x: 0.4, y: 0.25, z: 0.04 })
    },
    anchor: {
      type: String(value.anchor?.type ?? "local"),
      anchorId: value.anchor?.anchorId ?? null,
      referenceSpace: String(value.anchor?.referenceSpace ?? value.transform?.space ?? "local-floor"),
      persistence: String(value.anchor?.persistence ?? "session"),
      confidence: toNumber(value.anchor?.confidence, 1)
    },
    capabilities: {
      selectable: capabilities.selectable !== false,
      movable: capabilities.movable !== false,
      resizable: capabilities.resizable !== false,
      rotatable: capabilities.rotatable !== false,
      interactable: capabilities.interactable !== false,
      persistent: capabilities.persistent !== false
    },
    widget: value.widget ? clone(value.widget) : null,
    interaction: value.interaction ? clone(value.interaction) : null,
    metadata: clone(value.metadata ?? {})
  };
}

function definition(id, engineKey, provides, requires, purpose, category = "hand-authoring-dsk") {
  return Object.freeze({ id, engineKey, provides, requires, purpose, category });
}

export const WEBXR_HAND_ADAPTER_DSK_DEFINITION = definition("webxr-hand-adapter-dsk", "webxrHandAdapter", ["hand:adapter", "webxr:hand-input", "xr:normalized-hand-command"], [], "Normalizes WebXR hand/input-source data into plain hand commands without storing XRSession, XRFrame, XRInputSource, DOM, Canvas, or renderer objects.", "adapter-dsk");
export const OPENXR_HAND_ADAPTER_DSK_DEFINITION = definition("openxr-hand-adapter-dsk", "openxrHandAdapter", ["hand:adapter", "openxr:hand-input", "xr:normalized-hand-command"], [], "Normalizes OpenXR action-space and hand-joint data into plain hand commands without storing XrSession, XrSpace, XrSwapchain, or renderer objects.", "adapter-dsk");
export const HAND_GESTURE_DSK_DEFINITION = definition("hand-gesture-dsk", "handGestures", ["hand:gesture", "hand:pinch", "hand:ray", "hand:two-hand-gesture", "hand:menu-intent"], ["xr:normalized-hand-command"], "Classifies normalized hand frames into authoring gestures.");
export const SPATIAL_SCENE_GRAPH_DSK_DEFINITION = definition("spatial-scene-graph-dsk", "spatialScene", ["scene:graph", "scene:objects", "scene:patches", "scene:dirty-set"], [], "Owns persistent spatial objects, transforms, anchors, capabilities, dirty ids, and patches.");
export const SELECTION_DSK_DEFINITION = definition("selection-dsk", "selection", ["selection:state", "selection:targeting"], ["scene:graph", "hand:gesture"], "Turns hand hits and pinch selections into selected/framed/hovered object state.");
export const TRANSFORM_DSK_DEFINITION = definition("transform-dsk", "transforms", ["transform:commands", "transform:patches"], ["scene:graph", "selection:state", "hand:gesture"], "Applies hand move and two-hand resize commands as scene graph patches.");
export const WIDGET_DSK_DEFINITION = definition("widget-dsk", "widgets", ["widget:registry", "widget:factory", "widget:state"], ["scene:graph"], "Creates semantic panel, note, timer, and button widget scene objects.");
export const INTERACTION_DSK_DEFINITION = definition("interaction-dsk", "interactions", ["interaction:commands", "interaction:registry", "interaction:events"], ["scene:graph", "widget:registry"], "Owns semantic press, toggle, open, close, start, pause, reset, and inspect verbs.");
export const PERSISTENCE_DSK_DEFINITION = definition("persistence-dsk", "persistence", ["persistence:snapshot", "persistence:history", "persistence:undo-redo"], ["scene:graph", "widget:registry", "interaction:events"], "Captures and serializes JSON-safe hand-authored workspace state.");

export const HAND_AUTHORING_DSK_DEFINITIONS = Object.freeze([
  WEBXR_HAND_ADAPTER_DSK_DEFINITION,
  OPENXR_HAND_ADAPTER_DSK_DEFINITION,
  HAND_GESTURE_DSK_DEFINITION,
  SPATIAL_SCENE_GRAPH_DSK_DEFINITION,
  SELECTION_DSK_DEFINITION,
  TRANSFORM_DSK_DEFINITION,
  WIDGET_DSK_DEFINITION,
  INTERACTION_DSK_DEFINITION,
  PERSISTENCE_DSK_DEFINITION
]);

export const SPATIAL_AUTHORING_CONTRACTS = Object.freeze({
  normalizedHandCommand: {
    type: "hand.gesture",
    actorId: "user",
    hand: "left|right|both",
    gesture: "point|pinchStart|pinchMove|pinchEnd|grab|twoHandScale|twoHandRotate|palmMenu|undo",
    referenceSpace: "local-floor",
    confidence: "0..1",
    ray: { origin: "vec3", direction: "vec3" },
    pinch: { active: "boolean", strength: "0..1", indexThumbDistance: "meters" },
    hit: { objectId: "string|null", point: "vec3", distance: "number" }
  },
  rawRuntimeObjectsForbidden: ["XrSession", "XrSpace", "XrSwapchain", "XRSession", "XRFrame", "XRInputSource", "HTMLCanvasElement", "THREE.Object3D"]
});

function defineAtomicKit(NexusEngine, definition, config, spec) {
  requireNexus(NexusEngine, definition.id);
  return NexusEngine.defineRuntimeKit({
    id: config.kitId ?? definition.id,
    requires: definition.requires,
    provides: definition.provides,
    ...spec,
    metadata: {
      version: SPATIAL_AUTHORING_KITS_VERSION,
      status: "experimental",
      category: definition.category,
      purpose: definition.purpose
    }
  });
}

function createHandAdapterDsk(NexusEngine, definition, config = {}) {
  const State = NexusEngine.defineResource(`${definition.id}.state`);
  const Input = NexusEngine.defineEvent(`${definition.id}.input`);
  const Normalized = NexusEngine.defineEvent(`${definition.id}.normalized`);
  const createInitialState = () => ({
    version: SPATIAL_AUTHORING_KITS_VERSION,
    provider: definition.id.includes("webxr") ? "webxr" : "openxr",
    referenceSpace: config.referenceSpace ?? "local-floor",
    commands: [],
    lastCommand: null,
    rawRuntimeObjectsForbidden: [...SPATIAL_AUTHORING_CONTRACTS.rawRuntimeObjectsForbidden]
  });
  function normalize(payload = {}, state = createInitialState()) {
    return {
      type: payload.type ?? "hand.poseFrame",
      actorId: payload.actorId ?? "user",
      hand: payload.hand ?? "right",
      gesture: payload.gesture ?? payload.type ?? "pose",
      source: payload.source ?? state.provider,
      referenceSpace: payload.referenceSpace ?? state.referenceSpace,
      confidence: Math.max(0, Math.min(1, toNumber(payload.confidence, 1))),
      ray: payload.ray ? { origin: vec3(payload.ray.origin), direction: vec3(payload.ray.direction, { z: -1 }) } : null,
      pinch: payload.pinch ? clone(payload.pinch) : null,
      pose: payload.pose ? clone(payload.pose) : null,
      hit: payload.hit ? { ...clone(payload.hit), objectId: payload.hit.objectId ?? null, point: vec3(payload.hit.point), distance: toNumber(payload.hit.distance, 0) } : null
    };
  }
  function system(world) {
    let state = world.getResource(State) ?? createInitialState();
    for (const event of world.readEvents(Input)) {
      const command = normalize(event, state);
      state = { ...state, commands: [...state.commands.slice(-31), command], lastCommand: command };
      world.emit(Normalized, command);
    }
    world.setResource(State, state);
  }
  return defineAtomicKit(NexusEngine, definition, config, {
    resources: { State },
    events: { Input, Normalized },
    systems: [{ phase: "input", name: `${definition.engineKey}System`, system }],
    initWorld({ world }) { world.setResource(State, createInitialState()); },
    install({ engine, world }) {
      engine[definition.engineKey] = {
        input(payload = {}) { world.emit(Input, payload); return world.getResource(State); },
        normalize(payload = {}) { return normalize(payload, world.getResource(State) ?? createInitialState()); },
        getState() { return world.getResource(State); }
      };
    },
    bindings: { State }
  });
}

export function createWebXrHandAdapterDsk(NexusEngine, config = {}) { return createHandAdapterDsk(NexusEngine, WEBXR_HAND_ADAPTER_DSK_DEFINITION, config); }
export function createOpenXrHandAdapterDsk(NexusEngine, config = {}) { return createHandAdapterDsk(NexusEngine, OPENXR_HAND_ADAPTER_DSK_DEFINITION, config); }
export const createWebXRHandAdapterDsk = createWebXrHandAdapterDsk;
export const createOpenXRHandAdapterDsk = createOpenXrHandAdapterDsk;

export function createHandGestureDsk(NexusEngine, config = {}) {
  const State = NexusEngine.defineResource("handGesture.state");
  const Command = NexusEngine.defineEvent("handGesture.command");
  const Recognized = NexusEngine.defineEvent("handGesture.recognized");
  const createInitialState = () => ({ version: SPATIAL_AUTHORING_KITS_VERSION, active: {}, recent: [], lastGesture: null });
  function system(world) {
    let state = world.getResource(State) ?? createInitialState();
    for (const event of world.readEvents(Command)) {
      const gesture = { ...clone(event), gesture: event.gesture ?? event.type ?? "pose", tick: clockFrame(world) };
      state = { ...state, active: { ...state.active, [gesture.hand ?? "right"]: gesture }, recent: [...state.recent.slice(-31), gesture], lastGesture: gesture };
      world.emit(Recognized, gesture);
    }
    world.setResource(State, state);
  }
  return defineAtomicKit(NexusEngine, HAND_GESTURE_DSK_DEFINITION, config, {
    resources: { State }, events: { Command, Recognized }, systems: [{ phase: "input", name: "handGestureDskSystem", system }],
    initWorld({ world }) { world.setResource(State, createInitialState()); },
    install({ engine, world }) { engine.handGestures = { command(payload = {}) { world.emit(Command, payload); return world.getResource(State); }, getState() { return world.getResource(State); } }; },
    bindings: { State }
  });
}

export function createSpatialSceneGraphDsk(NexusEngine, config = {}) {
  const State = NexusEngine.defineResource("spatialSceneGraph.state");
  const Create = NexusEngine.defineEvent("spatialScene.object.create");
  const Update = NexusEngine.defineEvent("spatialScene.object.update");
  const Patch = NexusEngine.defineEvent("spatialScene.patch.apply");
  const Applied = NexusEngine.defineEvent("spatialScene.patch.applied");
  const createInitialState = () => {
    const objects = {};
    for (const [index, object] of asArray(config.objects).entries()) {
      const normalized = normalizeSpatialObject(object, index);
      objects[normalized.id] = normalized;
    }
    return { version: SPATIAL_AUTHORING_KITS_VERSION, sceneId: config.sceneId ?? "hand-workspace", objects, dirtyObjectIds: [], patches: [], rejectedPatches: [], lastPatchId: null };
  };
  function applyPatch(state, patch) {
    const id = patch.id ?? `patch-${state.patches.length + 1}`;
    const next = { ...state, objects: { ...state.objects } };
    if (patch.type === "createObject") {
      const object = normalizeSpatialObject(patch.object);
      next.objects[object.id] = object;
      return { ...next, dirtyObjectIds: Array.from(new Set([...state.dirtyObjectIds, object.id])), patches: [...state.patches, { ...patch, id, status: "applied" }], lastPatchId: id };
    }
    if (patch.type === "updateObject" && next.objects[patch.objectId]) {
      next.objects[patch.objectId] = { ...next.objects[patch.objectId], ...clone(patch.partial ?? {}), id: patch.objectId, transform: patch.partial?.transform ? normalizeTransform(patch.partial.transform) : next.objects[patch.objectId].transform };
      return { ...next, dirtyObjectIds: Array.from(new Set([...state.dirtyObjectIds, patch.objectId])), patches: [...state.patches, { ...patch, id, status: "applied" }], lastPatchId: id };
    }
    return { ...state, rejectedPatches: [...state.rejectedPatches, { ...patch, id, reason: "invalid-patch" }] };
  }
  function system(world) {
    let state = world.getResource(State) ?? createInitialState();
    for (const event of world.readEvents(Create)) state = applyPatch(state, { type: "createObject", object: event.object ?? event });
    for (const event of world.readEvents(Update)) state = applyPatch(state, { type: "updateObject", objectId: event.objectId ?? event.id, partial: event.partial ?? event });
    for (const event of world.readEvents(Patch)) state = applyPatch(state, event);
    if (state.lastPatchId) world.emit(Applied, { patchId: state.lastPatchId, dirtyObjectIds: state.dirtyObjectIds });
    world.setResource(State, state);
  }
  return defineAtomicKit(NexusEngine, SPATIAL_SCENE_GRAPH_DSK_DEFINITION, config, {
    resources: { State }, events: { Create, Update, Patch, Applied }, systems: [{ phase: "simulate", name: "spatialSceneGraphDskSystem", system }],
    initWorld({ world }) { world.setResource(State, createInitialState()); },
    install({ engine, world }) { engine.spatialScene = { createObject(object) { world.emit(Create, { object }); return world.getResource(State); }, updateObject(objectId, partial) { world.emit(Update, { objectId, partial }); return world.getResource(State); }, applyPatch(patch) { world.emit(Patch, patch); return world.getResource(State); }, getObject(id) { return world.getResource(State)?.objects?.[id] ?? null; }, getState() { return world.getResource(State); } }; },
    bindings: { State }
  });
}

export function createSelectionDsk(NexusEngine, config = {}) {
  const State = NexusEngine.defineResource("selection.state");
  const Select = NexusEngine.defineEvent("selection.pointSelect");
  const Clear = NexusEngine.defineEvent("selection.clear");
  const Changed = NexusEngine.defineEvent("selection.changed");
  const createInitialState = () => ({ version: SPATIAL_AUTHORING_KITS_VERSION, selectedObjectIds: [], hoveredObjectId: null, framedObjectIds: [], confidence: 0, lastReason: "initialized" });
  function system(world) {
    let state = world.getResource(State) ?? createInitialState();
    for (const event of world.readEvents(Select)) {
      const id = event.objectId ?? event.hit?.objectId;
      if (!id) continue;
      state = { ...state, selectedObjectIds: [id], hoveredObjectId: id, confidence: toNumber(event.confidence, 1), lastReason: "point-select" };
      world.emit(Changed, { selectedObjectIds: state.selectedObjectIds });
    }
    for (const event of world.readEvents(Clear)) {
      state = { ...state, selectedObjectIds: [], hoveredObjectId: null, lastReason: event.reason ?? "clear" };
      world.emit(Changed, { selectedObjectIds: [] });
    }
    world.setResource(State, state);
  }
  return defineAtomicKit(NexusEngine, SELECTION_DSK_DEFINITION, config, {
    resources: { State }, events: { Select, Clear, Changed }, systems: [{ phase: "simulate", name: "selectionDskSystem", system }],
    initWorld({ world }) { world.setResource(State, createInitialState()); },
    install({ engine, world }) { engine.selection = { pointSelect(payload = {}) { world.emit(Select, payload); return world.getResource(State); }, clear(payload = {}) { world.emit(Clear, payload); return world.getResource(State); }, getState() { return world.getResource(State); } }; },
    bindings: { State }
  });
}

export function createTransformDsk(NexusEngine, config = {}) {
  const State = NexusEngine.defineResource("transform.state");
  const Move = NexusEngine.defineEvent("transform.move");
  const Resize = NexusEngine.defineEvent("transform.resize");
  const createInitialState = () => ({ version: SPATIAL_AUTHORING_KITS_VERSION, lastPatch: null });
  const targetIds = (world, value) => asArray(value).length ? asArray(value).map(String) : (world.getResource({ name: "selection.state" })?.selectedObjectIds ?? []);
  function system(world) {
    let state = world.getResource(State) ?? createInitialState();
    for (const event of world.readEvents(Move)) {
      for (const id of targetIds(world, event.targetIds ?? event.objectId)) {
        const patch = { type: "updateObject", objectId: id, partial: { transform: { position: vec3(event.position ?? event.delta) } }, source: "transform-dsk" };
        world.emit({ name: "spatialScene.patch.apply" }, patch);
        state = { ...state, lastPatch: patch };
      }
    }
    for (const event of world.readEvents(Resize)) {
      for (const id of targetIds(world, event.targetIds ?? event.objectId)) {
        const scalar = toNumber(event.scalar, 1);
        const patch = { type: "updateObject", objectId: id, partial: { transform: { scale: vec3(event.scale, { x: scalar, y: scalar, z: scalar }) } }, source: "transform-dsk" };
        world.emit({ name: "spatialScene.patch.apply" }, patch);
        state = { ...state, lastPatch: patch };
      }
    }
    world.setResource(State, state);
  }
  return defineAtomicKit(NexusEngine, TRANSFORM_DSK_DEFINITION, config, {
    resources: { State }, events: { Move, Resize }, systems: [{ phase: "simulate", name: "transformDskSystem", system }],
    initWorld({ world }) { world.setResource(State, createInitialState()); },
    install({ engine, world }) { engine.transforms = { move(targetIds, position) { world.emit(Move, { targetIds, position }); return world.getResource(State); }, resize(targetIds, value) { const payload = typeof value === "number" ? { scalar: value } : { scale: value }; world.emit(Resize, { targetIds, ...payload }); return world.getResource(State); }, getState() { return world.getResource(State); } }; },
    bindings: { State }
  });
}

export function createWidgetDsk(NexusEngine, config = {}) {
  const State = NexusEngine.defineResource("widget.state");
  const Create = NexusEngine.defineEvent("widget.create");
  const createInitialState = () => ({ version: SPATIAL_AUTHORING_KITS_VERSION, types: ["panel", "note", "timer", "button"], instances: {}, lastCreatedObjectId: null });
  function system(world) {
    let state = world.getResource(State) ?? createInitialState();
    for (const event of world.readEvents(Create)) {
      const type = event.type ?? "panel";
      const id = event.id ?? `${type}-${Object.keys(state.instances).length + 1}`;
      const widget = { type, props: clone(event.props ?? {}), state: clone(event.state ?? {}) };
      state = { ...state, instances: { ...state.instances, [id]: widget }, lastCreatedObjectId: id };
      world.emit({ name: "spatialScene.object.create" }, { object: normalizeSpatialObject({ id, type: `widget.${type}`, tags: ["widget", type], transform: event.transform, widget, interaction: { verbs: ["press", "open", "close", "toggle", "start", "pause", "reset"] } }) });
    }
    world.setResource(State, state);
  }
  return defineAtomicKit(NexusEngine, WIDGET_DSK_DEFINITION, config, {
    resources: { State }, events: { Create }, systems: [{ phase: "simulate", name: "widgetDskSystem", system }],
    initWorld({ world }) { world.setResource(State, createInitialState()); },
    install({ engine, world }) { engine.widgets = { create(type, props = {}, transform = {}) { world.emit(Create, { type, props, transform }); return world.getResource(State); }, getState() { return world.getResource(State); } }; },
    bindings: { State }
  });
}

export function createInteractionDsk(NexusEngine, config = {}) {
  const State = NexusEngine.defineResource("interaction.state");
  const Request = NexusEngine.defineEvent("interaction.request");
  const Completed = NexusEngine.defineEvent("interaction.completed");
  const createInitialState = () => ({ version: SPATIAL_AUTHORING_KITS_VERSION, verbs: ["press", "toggle", "open", "close", "start", "pause", "reset", "inspect"], history: [], lastInteraction: null });
  function system(world) {
    let state = world.getResource(State) ?? createInitialState();
    for (const event of world.readEvents(Request)) {
      const record = { actorId: event.actorId ?? "user", targetId: event.targetId ?? event.objectId, verb: event.verb ?? "press", payload: clone(event.payload ?? {}), tick: clockFrame(world) };
      state = { ...state, history: [...state.history.slice(-31), record], lastInteraction: record };
      world.emit(Completed, record);
    }
    world.setResource(State, state);
  }
  return defineAtomicKit(NexusEngine, INTERACTION_DSK_DEFINITION, config, {
    resources: { State }, events: { Request, Completed }, systems: [{ phase: "simulate", name: "interactionDskSystem", system }],
    initWorld({ world }) { world.setResource(State, createInitialState()); },
    install({ engine, world }) { engine.interactions = { request(payload = {}) { world.emit(Request, payload); return world.getResource(State); }, press(targetId, actorId = "user") { world.emit(Request, { targetId, actorId, verb: "press" }); return world.getResource(State); }, getState() { return world.getResource(State); } }; },
    bindings: { State }
  });
}

export function createPersistenceDsk(NexusEngine, config = {}) {
  const State = NexusEngine.defineResource("persistence.state");
  const Capture = NexusEngine.defineEvent("persistence.capture");
  const createInitialState = () => ({ version: SPATIAL_AUTHORING_KITS_VERSION, snapshots: {}, currentSnapshotId: null, lastSerialized: null });
  function system(world) {
    let state = world.getResource(State) ?? createInitialState();
    for (const event of world.readEvents(Capture)) {
      const id = event.id ?? `snapshot-${Object.keys(state.snapshots).length + 1}`;
      const snapshot = { id, label: event.label ?? id, capturedAtTick: clockFrame(world), scene: clone(world.getResource({ name: "spatialSceneGraph.state" })), widgets: clone(world.getResource({ name: "widget.state" })), interactions: clone(world.getResource({ name: "interaction.state" })) };
      state = { ...state, snapshots: { ...state.snapshots, [id]: snapshot }, currentSnapshotId: id, lastSerialized: JSON.stringify(snapshot) };
    }
    world.setResource(State, state);
  }
  return defineAtomicKit(NexusEngine, PERSISTENCE_DSK_DEFINITION, config, {
    resources: { State }, events: { Capture }, systems: [{ phase: "post", name: "persistenceDskSystem", system }],
    initWorld({ world }) { world.setResource(State, createInitialState()); },
    install({ engine, world }) { engine.persistence = { capture(label = "snapshot") { world.emit(Capture, { label }); return world.getResource(State); }, serialize() { return world.getResource(State)?.lastSerialized ?? JSON.stringify(world.getResource(State)); }, getState() { return world.getResource(State); } }; },
    bindings: { State }
  });
}

export function createHandAuthoringDsks(NexusEngine, config = {}) {
  const cfg = config ?? {};
  return [
    createWebXrHandAdapterDsk(NexusEngine, cfg.webxrHand ?? {}),
    createOpenXrHandAdapterDsk(NexusEngine, cfg.openxrHand ?? {}),
    createHandGestureDsk(NexusEngine, cfg.handGestures ?? {}),
    createSpatialSceneGraphDsk(NexusEngine, cfg.scene ?? {}),
    createSelectionDsk(NexusEngine, cfg.selection ?? {}),
    createTransformDsk(NexusEngine, cfg.transform ?? {}),
    createWidgetDsk(NexusEngine, cfg.widgets ?? {}),
    createInteractionDsk(NexusEngine, cfg.interactions ?? {}),
    createPersistenceDsk(NexusEngine, cfg.persistence ?? {})
  ];
}

export const createSpatialAuthoringKits = createHandAuthoringDsks;
export const createSpatialSceneGraphKit = createSpatialSceneGraphDsk;
export const createSelectionDomainServiceKit = createSelectionDsk;
export const createTransformDomainServiceKit = createTransformDsk;
export const createWidgetDomainServiceKit = createWidgetDsk;
export const createInteractionDomainServiceKit = createInteractionDsk;
export const createPersistenceDomainServiceKit = createPersistenceDsk;
export default createHandAuthoringDsks;
