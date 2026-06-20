export const ONNX_WORKSHOP_THREEJS_KITS_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const list = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const safeId = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;
const frameOf = (world) => Number(world?.__nexusClock?.frame ?? 0);
const vec3 = (value = {}, fallback = {}) => ({ x: number(value.x, number(fallback.x, 0)), y: number(value.y, number(fallback.y, 0)), z: number(value.z, number(fallback.z, 0)) });
const makeTransform = (value = {}) => ({ position: vec3(value.position ?? value), rotation: vec3(value.rotation), scale: vec3(value.scale, { x: 1, y: 1, z: 1 }) });
const easeOutCubic = (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
const lerpVec3 = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) });
const lerpTransform = (a, b, t) => ({ position: lerpVec3(a.position, b.position, t), rotation: lerpVec3(a.rotation, b.rotation, t), scale: lerpVec3(a.scale, b.scale, t) });

function requireNexus(NexusRealtime, kitId) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`${kitId} requires NexusRealtime.${key}.`);
  }
}

function buildKit(NexusRealtime, { id, resourceName, provides, events, initialState, install, metadata }) {
  requireNexus(NexusRealtime, id);
  const State = NexusRealtime.defineResource(resourceName);
  const Ev = Object.fromEntries(events.map((eventName) => [eventName.replace(/(^|\.)([a-z])/g, (_, p, c) => p + c.toUpperCase()).replace(/\./g, ""), NexusRealtime.defineEvent(eventName)]));
  return NexusRealtime.defineRuntimeKit({
    id,
    provides,
    resources: { State },
    events: Ev,
    systems: [],
    initWorld({ world }) { world.setResource(State, initialState()); },
    install(context) { install?.({ ...context, State, Ev, initialState }); },
    metadata: { version: ONNX_WORKSHOP_THREEJS_KITS_VERSION, ...metadata }
  });
}

export function createWoundBoxMesh({ width = 1, height = 1, depth = 1 } = {}) {
  const x = width / 2, y = height / 2, z = depth / 2;
  const vertices = [[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]];
  const indices = [0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7];
  return { kind: "wound-triangle-mesh", primitive: false, vertices, indices, groups: [{ name: "box", start: 0, count: indices.length }] };
}

export function createRingTubeMesh({ length = 1, radius = 0.08, radialSegments = 12, lengthSegments = 3 } = {}) {
  const vertices = [];
  for (let i = 0; i <= lengthSegments; i++) {
    const x = -length / 2 + length * i / lengthSegments;
    for (let j = 0; j < radialSegments; j++) {
      const a = Math.PI * 2 * j / radialSegments;
      vertices.push([x, Math.cos(a) * radius, Math.sin(a) * radius]);
    }
  }
  const indices = [];
  for (let i = 0; i < lengthSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * radialSegments + j, b = i * radialSegments + ((j + 1) % radialSegments), c = (i + 1) * radialSegments + j, d = (i + 1) * radialSegments + ((j + 1) % radialSegments);
      indices.push(a, c, b, b, c, d);
    }
  }
  return { kind: "wound-triangle-mesh", primitive: false, vertices, indices, groups: [{ name: "tube", start: 0, count: indices.length }] };
}

export function createHelixRibbonMesh({ turns = 5, radius = 0.18, pitch = 0.08, width = 0.035, segments = 96 } = {}) {
  const vertices = [];
  for (let i = 0; i <= segments; i++) {
    const t = Math.PI * 2 * turns * i / segments;
    vertices.push([Math.cos(t) * radius, pitch * t / (Math.PI * 2), Math.sin(t) * radius]);
    vertices.push([Math.cos(t) * (radius + width), pitch * t / (Math.PI * 2), Math.sin(t) * (radius + width)]);
  }
  const indices = [];
  for (let i = 0; i < segments; i++) { const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3; indices.push(a, c, b, b, c, d); }
  return { kind: "wound-triangle-mesh", primitive: false, vertices, indices, groups: [{ name: "helix-ribbon", start: 0, count: indices.length }] };
}

export function createGearDiscMesh({ teeth = 18, rootRadius = 0.34, outerRadius = 0.46, width = 0.08 } = {}) {
  const rings = teeth * 2, vertices = [];
  for (const y of [-width / 2, width / 2]) {
    for (let i = 0; i < rings; i++) { const r = i % 2 ? outerRadius : rootRadius, a = Math.PI * 2 * i / rings; vertices.push([Math.cos(a) * r, y, Math.sin(a) * r]); }
  }
  const indices = [];
  for (let i = 0; i < rings; i++) { const n = (i + 1) % rings, a = i, b = n, c = rings + i, d = rings + n; indices.push(a, c, b, b, c, d); }
  return { kind: "wound-triangle-mesh", primitive: false, vertices, indices, groups: [{ name: "gear-disc", start: 0, count: indices.length }] };
}

function socket(id, position, compatible = []) { return { id, position: vec3(position), compatibleTypes: list(compatible), status: "idle" }; }

export const DEFAULT_WORKSHOP_OBJECTS = [
  { id: "onnx-core", label: "ONNX Core", type: "onnx-core", domain: "model", spawn: { position: { x: 0, y: 1.15, z: -1.35 }, scale: { x: 1.05, y: 1.05, z: 1.05 } }, reviewActions: ["what-model", "run-suggestion", "view-last-output"], compatibleTypes: ["prompt-card", "output-tray"], mesh: "core-device" },
  { id: "goal-block", label: "Goal Block", type: "goal-block", domain: "prompt", spawn: { position: { x: -1.5, y: 0.95, z: -0.95 } }, reviewActions: ["edit-goal", "ask-companion", "send-to-onnx"], compatibleTypes: ["prompt-card", "onnx-core"], mesh: "wood-block" },
  { id: "prompt-card", label: "Prompt Card", type: "prompt-card", domain: "prompt", spawn: { position: { x: 1.45, y: 0.98, z: -0.98 } }, reviewActions: ["edit-prompt", "add-constraint", "send-to-onnx"], compatibleTypes: ["constraint-clamp", "onnx-core"], mesh: "card" },
  { id: "output-tray", label: "Output Tray", type: "output-tray", domain: "output", spawn: { position: { x: 0, y: 0.82, z: -0.28 } }, reviewActions: ["view-output", "replay", "export"], compatibleTypes: ["onnx-core", "physics-prop"], mesh: "tray" },
  { id: "hammer", label: "Hammer", type: "hammer", domain: "tool", spawn: { position: { x: -2.2, y: 2.25, z: -2.05 }, rotation: { z: -0.2 } }, reviewActions: ["what-is-this", "show-parts", "run-impact-review", "connect-compatible"], compatibleTypes: ["force-gauge", "mass-block", "output-tray"], physics: { mass: 0.72, handleLength: 0.42 }, mesh: "hammer" },
  { id: "screwdriver", label: "Screwdriver", type: "screwdriver", domain: "tool", spawn: { position: { x: -1.35, y: 2.28, z: -2.05 }, rotation: { z: 0.1 } }, reviewActions: ["what-is-this", "run-torque-review", "connect-screw"], compatibleTypes: ["screw", "output-tray"], physics: { handleRadius: 0.08, torqueArm: 0.11 }, mesh: "screwdriver" },
  { id: "screw", label: "Screw", type: "screw", domain: "fastener", spawn: { position: { x: -0.65, y: 2.3, z: -2.05 }, rotation: { z: 1.57 } }, reviewActions: ["what-is-this", "show-thread-pitch", "rotation-to-translation"], compatibleTypes: ["screwdriver", "wood-block"], physics: { pitch: 0.035, radius: 0.025 }, mesh: "screw" },
  { id: "wrench", label: "Wrench", type: "wrench", domain: "tool", spawn: { position: { x: 0.25, y: 2.25, z: -2.05 }, rotation: { z: 0.25 } }, reviewActions: ["what-is-this", "show-torque-arm", "connect-bolt"], compatibleTypes: ["bolt", "nut"], physics: { length: 0.38 }, mesh: "wrench" },
  { id: "lever", label: "Lever", type: "lever", domain: "physics-prop", spawn: { position: { x: 1.35, y: 2.05, z: -2.05 }, rotation: { z: 0.0 } }, reviewActions: ["show-torque", "connect-force-gauge", "run-leverage-test"], compatibleTypes: ["force-gauge", "mass-block", "output-tray"], physics: { inputArm: 0.72, outputArm: 0.28 }, mesh: "lever" },
  { id: "spring", label: "Spring", type: "spring", domain: "physics-prop", spawn: { position: { x: 2.2, y: 2.05, z: -2.05 }, rotation: { z: 1.57 } }, reviewActions: ["show-stiffness", "stretch-test", "graph-force-displacement"], compatibleTypes: ["mass-block", "force-gauge", "output-tray"], physics: { stiffness: 32, restLength: 0.45 }, mesh: "spring" },
  { id: "pulley", label: "Pulley", type: "pulley", domain: "physics-prop", spawn: { position: { x: -2.3, y: 1.38, z: -2.05 } }, reviewActions: ["what-is-this", "show-mechanical-advantage", "connect-rope"], compatibleTypes: ["rope", "mass-block"], physics: { supportedSegments: 2 }, mesh: "pulley" },
  { id: "mass-block", label: "Mass Block", type: "mass-block", domain: "physics-prop", spawn: { position: { x: 1.9, y: 0.95, z: -1.2 } }, reviewActions: ["show-mass", "connect-spring", "connect-lever"], compatibleTypes: ["spring", "lever", "force-gauge"], physics: { mass: 1.5 }, mesh: "mass-block" },
  { id: "force-gauge", label: "Force Gauge", type: "force-gauge", domain: "measurement", spawn: { position: { x: 2.55, y: 1.35, z: -1.92 } }, reviewActions: ["read-force", "connect-physics-prop", "show-needle"], compatibleTypes: ["hammer", "lever", "spring", "mass-block"], physics: { maxForce: 100, value: 0 }, mesh: "gauge" }
];

export function createOnnxWorkshopSceneDomainKit(NexusRealtime, config = {}) {
  return buildKit(NexusRealtime, {
    id: config.kitId ?? "onnx-workshop-scene-domain-kit",
    resourceName: config.resourceName ?? "onnxWorkshop.scene",
    provides: ["onnx-workshop:scene", "workshop:physical-objects", "render:three-workshop-descriptors"],
    events: ["onnxWorkshop.objectRegistered", "onnxWorkshop.sceneReset"],
    initialState: () => ({ version: ONNX_WORKSHOP_THREEJS_KITS_VERSION, room: clone(config.room ?? { width: 6.2, depth: 5.2, height: 3.1 }), objects: {}, order: [], descriptors: [] }),
    install({ world, engine, State, Ev, initialState }) {
      function descriptor(object) { return { id: object.id, label: object.label, type: object.type, domain: object.domain, transform: object.currentTransform, mesh: object.meshDescriptor, material: object.material, sockets: object.sockets, selectable: true, state: object.state, physics: object.physics, reviewActions: object.reviewActions, compatibleTypes: object.compatibleTypes }; }
      function refresh(state) { state.descriptors = state.order.map((oid) => descriptor(state.objects[oid])); return state; }
      engine.onnxWorkshopScene = {
        registerObject(input = {}) {
          const state = world.getResource(State) ?? initialState();
          const objectId = safeId(input.id, `object-${state.order.length + 1}`);
          const spawnTransform = makeTransform(input.spawn ?? input.spawnTransform ?? input.transform ?? {});
          const object = {
            id: objectId,
            label: input.label ?? objectId,
            type: input.type ?? "workshop-object",
            domain: input.domain ?? "workshop",
            tags: list(input.tags),
            spawnTransform,
            currentTransform: clone(spawnTransform),
            reviewTransform: makeTransform(input.reviewTransform ?? config.reviewTransform ?? { position: { x: 0, y: 1.45, z: 0.75 }, scale: { x: 1.45, y: 1.45, z: 1.45 } }),
            meshDescriptor: input.meshDescriptor ?? { kind: "procedural-workshop-object", meshType: input.mesh ?? input.type ?? "box" },
            material: input.material ?? { kind: "workshop-material", palette: input.domain ?? "workshop" },
            sockets: list(input.sockets).length ? list(input.sockets) : [socket("in", { x: -0.12, y: 0, z: 0 }, input.compatibleTypes), socket("out", { x: 0.12, y: 0, z: 0 }, input.compatibleTypes)],
            physics: clone(input.physics ?? {}),
            state: "idle",
            selected: false,
            hover: false,
            reviewActions: list(input.reviewActions),
            compatibleTypes: list(input.compatibleTypes),
            motion: null,
            lastInspection: null
          };
          const next = refresh({ ...state, objects: { ...state.objects, [objectId]: object }, order: [...state.order.filter((x) => x !== objectId), objectId] });
          world.setResource(State, next);
          world.emit(Ev.OnnxWorkshopObjectRegistered, { object });
          return clone(object);
        },
        installDefaultObjects() { for (const item of (config.objects ?? DEFAULT_WORKSHOP_OBJECTS)) this.registerObject(item); return this.getState(); },
        patchObject(objectId, patch = {}) { const state = world.getResource(State) ?? initialState(); const object = state.objects[objectId]; if (!object) return null; const nextObject = { ...object, ...clone(patch), currentTransform: patch.currentTransform ? makeTransform(patch.currentTransform) : object.currentTransform }; const next = refresh({ ...state, objects: { ...state.objects, [objectId]: nextObject } }); world.setResource(State, next); return clone(nextObject); },
        getObject(objectId) { return clone((world.getResource(State) ?? initialState()).objects[objectId] ?? null); },
        listObjects() { const state = world.getResource(State) ?? initialState(); return clone(state.order.map((oid) => state.objects[oid])); },
        getDescriptors() { return clone((world.getResource(State) ?? initialState()).descriptors); },
        getState() { return clone(world.getResource(State)); },
        reset() { const state = initialState(); world.setResource(State, state); world.emit(Ev.OnnxWorkshopSceneReset, {}); return clone(state); }
      };
      if (config.installDefaults !== false) engine.onnxWorkshopScene.installDefaultObjects();
    },
    metadata: { purpose: "Physical workshop interior and object descriptor registry for high-fidelity Three.js ONNX lab scenes." }
  });
}

export function createWorkshopObjectReviewDomainKit(NexusRealtime, config = {}) {
  return buildKit(NexusRealtime, {
    id: config.kitId ?? "workshop-object-review-domain-kit",
    resourceName: config.resourceName ?? "onnxWorkshop.review",
    provides: ["workshop:object-review", "workshop:selected-object", "workshop:review-motion"],
    events: ["workshopReview.entered", "workshopReview.exited", "workshopReview.hovered", "workshopReview.actionRequested"],
    initialState: () => ({ version: ONNX_WORKSHOP_THREEJS_KITS_VERSION, selectedObjectId: null, hoverObjectId: null, mode: "normal", reviewTokens: [], history: [] }),
    install({ world, engine, State, Ev, initialState }) {
      function set(state) { world.setResource(State, state); return clone(state); }
      function getObject(id) { return engine.onnxWorkshopScene?.getObject?.(id); }
      engine.workshopReview = {
        hover(objectId) { const state = world.getResource(State) ?? initialState(); set({ ...state, hoverObjectId: objectId ?? null }); if (objectId) engine.onnxWorkshopScene?.patchObject?.(objectId, { hover: true }); world.emit(Ev.WorkshopReviewHovered, { objectId }); return this.getState(); },
        enter(objectId, options = {}) { const object = getObject(objectId); if (!object) return null; const state = world.getResource(State) ?? initialState(); if (state.selectedObjectId && state.selectedObjectId !== objectId) this.exit({ reason: "switch-object" }); const reviewTokens = list(options.actions ?? object.reviewActions).map((action, index) => ({ id: `${objectId}.token.${action}`, objectId, action, label: String(action).replace(/-/g, " "), slot: index, state: "idle" })); engine.onnxWorkshopScene.patchObject(objectId, { selected: true, hover: false, state: "reviewing", motion: { kind: "enter-review", t: 0, source: object.currentTransform, target: object.reviewTransform } }); const next = { ...state, selectedObjectId: objectId, hoverObjectId: null, mode: "review", reviewTokens, history: [{ event: "enter", objectId, frame: frameOf(world) }, ...state.history].slice(0, 32) }; world.emit(Ev.WorkshopReviewEntered, { objectId, reviewTokens }); return set(next); },
        exit(options = {}) { const state = world.getResource(State) ?? initialState(); const objectId = state.selectedObjectId; if (!objectId) return this.getState(); const object = getObject(objectId); if (object) engine.onnxWorkshopScene.patchObject(objectId, { selected: false, hover: false, state: "returning", motion: { kind: "return-spawn", t: 0, source: object.currentTransform, target: object.spawnTransform } }); const next = { ...state, selectedObjectId: null, mode: "normal", reviewTokens: [], history: [{ event: "exit", objectId, reason: options.reason ?? "click-away", frame: frameOf(world) }, ...state.history].slice(0, 32) }; world.emit(Ev.WorkshopReviewExited, { objectId, reason: options.reason ?? "click-away" }); return set(next); },
        requestAction(action, payload = {}) { const state = world.getResource(State) ?? initialState(); const objectId = payload.objectId ?? state.selectedObjectId; const object = getObject(objectId); if (!object) return null; const packet = { id: `review-action-${state.history.length + 1}`, objectId, action, objectType: object.type, domain: object.domain, physics: clone(object.physics), frame: frameOf(world), payload: clone(payload) }; const next = { ...state, history: [{ event: "action", ...packet }, ...state.history].slice(0, 32) }; world.emit(Ev.WorkshopReviewActionRequested, packet); return set(next); },
        updateMotion(dt = 1 / 60) { const objects = engine.onnxWorkshopScene?.listObjects?.() ?? []; for (const object of objects) { if (!object.motion) continue; const t = Math.min(1, number(object.motion.t) + dt * (config.motionSpeed ?? 3.5)); const eased = object.motion.kind === "return-spawn" ? easeInOutCubic(t) : easeOutCubic(t); const currentTransform = lerpTransform(object.motion.source, object.motion.target, eased); const done = t >= 1; engine.onnxWorkshopScene.patchObject(object.id, { currentTransform, state: done ? (object.motion.kind === "return-spawn" ? "idle" : "reviewing") : object.state, motion: done ? null : { ...object.motion, t } }); } return this.getState(); },
        getReviewTokens() { return clone((world.getResource(State) ?? initialState()).reviewTokens); },
        getSelectedObject() { const state = world.getResource(State) ?? initialState(); return state.selectedObjectId ? getObject(state.selectedObjectId) : null; },
        getState() { return clone(world.getResource(State)); }
      };
    },
    metadata: { purpose: "Click-to-review selected objects, center-hover review pose, review tokens, and click-away return to spawn." }
  });
}

export function createWorkshopCompanionVisionDomainKit(NexusRealtime, config = {}) {
  return buildKit(NexusRealtime, {
    id: config.kitId ?? "workshop-companion-vision-domain-kit",
    resourceName: config.resourceName ?? "onnxWorkshop.companionVision",
    provides: ["workshop:companion-vision", "onnx:object-question", "workshop:inspection-result"],
    events: ["companionVision.inspected", "companionVision.answered"],
    initialState: () => ({ version: ONNX_WORKSHOP_THREEJS_KITS_VERSION, inspections: [], answers: [] }),
    install({ world, engine, State, Ev, initialState }) {
      function answerFor(object, question = "what is this?") {
        const type = object?.type ?? "object";
        const base = {
          hammer: "This hammer is an impact object. It is useful for impulse, striking, and force transfer reviews.",
          screw: "This screw turns rotation into linear travel through its thread pitch.",
          screwdriver: "This screwdriver is a torque input object. Connect it to a screw to show rotation becoming translation.",
          lever: "This lever demonstrates torque. Connect force gauge and mass block to compare arm lengths.",
          spring: "This spring demonstrates stiffness, displacement, and stored elastic energy.",
          pulley: "This pulley redirects rope tension and can demonstrate mechanical advantage.",
          "onnx-core": "This ONNX core is the model machine. It receives prompt objects and returns suggestions or reviews.",
          "prompt-card": "This prompt card is a physical prompt packet. Send it to the ONNX core or clamp it with constraints."
        };
        return base[type] ?? `This is a ${type}. I can inspect it, suggest compatible connections, or use it in the graph.`;
      }
      engine.companionVision = {
        inspectSelected(question = "what is this?", options = {}) { const object = engine.workshopReview?.getSelectedObject?.(); if (!object) return null; return this.inspectObject(object.id, question, options); },
        inspectObject(objectId, question = "what is this?", options = {}) { const object = engine.onnxWorkshopScene?.getObject?.(objectId); if (!object) return null; const state = world.getResource(State) ?? initialState(); const labels = [object.type, object.domain, ...list(object.tags), ...(object.meshDescriptor?.meshType ? [object.meshDescriptor.meshType] : [])]; const inspection = { id: `inspection-${state.inspections.length + 1}`, objectId, question, visualLabels: labels, confidence: options.confidence ?? 0.82, imageCrop: clone(options.imageCrop ?? null), metadata: { objectType: object.type, physics: clone(object.physics), compatibleTypes: clone(object.compatibleTypes) }, frame: frameOf(world) }; const answer = { id: `answer-${state.answers.length + 1}`, objectId, question, text: options.text ?? answerFor(object, question), suggestedActions: clone(object.reviewActions), compatibleTypes: clone(object.compatibleTypes), frame: frameOf(world) }; const next = { ...state, inspections: [inspection, ...state.inspections].slice(0, 64), answers: [answer, ...state.answers].slice(0, 64) }; world.setResource(State, next); world.emit(Ev.CompanionVisionInspected, inspection); world.emit(Ev.CompanionVisionAnswered, answer); return clone({ inspection, answer }); },
        getLatestAnswer() { return clone((world.getResource(State) ?? initialState()).answers[0] ?? null); },
        getState() { return clone(world.getResource(State)); }
      };
    },
    metadata: { purpose: "Object-aware ONNX companion review packets combining selection, object metadata, image-crop labels, and question answers." }
  });
}

export function createWorkshopSignalFlowDomainKit(NexusRealtime, config = {}) {
  return buildKit(NexusRealtime, {
    id: config.kitId ?? "workshop-signal-flow-domain-kit",
    resourceName: config.resourceName ?? "onnxWorkshop.signalFlow",
    provides: ["workshop:connections", "workshop:data-packets", "render:flow-descriptors"],
    events: ["signalFlow.connected", "signalFlow.packetStarted", "signalFlow.packetCompleted"],
    initialState: () => ({ version: ONNX_WORKSHOP_THREEJS_KITS_VERSION, connections: [], packets: [] }),
    install({ world, engine, State, Ev, initialState }) {
      engine.workshopSignalFlow = {
        connect(fromObjectId, toObjectId, payload = {}) { const state = world.getResource(State) ?? initialState(); const from = engine.onnxWorkshopScene?.getObject?.(fromObjectId); const to = engine.onnxWorkshopScene?.getObject?.(toObjectId); if (!from || !to) return null; const compatible = from.compatibleTypes.includes(to.type) || to.compatibleTypes.includes(from.type) || payload.force === true; const connection = { id: payload.id ?? `connection-${state.connections.length + 1}`, fromObjectId, toObjectId, compatible, status: compatible ? "valid" : "invalid", style: compatible ? "green-flow" : "red-spark", frame: frameOf(world), metadata: clone(payload.metadata ?? {}) }; const next = { ...state, connections: [connection, ...state.connections].slice(0, 64) }; world.setResource(State, next); world.emit(Ev.SignalFlowConnected, connection); return clone(connection); },
        startPacket(connectionId, payload = {}) { const state = world.getResource(State) ?? initialState(); const connection = state.connections.find((item) => item.id === connectionId); if (!connection) return null; const packet = { id: payload.id ?? `packet-${state.packets.length + 1}`, connectionId, fromObjectId: connection.fromObjectId, toObjectId: connection.toObjectId, t: 0, speed: number(payload.speed, 0.8), status: "moving", kind: payload.kind ?? "prompt-data", frame: frameOf(world) }; const next = { ...state, packets: [packet, ...state.packets].slice(0, 96) }; world.setResource(State, next); world.emit(Ev.SignalFlowPacketStarted, packet); return clone(packet); },
        updatePackets(dt = 1 / 60) { const state = world.getResource(State) ?? initialState(); const packets = state.packets.map((packet) => packet.status === "moving" ? { ...packet, t: Math.min(1, packet.t + packet.speed * dt), status: packet.t + packet.speed * dt >= 1 ? "complete" : "moving" } : packet); world.setResource(State, { ...state, packets }); for (const packet of packets.filter((p) => p.status === "complete" && !p.completedEmitted)) world.emit(Ev.SignalFlowPacketCompleted, packet); return clone(packets); },
        getDescriptors() { return clone(world.getResource(State) ?? initialState()); },
        getState() { return clone(world.getResource(State)); }
      };
    },
    metadata: { purpose: "Physical cables, socket compatibility, animated data packets, and valid/invalid connection descriptors." }
  });
}

export function createWorkshopThreeRenderPlanDomainKit(NexusRealtime, config = {}) {
  return buildKit(NexusRealtime, {
    id: config.kitId ?? "workshop-three-render-plan-domain-kit",
    resourceName: config.resourceName ?? "onnxWorkshop.threePlan",
    provides: ["render:three-workshop-plan", "render:wound-triangle-mesh-plan", "render:walkable-workshop"],
    events: ["workshopThreePlan.built"],
    initialState: () => ({ version: ONNX_WORKSHOP_THREEJS_KITS_VERSION, plans: [], lastPlan: null }),
    install({ world, engine, State, Ev, initialState }) {
      engine.workshopThreePlan = {
        buildPlan(options = {}) { const state = world.getResource(State) ?? initialState(); const plan = { id: options.id ?? `workshop-plan-${state.plans.length + 1}`, camera: clone(options.camera ?? { mode: "first-person", position: { x: 0, y: 1.62, z: 2.7 }, yaw: 0, pitch: 0 }), lighting: clone(config.lighting ?? { key: "warm-window", fill: "blue-bounce", ambient: 0.45, shadows: true }), room: clone(engine.onnxWorkshopScene?.getState?.()?.room ?? {}), objects: clone(engine.onnxWorkshopScene?.getDescriptors?.() ?? []), review: clone(engine.workshopReview?.getState?.() ?? {}), reviewTokens: clone(engine.workshopReview?.getReviewTokens?.() ?? []), flow: clone(engine.workshopSignalFlow?.getDescriptors?.() ?? {}), companion: clone(engine.companionVision?.getLatestAnswer?.() ?? null), meshLibrary: { box: createWoundBoxMesh(), tube: createRingTubeMesh(), screwThread: createHelixRibbonMesh(), gear: createGearDiscMesh() }, quality: clone(options.quality ?? config.quality ?? { antialias: true, dprCap: 2, bloom: true, contactShadows: true, anisotropy: 8 }), builtAtFrame: frameOf(world) }; const next = { ...state, plans: [plan, ...state.plans].slice(0, 12), lastPlan: plan }; world.setResource(State, next); world.emit(Ev.WorkshopThreePlanBuilt, { plan }); return clone(plan); },
        getState() { return clone(world.getResource(State)); }
      };
    },
    metadata: { purpose: "Backend-neutral but Three.js-ready plan for high-fidelity walkable ONNX companion workshop rendering." }
  });
}

export function createOnnxWorkshopThreeJsKits(NexusRealtime, config = {}) {
  return [
    createOnnxWorkshopSceneDomainKit(NexusRealtime, config.scene ?? {}),
    createWorkshopObjectReviewDomainKit(NexusRealtime, config.review ?? {}),
    createWorkshopCompanionVisionDomainKit(NexusRealtime, config.companionVision ?? {}),
    createWorkshopSignalFlowDomainKit(NexusRealtime, config.signalFlow ?? {}),
    createWorkshopThreeRenderPlanDomainKit(NexusRealtime, config.threePlan ?? {})
  ];
}

export default createOnnxWorkshopThreeJsKits;
