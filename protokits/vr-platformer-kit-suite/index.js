import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const VR_PLATFORMER_KIT_SUITE_VERSION = "0.1.0";

const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const vec2 = (value = {}, fallback = {}) => ({ x: number(value.x, number(fallback.x, 0)), y: number(value.y, number(fallback.y, 0)) });
const vec3 = (value = {}, fallback = {}) => ({ x: number(value.x, number(fallback.x, 0)), y: number(value.y, number(fallback.y, 0)), z: number(value.z, number(fallback.z, 0)) });
const idMap = (items = []) => Object.fromEntries(asArray(items).filter((item) => item?.id).map((item) => [String(item.id), clone(item)]));

export const DEFAULT_PLATFORMER_LEVEL = Object.freeze({
  id: "vr-platformer-demo-level",
  width: 32,
  height: 12,
  spawn: { x: 1.5, y: 2.5 },
  exit: { id: "exit-1", x: 29, y: 3, w: 1, h: 2 },
  solids: [
    { id: "floor", x: 0, y: 0, w: 32, h: 1 },
    { id: "ledge-a", x: 5, y: 3, w: 5, h: 0.5 },
    { id: "ledge-b", x: 13, y: 5, w: 4, h: 0.5 },
    { id: "ledge-c", x: 21, y: 3.5, w: 6, h: 0.5 }
  ],
  hazards: [{ id: "pit-1", x: 10.5, y: 0.9, w: 2, h: 0.3 }],
  collectibles: [
    { id: "coin-1", x: 6.5, y: 4.1, value: 1 },
    { id: "coin-2", x: 14.5, y: 6.1, value: 1 },
    { id: "coin-3", x: 23.5, y: 4.6, value: 1 }
  ],
  movingPlatforms: [{ id: "lift-1", x: 17, y: 2, w: 3, h: 0.35, axis: "y", amplitude: 1.6, period: 3.2 }],
  parallaxLayers: [
    { id: "sky", depth: -0.08, speed: 0.05 },
    { id: "hills", depth: -0.04, speed: 0.18 },
    { id: "foreground", depth: 0.04, speed: 0.8 }
  ]
});

export function aabbIntersects(a = {}, b = {}) {
  return number(a.x) < number(b.x) + number(b.w) &&
    number(a.x) + number(a.w) > number(b.x) &&
    number(a.y) < number(b.y) + number(b.h) &&
    number(a.y) + number(a.h) > number(b.y);
}

function avatarBox(avatar = {}) {
  return { x: number(avatar.position?.x), y: number(avatar.position?.y), w: number(avatar.size?.x, 0.72), h: number(avatar.size?.y, 1.1) };
}

function defineKit(nexusRealtime, id, spec = {}) {
  return defineInjectedRuntimeKit(nexusRealtime, {
    id,
    metadata: { version: VR_PLATFORMER_KIT_SUITE_VERSION, status: "experimental", ...(spec.metadata ?? {}) },
    ...spec
  });
}

export function createPlatformerLevelDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const PlatformerLevelState = resource(options.resourceName ?? "platformerLevel.state");
  const PlatformerLevelLoaded = event("platformerLevel.loaded");
  const normalizeLevel = (level = DEFAULT_PLATFORMER_LEVEL) => ({ ...clone(DEFAULT_PLATFORMER_LEVEL), ...clone(level), solids: asArray(level.solids ?? DEFAULT_PLATFORMER_LEVEL.solids), hazards: asArray(level.hazards ?? DEFAULT_PLATFORMER_LEVEL.hazards), collectibles: asArray(level.collectibles ?? DEFAULT_PLATFORMER_LEVEL.collectibles), movingPlatforms: asArray(level.movingPlatforms ?? DEFAULT_PLATFORMER_LEVEL.movingPlatforms), parallaxLayers: asArray(level.parallaxLayers ?? DEFAULT_PLATFORMER_LEVEL.parallaxLayers) });
  const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, level: normalizeLevel(options.level), loadedLevelId: options.level?.id ?? DEFAULT_PLATFORMER_LEVEL.id });
  return defineKit(nexusRealtime, options.id ?? "platformer-level-domain-kit", {
    resources: { PlatformerLevelState }, events: { PlatformerLevelLoaded }, provides: ["platformer:level", "platformer:collision-map"],
    initWorld({ world }) { ensureResource(world, PlatformerLevelState, initial); },
    install({ engine, world }) { engine.platformerLevel = { getState: () => ensureResource(world, PlatformerLevelState, initial), load(level = {}) { const state = { version: VR_PLATFORMER_KIT_SUITE_VERSION, level: normalizeLevel(level), loadedLevelId: level.id ?? "level" }; world.setResource(PlatformerLevelState, state); world.emit(PlatformerLevelLoaded, { levelId: state.loadedLevelId }); return state; } }; },
    bindings: { PlatformerLevelState }, metadata: { purpose: "Declarative 2D platformer level data, collision map, hazards, collectibles, moving platforms, spawn, exit, and parallax descriptors." }
  });
}

export function createPlatformerAvatarDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const PlatformerAvatarState = resource(options.resourceName ?? "platformerAvatar.state");
  const MoveRequested = event("platformerAvatar.moveRequested");
  const JumpRequested = event("platformerAvatar.jumpRequested");
  const ResetRequested = event("platformerAvatar.resetRequested");
  const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, id: options.actorId ?? "player", mode: "ready", position: vec2(options.spawn ?? DEFAULT_PLATFORMER_LEVEL.spawn), previousPosition: vec2(options.spawn ?? DEFAULT_PLATFORMER_LEVEL.spawn), velocity: { x: 0, y: 0 }, size: vec2(options.size, { x: 0.72, y: 1.1 }), facing: 1, grounded: false, moveAxis: 0, jumpQueued: false, coyoteTimer: 0, jumpBuffer: 0, deaths: 0, checkpoints: [] });
  function system(world) { let state = ensureResource(world, PlatformerAvatarState, initial); for (const event of world.readEvents(MoveRequested)) { const axis = clamp(number(event.axis), -1, 1); state = { ...state, moveAxis: axis, facing: axis === 0 ? state.facing : Math.sign(axis) }; } for (const event of world.readEvents(JumpRequested)) { state = { ...state, jumpQueued: true, jumpBuffer: number(event.buffer, 0.12) }; } for (const event of world.readEvents(ResetRequested)) { state = { ...initial(), deaths: state.deaths + (event.countDeath === false ? 0 : 1) }; } world.setResource(PlatformerAvatarState, state); }
  return defineKit(nexusRealtime, options.id ?? "platformer-avatar-domain-kit", {
    resources: { PlatformerAvatarState }, events: { MoveRequested, JumpRequested, ResetRequested }, systems: [{ phase: "input", name: "platformerAvatarIntentSystem", system }], provides: ["platformer:avatar-state", "platformer:avatar-input"],
    initWorld({ world }) { ensureResource(world, PlatformerAvatarState, initial); },
    install({ engine, world }) { engine.platformerAvatar = { getState: () => ensureResource(world, PlatformerAvatarState, initial), move(axis = 0) { world.emit(MoveRequested, { axis }); return world.getResource(PlatformerAvatarState); }, jump(payload = {}) { world.emit(JumpRequested, payload); return world.getResource(PlatformerAvatarState); }, reset(payload = {}) { world.emit(ResetRequested, payload); return world.getResource(PlatformerAvatarState); } }; },
    bindings: { PlatformerAvatarState }, metadata: { purpose: "2D avatar intent/state surface for a VR-viewed platformer." }
  });
}

export function createPlatformerCollisionDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const CollisionState = resource(options.resourceName ?? "platformerCollision.state");
  const CollisionResolved = event("platformerCollision.resolved");
  const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, contacts: [], hazardHits: [], exitHits: [], grounded: false });
  return defineKit(nexusRealtime, options.id ?? "platformer-collision-domain-kit", {
    resources: { CollisionState }, events: { CollisionResolved }, provides: ["platformer:collision", "platformer:hazards", "platformer:exit-triggers"], requires: ["platformer:level", "platformer:avatar-state"],
    initWorld({ world }) { ensureResource(world, CollisionState, initial); },
    install({ engine, world }) { engine.platformerCollision = { getState: () => ensureResource(world, CollisionState, initial), resolve(avatar = {}, level = {}) { const box = avatarBox(avatar); const contacts = asArray(level.solids).filter((solid) => aabbIntersects(box, solid)).map((solid) => solid.id); const hazardHits = asArray(level.hazards).filter((hazard) => aabbIntersects(box, hazard)).map((hazard) => hazard.id); const exitHits = level.exit && aabbIntersects(box, level.exit) ? [level.exit.id ?? "exit"] : []; const state = { version: VR_PLATFORMER_KIT_SUITE_VERSION, contacts, hazardHits, exitHits, grounded: contacts.length > 0 }; world.setResource(CollisionState, state); world.emit(CollisionResolved, clone(state)); return state; } }; },
    bindings: { CollisionState }, metadata: { purpose: "Collision meaning for solids, hazards, exits, checkpoints, and object triggers." }
  });
}

export function createPlatformerPhysicsSystemKit(nexusRealtime = {}, options = {}) {
  const { event } = createDefinitionFactory(nexusRealtime);
  const PhysicsStep = event("platformerPhysics.step");
  const PlatformerLanded = event("platformerPhysics.landed");
  const PlatformerFell = event("platformerPhysics.fell");
  const cfg = { gravity: -34, moveAcceleration: 82, maxSpeed: 7.5, friction: 34, jumpVelocity: 13.2, coyoteTime: 0.1, jumpBuffer: 0.12, terminalVelocity: -28, ...(options.physics ?? options) };
  function system(world) {
    const avatarResource = world.resources?.PlatformerAvatarState ?? null;
    void avatarResource;
  }
  return defineKit(nexusRealtime, options.id ?? "platformer-physics-system-kit", {
    events: { PhysicsStep, PlatformerLanded, PlatformerFell }, systems: [{ phase: "simulate", name: "platformerPhysicsMarkerSystem", system }], provides: ["platformer:physics"], requires: ["platformer:avatar-state", "platformer:level"],
    install({ engine }) { engine.platformerPhysics = { config: () => clone(cfg), simulateStep(avatar = {}, level = {}, dt = 1 / 60) { return simulatePlatformerStep(avatar, level, dt, cfg); } }; },
    metadata: { purpose: "Hot-loop 2D platformer physics rules: acceleration, gravity, jump buffer, coyote time, terminal velocity, and collision correction." }
  });
}

export function simulatePlatformerStep(avatar = {}, level = DEFAULT_PLATFORMER_LEVEL, dt = 1 / 60, config = {}) {
  const cfg = { gravity: -34, moveAcceleration: 82, maxSpeed: 7.5, friction: 34, jumpVelocity: 13.2, coyoteTime: 0.1, jumpBuffer: 0.12, terminalVelocity: -28, ...config };
  const next = clone(avatar);
  next.previousPosition = vec2(next.position);
  next.velocity = vec2(next.velocity);
  next.position = vec2(next.position);
  next.coyoteTimer = next.grounded ? cfg.coyoteTime : Math.max(0, number(next.coyoteTimer) - dt);
  next.jumpBuffer = next.jumpQueued ? cfg.jumpBuffer : Math.max(0, number(next.jumpBuffer) - dt);
  if (Math.abs(number(next.moveAxis)) > 0.001) next.velocity.x = clamp(number(next.velocity.x) + number(next.moveAxis) * cfg.moveAcceleration * dt, -cfg.maxSpeed, cfg.maxSpeed);
  else next.velocity.x = Math.abs(number(next.velocity.x)) <= cfg.friction * dt ? 0 : number(next.velocity.x) - Math.sign(number(next.velocity.x)) * cfg.friction * dt;
  if (number(next.jumpBuffer) > 0 && number(next.coyoteTimer) > 0) { next.velocity.y = cfg.jumpVelocity; next.jumpBuffer = 0; next.coyoteTimer = 0; next.grounded = false; next.mode = "jumping"; }
  next.jumpQueued = false;
  next.velocity.y = Math.max(cfg.terminalVelocity, number(next.velocity.y) + cfg.gravity * dt);
  next.position.x += number(next.velocity.x) * dt;
  next.position.y += number(next.velocity.y) * dt;
  next.grounded = false;
  const box = avatarBox(next);
  for (const solid of asArray(level.solids)) {
    if (!aabbIntersects(box, solid)) continue;
    const prevBottom = number(next.previousPosition.y);
    const solidTop = number(solid.y) + number(solid.h);
    if (prevBottom >= solidTop - 0.05 && number(next.velocity.y) <= 0) { next.position.y = solidTop; next.velocity.y = 0; next.grounded = true; next.mode = "grounded"; }
  }
  if (next.position.y < -6) next.mode = "fallen";
  return next;
}

export function createPlatformerObjectDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const ObjectState = resource(options.resourceName ?? "platformerObjects.state");
  const CoinCollected = event("platformerObject.coinCollected");
  const HazardTriggered = event("platformerObject.hazardTriggered");
  const ExitReached = event("platformerObject.exitReached");
  const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, collectedIds: [], score: 0, lastEvent: null, objectMap: idMap(options.objects ?? []) });
  return defineKit(nexusRealtime, options.id ?? "platformer-object-domain-kit", { resources: { ObjectState }, events: { CoinCollected, HazardTriggered, ExitReached }, provides: ["platformer:objects", "platformer:collectibles", "platformer:hazard-events"], requires: ["platformer:level", "platformer:avatar-state"], initWorld({ world }) { ensureResource(world, ObjectState, initial); }, install({ engine, world }) { engine.platformerObjects = { getState: () => ensureResource(world, ObjectState, initial), collect(id, value = 1) { const s = ensureResource(world, ObjectState, initial); if (s.collectedIds.includes(id)) return s; const next = { ...s, collectedIds: [...s.collectedIds, id], score: s.score + number(value, 1), lastEvent: { type: "coin", id } }; world.setResource(ObjectState, next); world.emit(CoinCollected, { id, value }); return next; }, hazard(id) { const s = ensureResource(world, ObjectState, initial); const next = { ...s, lastEvent: { type: "hazard", id } }; world.setResource(ObjectState, next); world.emit(HazardTriggered, { id }); return next; }, exit(id = "exit") { const s = ensureResource(world, ObjectState, initial); const next = { ...s, lastEvent: { type: "exit", id } }; world.setResource(ObjectState, next); world.emit(ExitReached, { id }); return next; } }; }, bindings: { ObjectState }, metadata: { purpose: "Coins, hazards, exits, springs, moving platforms, and lightweight interactable platformer objects." } });
}

export function createPlatformerCameraDomainKit(nexusRealtime = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusRealtime);
  const CameraState = resource(options.resourceName ?? "platformerCamera.state");
  const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, position: vec2(options.position), zoom: number(options.zoom, 32), deadZone: vec2(options.deadZone, { x: 3, y: 1.8 }), lookAhead: number(options.lookAhead, 2.4), shake: 0, bounds: options.bounds ?? null });
  return defineKit(nexusRealtime, options.id ?? "platformer-camera-domain-kit", { resources: { CameraState }, provides: ["platformer:camera-2d"], initWorld({ world }) { ensureResource(world, CameraState, initial); }, install({ engine, world }) { engine.platformerCamera = { getState: () => ensureResource(world, CameraState, initial), updateFromAvatar(avatar = {}, level = DEFAULT_PLATFORMER_LEVEL) { const s = ensureResource(world, CameraState, initial); const facing = number(avatar.facing, 1); const target = { x: number(avatar.position?.x) + facing * s.lookAhead, y: number(avatar.position?.y) + 1.2 }; const next = { ...s, position: { x: target.x, y: target.y }, bounds: { x: 0, y: 0, w: number(level.width, 32), h: number(level.height, 12) } }; world.setResource(CameraState, next); return next; }, shake(amount = 0.15) { const next = { ...ensureResource(world, CameraState, initial), shake: Math.max(0, number(amount)) }; world.setResource(CameraState, next); return next; } }; }, bindings: { CameraState }, metadata: { purpose: "2D board camera descriptors for follow, look-ahead, bounds, zoom, and shake." } });
}

export function createPlatformerRenderDescriptorKit(nexusRealtime = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusRealtime);
  const RenderState = resource(options.resourceName ?? "platformerRender.state");
  const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, descriptors: [], resolution: options.resolution ?? { width: 320, height: 180 }, palette: options.palette ?? "neon-arcade" });
  function buildDescriptors({ avatar = {}, level = DEFAULT_PLATFORMER_LEVEL, objects = {}, camera = {} } = {}) { return [
    ...asArray(level.parallaxLayers).map((layer) => ({ type: "parallax-layer", ...clone(layer) })),
    ...asArray(level.solids).map((solid) => ({ type: "solid", ...clone(solid), material: "platform" })),
    ...asArray(level.movingPlatforms).map((platform) => ({ type: "moving-platform", ...clone(platform), material: "moving-platform" })),
    ...asArray(level.collectibles).filter((coin) => !objects.collectedIds?.includes(coin.id)).map((coin) => ({ type: "collectible", ...clone(coin), material: "coin" })),
    ...asArray(level.hazards).map((hazard) => ({ type: "hazard", ...clone(hazard), material: "hazard" })),
    { type: "exit", ...(level.exit ?? { id: "exit", x: 30, y: 1, w: 1, h: 2 }), material: "exit" },
    { type: "avatar", id: avatar.id ?? "player", x: number(avatar.position?.x), y: number(avatar.position?.y), w: number(avatar.size?.x, 0.72), h: number(avatar.size?.y, 1.1), mode: avatar.mode ?? "ready", facing: avatar.facing ?? 1 },
    { type: "camera", ...clone(camera) }
  ]; }
  return defineKit(nexusRealtime, options.id ?? "platformer-render-descriptor-kit", { resources: { RenderState }, provides: ["platformer:render-descriptors"], requires: ["platformer:level", "platformer:avatar-state"], initWorld({ world }) { ensureResource(world, RenderState, initial); }, install({ engine, world }) { engine.platformerRender = { getState: () => ensureResource(world, RenderState, initial), build(snapshot = {}) { const s = ensureResource(world, RenderState, initial); const next = { ...s, descriptors: buildDescriptors(snapshot), lastBuildFrame: snapshot.frameId ?? null }; world.setResource(RenderState, next); return next; } }; }, bindings: { RenderState }, metadata: { purpose: "Renderer-neutral 2D platformer descriptors for drawing to Canvas, texture, or VR board." } });
}

export function createPlatformerEffectsDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime); const EffectsState = resource("platformerEffects.state"); const EffectSpawned = event("platformerEffects.spawned"); const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, effects: [] }); return defineKit(nexusRealtime, options.id ?? "platformer-effects-domain-kit", { resources: { EffectsState }, events: { EffectSpawned }, provides: ["platformer:effects"], initWorld({ world }) { ensureResource(world, EffectsState, initial); }, install({ engine, world }) { engine.platformerEffects = { getState: () => ensureResource(world, EffectsState, initial), spawn(type, position = {}, extra = {}) { const s = ensureResource(world, EffectsState, initial); const effect = { id: `effect-${s.effects.length + 1}`, type, position: vec2(position), ttl: number(extra.ttl, 0.6), ...clone(extra) }; const next = { ...s, effects: [...s.effects.slice(-63), effect] }; world.setResource(EffectsState, next); world.emit(EffectSpawned, effect); return next; } }; }, bindings: { EffectsState }, metadata: { purpose: "Jump puffs, landing dust, coin sparks, hazard bursts, checkpoint glow, and camera-shake descriptors." } });
}

export function createPlatformerParallaxDomainKit(nexusRealtime = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusRealtime); const ParallaxState = resource("platformerParallax.state"); const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, layers: clone(options.layers ?? DEFAULT_PLATFORMER_LEVEL.parallaxLayers) }); return defineKit(nexusRealtime, options.id ?? "platformer-parallax-domain-kit", { resources: { ParallaxState }, provides: ["platformer:parallax"], initWorld({ world }) { ensureResource(world, ParallaxState, initial); }, install({ engine, world }) { engine.platformerParallax = { getState: () => ensureResource(world, ParallaxState, initial), project(camera = {}) { const s = ensureResource(world, ParallaxState, initial); return s.layers.map((layer) => ({ ...layer, offsetX: -number(camera.position?.x) * number(layer.speed, 0.1), offsetY: -number(camera.position?.y) * number(layer.speed, 0.1) })); } }; }, bindings: { ParallaxState }, metadata: { purpose: "Board-relative parallax layer descriptors for stage-like VR depth without changing 2D gameplay." } });
}

export function createPlatformerObjectiveSequenceKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime); const SequenceState = resource("platformerSequence.state"); const SequenceAdvanced = event("platformerSequence.advanced"); const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, nodeId: "start", hint: "Run, jump, collect, reach the gate", complete: false, failed: false, collectedTarget: number(options.collectedTarget, 3) }); return defineKit(nexusRealtime, options.id ?? "platformer-objective-sequence-kit", { resources: { SequenceState }, events: { SequenceAdvanced }, provides: ["platformer:sequence", "platformer:objective-flow"], initWorld({ world }) { ensureResource(world, SequenceState, initial); }, install({ engine, world }) { engine.platformerSequence = { getState: () => ensureResource(world, SequenceState, initial), evaluate({ objects = {}, avatar = {} } = {}) { const s = ensureResource(world, SequenceState, initial); let next = s; if (avatar.mode === "fallen") next = { ...s, nodeId: "recover", hint: "Fell — restart or use checkpoint", failed: true }; else if (objects.lastEvent?.type === "exit" && number(objects.score) >= s.collectedTarget) next = { ...s, nodeId: "complete", hint: "Level complete", complete: true, failed: false }; else if (number(objects.score) >= s.collectedTarget) next = { ...s, nodeId: "find-exit", hint: "Gate is ready" }; else next = { ...s, nodeId: "collect", hint: `${objects.score ?? 0}/${s.collectedTarget} coins` }; world.setResource(SequenceState, next); if (next.nodeId !== s.nodeId) world.emit(SequenceAdvanced, { from: s.nodeId, to: next.nodeId }); return next; }, reset() { const next = initial(); world.setResource(SequenceState, next); return next; } }; }, bindings: { SequenceState }, metadata: { purpose: "Designer-facing objective and tutorial flow for the VR platformer board." } });
}

export function createXrPoseDomainKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime); const XrPoseState = resource("xrPose.state"); const PoseSubmitted = event("xrPose.submitted"); const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, referenceSpace: options.referenceSpace ?? "local-floor", head: { position: { x: 0, y: 1.6, z: 0 }, forward: { x: 0, y: 0, z: -1 }, up: { x: 0, y: 1, z: 0 } }, controllers: {}, pointerRays: {}, confidence: 1 }); return defineKit(nexusRealtime, options.id ?? "xr-pose-domain-kit", { resources: { XrPoseState }, events: { PoseSubmitted }, provides: ["xr:head-pose", "xr:controller-pose", "xr:pointer-ray"], initWorld({ world }) { ensureResource(world, XrPoseState, initial); }, install({ engine, world }) { engine.xrPose = { getState: () => ensureResource(world, XrPoseState, initial), submit(frame = {}) { const s = ensureResource(world, XrPoseState, initial); const next = { ...s, ...clone(frame), head: { ...s.head, ...(frame.head ?? {}) }, controllers: { ...s.controllers, ...(frame.controllers ?? {}) }, pointerRays: { ...s.pointerRays, ...(frame.pointerRays ?? {}) } }; world.setResource(XrPoseState, next); world.emit(PoseSubmitted, clone(next)); return next; } }; }, bindings: { XrPoseState }, metadata: { purpose: "Normalized 6DOF head/controller poses and pointer rays without storing raw XR runtime objects." } });
}

export function createXrInputAdapterKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime); const XrInputState = resource("xrInput.state"); const XrInputMapped = event("xrInput.mapped"); const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, moveAxis: 0, jumpPressed: false, restartPressed: false, selectPressed: false, lastFrame: null }); return defineKit(nexusRealtime, options.id ?? "xr-input-adapter-kit", { resources: { XrInputState }, events: { XrInputMapped }, provides: ["xr:platformer-input"], requires: ["platformer:avatar-input"], initWorld({ world }) { ensureResource(world, XrInputState, initial); }, install({ engine, world }) { engine.xrInput = { getState: () => ensureResource(world, XrInputState, initial), submit(input = {}) { const moveAxis = clamp(number(input.thumbstick?.x ?? input.axisX ?? input.moveAxis), -1, 1); const mapped = { version: VR_PLATFORMER_KIT_SUITE_VERSION, moveAxis, jumpPressed: Boolean(input.buttons?.a ?? input.buttons?.trigger ?? input.jumpPressed), restartPressed: Boolean(input.buttons?.b ?? input.restartPressed), selectPressed: Boolean(input.buttons?.select ?? input.selectPressed), lastFrame: clone(input) }; world.setResource(XrInputState, mapped); world.emit(XrInputMapped, mapped); engine.platformerAvatar?.move?.(mapped.moveAxis); if (mapped.jumpPressed) engine.platformerAvatar?.jump?.(); if (mapped.restartPressed) engine.platformerAvatar?.reset?.(); return mapped; } }; }, bindings: { XrInputState }, metadata: { purpose: "Maps XR controller/hand/gamepad input into platformer move, jump, restart, and select actions." } });
}

export function createSpatialAnchorDomainKit(nexusRealtime = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusRealtime); const SpatialAnchorState = resource("spatialAnchor.state"); const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, id: options.anchorId ?? "platformer-board-anchor", referenceSpace: options.referenceSpace ?? "local-floor", pose: { position: vec3(options.position, { x: 0, y: 1.45, z: -1.8 }), rotation: vec3(options.rotation) }, persistence: options.persistence ?? "session" }); return defineKit(nexusRealtime, options.id ?? "spatial-anchor-domain-kit", { resources: { SpatialAnchorState }, provides: ["spatial:anchor"], initWorld({ world }) { ensureResource(world, SpatialAnchorState, initial); }, install({ engine, world }) { engine.spatialAnchor = { getState: () => ensureResource(world, SpatialAnchorState, initial), recenter(head = {}) { const next = { ...ensureResource(world, SpatialAnchorState, initial), pose: { position: addVec3(vec3(head.position), { x: 0, y: -0.05, z: -1.8 }), rotation: vec3(head.rotation) } }; world.setResource(SpatialAnchorState, next); return next; }, setPose(pose = {}) { const next = { ...ensureResource(world, SpatialAnchorState, initial), pose: clone(pose) }; world.setResource(SpatialAnchorState, next); return next; } }; }, bindings: { SpatialAnchorState }, metadata: { purpose: "Session or persistent spatial anchor for the floating platformer board." } });
}

function addVec3(a = {}, b = {}) { return { x: number(a.x) + number(b.x), y: number(a.y) + number(b.y), z: number(a.z) + number(b.z) }; }

export function createSpatialGameBoardDomainKit(nexusRealtime = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusRealtime); const BoardState = resource("spatialGameBoard.state"); const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, boardId: options.boardId ?? "platformer-board", pose: { position: vec3(options.position, { x: 0, y: 1.45, z: -1.8 }), rotation: vec3(options.rotation) }, sizeMeters: vec2(options.sizeMeters, { x: 1.6, y: 0.9 }), gameResolution: options.gameResolution ?? { width: 320, height: 180 }, pixelsPerMeter: number(options.pixelsPerMeter, 200), comfortDistance: number(options.comfortDistance, 1.8) }); return defineKit(nexusRealtime, options.id ?? "spatial-game-board-domain-kit", { resources: { BoardState }, provides: ["spatial:game-board", "spatial:board-to-game-transform"], requires: ["spatial:anchor"], initWorld({ world }) { ensureResource(world, BoardState, initial); }, install({ engine, world }) { engine.spatialGameBoard = { getState: () => ensureResource(world, BoardState, initial), setBoardPose(pose = {}) { const next = { ...ensureResource(world, BoardState, initial), pose: clone(pose) }; world.setResource(BoardState, next); return next; }, boardToGame(point = {}) { const s = ensureResource(world, BoardState, initial); return { x: (number(point.x) / s.sizeMeters.x + 0.5) * s.gameResolution.width, y: (0.5 - number(point.y) / s.sizeMeters.y) * s.gameResolution.height }; }, gameToBoard(point = {}) { const s = ensureResource(world, BoardState, initial); return { x: (number(point.x) / s.gameResolution.width - 0.5) * s.sizeMeters.x, y: (0.5 - number(point.y) / s.gameResolution.height) * s.sizeMeters.y, z: 0 }; } }; }, bindings: { BoardState }, metadata: { purpose: "Floating VR game board transform: world meters to 2D game pixels and back." } });
}

export function createXrComfortDomainKit(nexusRealtime = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusRealtime); const ComfortState = resource("xrComfort.state"); const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, minDistance: number(options.minDistance, 1.2), maxDistance: number(options.maxDistance, 3.0), maxAngularSize: number(options.maxAngularSize, 60), warnings: [] }); return defineKit(nexusRealtime, options.id ?? "xr-comfort-domain-kit", { resources: { ComfortState }, provides: ["xr:comfort-policy"], initWorld({ world }) { ensureResource(world, ComfortState, initial); }, install({ engine, world }) { engine.xrComfort = { getState: () => ensureResource(world, ComfortState, initial), evaluate({ head = {}, board = {} } = {}) { const s = ensureResource(world, ComfortState, initial); const dist = Math.hypot(number(board.pose?.position?.x) - number(head.position?.x), number(board.pose?.position?.y) - number(head.position?.y), number(board.pose?.position?.z) - number(head.position?.z)); const warnings = []; if (dist < s.minDistance) warnings.push("board-too-close"); if (dist > s.maxDistance) warnings.push("board-too-far"); const next = { ...s, distance: dist, warnings }; world.setResource(ComfortState, next); return next; } }; }, bindings: { ComfortState }, metadata: { purpose: "VR comfort policy for floating game board distance, size, and recenter warnings." } });
}

export function createXrPlatformerRenderAdapterKit(nexusRealtime = {}, options = {}) {
  const { resource } = createDefinitionFactory(nexusRealtime); const AdapterState = resource("xrPlatformerRenderAdapter.state"); const initial = () => ({ version: VR_PLATFORMER_KIT_SUITE_VERSION, backend: options.backend ?? "webxr-three-or-canvas", drawPlan: null }); return defineKit(nexusRealtime, options.id ?? "xr-platformer-render-adapter-kit", { resources: { AdapterState }, provides: ["xr:platformer-render-plan"], requires: ["platformer:render-descriptors", "spatial:game-board", "render:stereoscopic-views"], initWorld({ world }) { ensureResource(world, AdapterState, initial); }, install({ engine, world }) { engine.xrPlatformerRenderAdapter = { getState: () => ensureResource(world, AdapterState, initial), compose({ render = {}, board = {}, stereo = {}, parallax = [], effects = [], sequence = {} } = {}) { const next = { ...ensureResource(world, AdapterState, initial), drawPlan: { board: clone(board), stereoViews: clone(stereo.views ?? []), renderTexture: { resolution: render.resolution ?? { width: 320, height: 180 }, descriptors: clone(render.descriptors ?? []) }, parallax: clone(parallax), effects: clone(effects), sequenceHint: sequence.hint ?? null } }; world.setResource(AdapterState, next); return next; } }; }, bindings: { AdapterState }, metadata: { purpose: "Renderer adapter descriptor that composes platformer render descriptors, spatial board state, stereo views, effects, and sequence hints into one XR draw plan." } });
}

export function createVrPlatformerMaximumFeatureKits(nexusRealtime = {}, options = {}) {
  return [
    createPlatformerLevelDomainKit(nexusRealtime, options.level ?? options),
    createPlatformerAvatarDomainKit(nexusRealtime, options.avatar ?? options),
    createPlatformerCollisionDomainKit(nexusRealtime, options.collision ?? options),
    createPlatformerPhysicsSystemKit(nexusRealtime, options.physics ?? options),
    createPlatformerObjectDomainKit(nexusRealtime, options.objects ?? options),
    createPlatformerCameraDomainKit(nexusRealtime, options.camera ?? options),
    createPlatformerRenderDescriptorKit(nexusRealtime, options.render ?? options),
    createPlatformerEffectsDomainKit(nexusRealtime, options.effects ?? options),
    createPlatformerParallaxDomainKit(nexusRealtime, options.parallax ?? options),
    createPlatformerObjectiveSequenceKit(nexusRealtime, options.sequence ?? options),
    createXrPoseDomainKit(nexusRealtime, options.xrPose ?? options),
    createXrInputAdapterKit(nexusRealtime, options.xrInput ?? options),
    createSpatialAnchorDomainKit(nexusRealtime, options.anchor ?? options),
    createSpatialGameBoardDomainKit(nexusRealtime, options.board ?? options),
    createXrComfortDomainKit(nexusRealtime, options.comfort ?? options),
    createXrPlatformerRenderAdapterKit(nexusRealtime, options.adapter ?? options)
  ];
}

export function stepVrPlatformerComposition(engine, dt = 1 / 60) {
  const level = engine.platformerLevel?.getState?.()?.level ?? clone(DEFAULT_PLATFORMER_LEVEL);
  let avatar = engine.platformerAvatar?.getState?.();
  if (engine.platformerPhysics?.simulateStep && avatar) {
    avatar = engine.platformerPhysics.simulateStep(avatar, level, dt);
  }
  const collisions = engine.platformerCollision?.resolve?.(avatar, level);
  for (const coin of asArray(level.collectibles)) if (!engine.platformerObjects?.getState?.()?.collectedIds?.includes(coin.id) && aabbIntersects(avatarBox(avatar), { x: coin.x - 0.25, y: coin.y - 0.25, w: 0.5, h: 0.5 })) engine.platformerObjects?.collect?.(coin.id, coin.value ?? 1);
  for (const hazardId of collisions?.hazardHits ?? []) engine.platformerObjects?.hazard?.(hazardId);
  for (const exitId of collisions?.exitHits ?? []) engine.platformerObjects?.exit?.(exitId);
  const camera = engine.platformerCamera?.updateFromAvatar?.(avatar, level);
  const objects = engine.platformerObjects?.getState?.();
  const sequence = engine.platformerSequence?.evaluate?.({ objects, avatar });
  const render = engine.platformerRender?.build?.({ avatar, level, objects, camera });
  const parallax = engine.platformerParallax?.project?.(camera);
  const board = engine.spatialGameBoard?.getState?.();
  const xrPose = engine.xrPose?.getState?.();
  const comfort = engine.xrComfort?.evaluate?.({ head: xrPose?.head, board });
  const stereo = engine.stereoscopicRender?.updateFromCamera?.({ position: xrPose?.head?.position, forward: xrPose?.head?.forward, up: xrPose?.head?.up }, dt);
  const adapter = engine.xrPlatformerRenderAdapter?.compose?.({ render, board, stereo, parallax, effects: engine.platformerEffects?.getState?.()?.effects, sequence });
  return { level, avatar, collisions, objects, camera, sequence, render, parallax, board, xrPose, comfort, stereo, adapter };
}

export default createVrPlatformerMaximumFeatureKits;
