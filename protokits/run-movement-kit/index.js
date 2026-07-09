import { approach, clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, getClockDelta, number } from "../protokit-core/index.js";

export const RUN_MOVEMENT_KIT_VERSION = "0.1.0";
export const RUN_MOVEMENT_ENGINE_NAMESPACE = "runMovement";

function normalizeLanePositions(value) {
  const lanes = Array.isArray(value) && value.length ? value.map((entry) => number(entry, 0)) : [-2.4, 0, 2.4];
  return lanes.length ? lanes : [-2.4, 0, 2.4];
}

function normalizeTuning(config = {}) {
  const lanePositions = normalizeLanePositions(config.lanePositions ?? config.lanes);
  return {
    actorId: String(config.actorId ?? "dino"),
    lanePositions,
    startLane: Math.max(0, Math.min(lanePositions.length - 1, Math.trunc(number(config.startLane, Math.floor(lanePositions.length / 2))))),
    baseForwardSpeed: Math.max(0, number(config.baseForwardSpeed ?? config.baseSpeed, 8.5)),
    maxForwardSpeed: Math.max(0, number(config.maxForwardSpeed ?? config.maxSpeed, 18)),
    speedRampPerSecond: Math.max(0, number(config.speedRampPerSecond, number(config.speedRampPerMinute, 1.15) / 60)),
    laneChangeEase: Math.max(0, number(config.laneChangeEase ?? config.laneEase, 16)),
    jumpGravity: Math.max(0, number(config.jumpGravity, 34)),
    jumpImpulse: Math.max(0, number(config.jumpImpulse, 13.5)),
    coyoteSeconds: Math.max(0, number(config.coyoteSeconds, 0.08)),
    inputBufferSeconds: Math.max(0, number(config.inputBufferSeconds, 0.12)),
    bankDegrees: number(config.bankDegrees, 11),
    active: config.active !== false
  };
}

function createController(config = {}, actorId = config.actorId ?? "dino") {
  const tuning = normalizeTuning({ ...config, actorId });
  const lane = tuning.startLane;
  return {
    actorId: String(actorId),
    lane,
    laneTarget: lane,
    laneX: tuning.lanePositions[lane] ?? 0,
    forwardSpeed: tuning.baseForwardSpeed,
    distance: 0,
    verticalVelocity: 0,
    height: 0,
    grounded: true,
    coyoteTimer: 0,
    jumpBuffer: 0,
    leanAmount: 0,
    animationPhase: 0,
    elapsed: 0,
    lastEvent: "attached"
  };
}

function createState(config = {}) {
  const tuning = normalizeTuning(config);
  const controller = createController(tuning, tuning.actorId);
  return {
    version: RUN_MOVEMENT_KIT_VERSION,
    tuning,
    controllers: { [controller.actorId]: controller },
    activeActorId: controller.actorId,
    descriptors: {},
    lastReason: "initialized"
  };
}

function getController(state, actorId) {
  const id = String(actorId ?? state.activeActorId ?? "dino");
  return state.controllers[id] ?? null;
}

function createDescriptors(controller, tuning) {
  if (!controller) return null;
  return {
    actorId: controller.actorId,
    transform: {
      x: controller.laneX,
      y: controller.height,
      z: controller.distance
    },
    motion: {
      forwardSpeed: controller.forwardSpeed,
      verticalVelocity: controller.verticalVelocity,
      grounded: controller.grounded,
      lane: controller.lane,
      laneTarget: controller.laneTarget,
      distance: controller.distance
    },
    animation: {
      phase: controller.animationPhase,
      lean: controller.leanAmount,
      grounded: controller.grounded,
      jumpHeight: controller.height
    },
    cameraTarget: {
      x: controller.laneX,
      y: controller.height + 1.2,
      z: controller.distance + 3,
      forwardSpeed: controller.forwardSpeed
    },
    tuning: clone(tuning)
  };
}

function setController(state, controller, reason = "updated") {
  const next = clone(state);
  next.controllers[controller.actorId] = controller;
  next.activeActorId = controller.actorId;
  next.descriptors[controller.actorId] = createDescriptors(controller, next.tuning);
  next.lastReason = reason;
  return next;
}

function moveLane(state, actorId, delta) {
  const controller = getController(state, actorId);
  if (!controller) return state;
  const tuning = state.tuning;
  const nextLane = Math.max(0, Math.min(tuning.lanePositions.length - 1, controller.laneTarget + delta));
  if (nextLane === controller.laneTarget) return state;
  return setController(state, { ...controller, laneTarget: nextLane, lastEvent: "laneChanged" }, "laneChanged");
}

function requestJump(state, actorId) {
  const controller = getController(state, actorId);
  if (!controller) return state;
  return setController(state, { ...controller, jumpBuffer: state.tuning.inputBufferSeconds, lastEvent: "jumpBuffered" }, "jumpBuffered");
}

export function stepRunMovementController(controller, tuningInput = {}, dtInput = 1 / 60) {
  const tuning = normalizeTuning(tuningInput);
  const dt = clamp(dtInput, 0, 0.1);
  const laneTarget = Math.max(0, Math.min(tuning.lanePositions.length - 1, Math.trunc(number(controller.laneTarget, controller.lane))));
  const targetX = tuning.lanePositions[laneTarget] ?? 0;
  const previousGrounded = Boolean(controller.grounded);
  let next = {
    ...controller,
    laneTarget,
    elapsed: number(controller.elapsed, 0) + dt,
    jumpBuffer: Math.max(0, number(controller.jumpBuffer, 0) - dt),
    coyoteTimer: Math.max(0, number(controller.coyoteTimer, 0) - dt)
  };

  next.forwardSpeed = Math.min(tuning.maxForwardSpeed, Math.max(tuning.baseForwardSpeed, number(next.forwardSpeed, tuning.baseForwardSpeed) + tuning.speedRampPerSecond * dt));
  next.distance = number(next.distance, 0) + next.forwardSpeed * dt;

  if (next.jumpBuffer > 0 && (next.grounded || next.coyoteTimer > 0)) {
    next.verticalVelocity = tuning.jumpImpulse;
    next.grounded = false;
    next.coyoteTimer = 0;
    next.jumpBuffer = 0;
    next.lastEvent = "jumped";
  }

  next.verticalVelocity = number(next.verticalVelocity, 0) - tuning.jumpGravity * dt;
  next.height = number(next.height, 0) + next.verticalVelocity * dt;
  if (next.height <= 0) {
    next.height = 0;
    next.verticalVelocity = 0;
    next.grounded = true;
    if (!previousGrounded) next.lastEvent = "landed";
  } else {
    next.grounded = false;
  }

  if (previousGrounded && !next.grounded && next.lastEvent !== "jumped") {
    next.coyoteTimer = tuning.coyoteSeconds;
  }

  const previousX = number(next.laneX, targetX);
  next.laneX = approach(previousX, targetX, tuning.laneChangeEase, dt);
  next.lane = laneTarget;
  const laneError = targetX - next.laneX;
  next.leanAmount = clamp(laneError, -1, 1) * tuning.bankDegrees;
  next.animationPhase = (number(next.animationPhase, 0) + next.forwardSpeed * dt * 0.18) % 1;
  if (!next.lastEvent || next.lastEvent === controller.lastEvent) next.lastEvent = "runMoved";
  return next;
}

function stepState(state, dt) {
  let next = clone(state);
  if (!next.tuning.active) return next;
  for (const controller of Object.values(next.controllers)) {
    const stepped = stepRunMovementController(controller, next.tuning, dt);
    next = setController(next, stepped, stepped.lastEvent ?? "runMoved");
  }
  return next;
}

function ensureNamespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[RUN_MOVEMENT_ENGINE_NAMESPACE] || typeof engine.n[RUN_MOVEMENT_ENGINE_NAMESPACE] !== "object") {
    engine.n[RUN_MOVEMENT_ENGINE_NAMESPACE] = {};
  }
  return engine.n[RUN_MOVEMENT_ENGINE_NAMESPACE];
}

export function createRunMovementDefinitions(NexusEngine = {}, options = {}) {
  const defs = createDefinitionFactory(NexusEngine);
  const prefix = options.namespace ?? "runMovement";
  return {
    resources: {
      RunMovementState: defs.resource(`${prefix}.state`)
    },
    events: {
      RunMoved: defs.event(`${prefix}.runMoved`),
      LaneChanged: defs.event(`${prefix}.laneChanged`),
      Jumped: defs.event(`${prefix}.jumped`),
      Landed: defs.event(`${prefix}.landed`),
      SpeedChanged: defs.event(`${prefix}.speedChanged`)
    }
  };
}

export function createRunMovementKit(NexusEngine = {}, options = {}) {
  const definitions = createRunMovementDefinitions(NexusEngine, options);
  const { resources, events } = definitions;

  function emitForLastEvent(world, controller) {
    const payload = { actorId: controller.actorId, lane: controller.lane, distance: controller.distance, height: controller.height, speed: controller.forwardSpeed };
    if (controller.lastEvent === "laneChanged") world.emit(events.LaneChanged, payload);
    else if (controller.lastEvent === "jumped") world.emit(events.Jumped, payload);
    else if (controller.lastEvent === "landed") world.emit(events.Landed, payload);
    else if (controller.lastEvent === "runMoved") world.emit(events.RunMoved, payload);
  }

  function system(world) {
    const state = world.getResource(resources.RunMovementState) ?? createState(options);
    const next = stepState(state, getClockDelta(world, 1 / 60));
    world.setResource(resources.RunMovementState, next);
    for (const controller of Object.values(next.controllers)) emitForLastEvent(world, controller);
  }

  return defineInjectedRuntimeKit(NexusEngine, {
    id: options.id ?? "run-movement-kit",
    resources,
    events,
    systems: [{ phase: options.phase ?? "simulate", name: "runMovementSystem", system }],
    provides: ["run:movement", "run:movement-controller", "run:movement-descriptors"],
    requires: [],
    initWorld({ world }) {
      const state = createState(options);
      world.setResource(resources.RunMovementState, state);
    },
    install({ engine, world }) {
      const namespace = ensureNamespace(engine);
      const api = {
        definitions,
        attach(actorId = options.actorId ?? "dino", patch = {}) {
          const state = world.getResource(resources.RunMovementState) ?? createState(options);
          const controller = createController({ ...state.tuning, ...patch }, actorId);
          const next = setController(state, controller, "attached");
          world.setResource(resources.RunMovementState, next);
          return clone(controller);
        },
        moveLeft(actorId) {
          const state = moveLane(world.getResource(resources.RunMovementState) ?? createState(options), actorId, -1);
          world.setResource(resources.RunMovementState, state);
          return clone(getController(state, actorId));
        },
        moveRight(actorId) {
          const state = moveLane(world.getResource(resources.RunMovementState) ?? createState(options), actorId, 1);
          world.setResource(resources.RunMovementState, state);
          return clone(getController(state, actorId));
        },
        jump(actorId) {
          const state = requestJump(world.getResource(resources.RunMovementState) ?? createState(options), actorId);
          world.setResource(resources.RunMovementState, state);
          return clone(getController(state, actorId));
        },
        tick(dt = 1 / 60) {
          const state = stepState(world.getResource(resources.RunMovementState) ?? createState(options), dt);
          world.setResource(resources.RunMovementState, state);
          return clone(state);
        },
        getController(actorId) {
          return clone(getController(world.getResource(resources.RunMovementState) ?? createState(options), actorId));
        },
        getDescriptors(actorId) {
          const state = world.getResource(resources.RunMovementState) ?? createState(options);
          if (actorId) return clone(state.descriptors[String(actorId)]);
          return clone(state.descriptors);
        },
        getSnapshot() {
          return clone(world.getResource(resources.RunMovementState) ?? createState(options));
        },
        snapshot() {
          return this.getSnapshot();
        },
        reset(patch = {}) {
          const state = createState({ ...options, ...patch });
          world.setResource(resources.RunMovementState, state);
          return clone(state);
        }
      };
      if (namespace) Object.assign(namespace, api);
      engine.runMovement = api;
    },
    metadata: {
      version: RUN_MOVEMENT_KIT_VERSION,
      domain: "run-movement",
      boundary: "Owns lane movement, forward speed, jump buffering, coyote time, gravity, grounded state, distance, lean, and animation/camera descriptors. Does not own collision, score, track spawning, scene transitions, renderer objects, browser input, Three.js, Canvas, or asset loading.",
      apiSurface: {
        methods: ["engine.n.runMovement.attach", "engine.n.runMovement.moveLeft", "engine.n.runMovement.moveRight", "engine.n.runMovement.jump", "engine.n.runMovement.tick", "engine.n.runMovement.getController", "engine.n.runMovement.getDescriptors", "engine.n.runMovement.getSnapshot", "engine.n.runMovement.reset"],
        events: ["runMovement.runMoved", "runMovement.laneChanged", "runMovement.jumped", "runMovement.landed", "runMovement.speedChanged"],
        resources: ["runMovement.state"]
      }
    }
  });
}

export default createRunMovementKit;
