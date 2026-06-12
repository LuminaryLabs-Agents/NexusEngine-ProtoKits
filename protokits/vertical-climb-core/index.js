import { clamp, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const VERTICAL_CLIMB_CORE_VERSION = "0.0.1";
const prefixed = (namespace, local) => `${namespace ?? "verticalClimb"}.${local}`;

export function createVerticalClimbDefinitions(nexusRealtime = {}, options = {}) {
  const namespace = options.namespace ?? "verticalClimb";
  const { component, resource, event } = createDefinitionFactory(nexusRealtime);
  const components = Object.freeze({
    Climber: component(prefixed(namespace, "climber")),
    ClimbPosition: component(prefixed(namespace, "position")),
    Ledge: component(prefixed(namespace, "ledge")),
    RopeAnchor: component(prefixed(namespace, "ropeAnchor")),
    RouteNode: component(prefixed(namespace, "routeNode")),
    SwingBody: component(prefixed(namespace, "swingBody")),
    CloudBand: component(prefixed(namespace, "cloudBand")),
    ClimbRenderable: component(prefixed(namespace, "renderable"))
  });
  const resources = Object.freeze({
    ClimbConfig: resource(prefixed(namespace, "config")),
    ClimbState: resource(prefixed(namespace, "state")),
    RouteState: resource(prefixed(namespace, "route")),
    SwingState: resource(prefixed(namespace, "swing")),
    AscentState: resource(prefixed(namespace, "ascent")),
    CloudState: resource(prefixed(namespace, "cloud")),
    InputState: resource(prefixed(namespace, "input")),
    RiskState: resource(prefixed(namespace, "risk")),
    CameraState: resource(prefixed(namespace, "camera")),
    FeedbackState: resource(prefixed(namespace, "feedback")),
    VisualTheme: resource(prefixed(namespace, "visualTheme"))
  });
  const events = Object.freeze({
    LedgeChosen: event(prefixed(namespace, "ledgeChosen")),
    LedgeReached: event(prefixed(namespace, "ledgeReached")),
    TargetHovered: event(prefixed(namespace, "targetHovered")),
    SwingInput: event(prefixed(namespace, "swingInput")),
    SwingStarted: event(prefixed(namespace, "swingStarted")),
    SwingReleased: event(prefixed(namespace, "swingReleased")),
    ClimberFell: event(prefixed(namespace, "climberFell")),
    ChunkGenerated: event(prefixed(namespace, "chunkGenerated")),
    CloudBandEntered: event(prefixed(namespace, "cloudBandEntered")),
    MilestoneReached: event(prefixed(namespace, "milestoneReached")),
    ClimbRestarted: event(prefixed(namespace, "restarted"))
  });
  return Object.freeze({ namespace, components, resources, events });
}

export function createDefaultClimbConfig(options = {}) {
  return {
    seed: options.seed ?? "next-ledge",
    mode: options.mode ?? "endless",
    overlayUi: options.overlayUi ?? false,
    staminaMax: number(options.staminaMax, 100),
    startingLedgeId: options.startingLedgeId ?? "ledge-000",
    world: { minX: -7, maxX: 7, startY: 0, ...(options.world ?? {}) },
    ...options
  };
}

export function createDefaultClimbState(options = {}) {
  const config = createDefaultClimbConfig(options);
  return {
    version: VERTICAL_CLIMB_CORE_VERSION,
    mode: options.initialMode ?? "ready",
    alive: true,
    completed: false,
    currentLedgeId: config.startingLedgeId,
    lastSafeLedgeId: config.startingLedgeId,
    selectedTargetId: null,
    hoveredTargetId: null,
    height: number(options.player?.y, config.world.startY),
    bestHeight: number(options.player?.y, config.world.startY),
    stamina: clamp(number(options.stamina, config.staminaMax), 0, config.staminaMax),
    staminaMax: config.staminaMax,
    player: { x: number(options.player?.x), y: number(options.player?.y, config.world.startY), z: number(options.player?.z), rotation: 0 },
    move: null,
    message: "",
    stats: { jumps: 0, falls: 0, restStops: 0, rejected: 0, milestones: [] }
  };
}

export function patchClimbState(state = {}, patch = {}) {
  const next = { ...state, ...patch, player: { ...(state.player ?? {}), ...(patch.player ?? {}) } };
  next.height = Math.max(number(next.height), number(next.player.y));
  next.bestHeight = Math.max(number(next.bestHeight), number(next.height));
  next.stamina = clamp(number(next.stamina, next.staminaMax), 0, number(next.staminaMax, 100));
  return next;
}

export function createVerticalClimbCore(nexusRealtime = {}, options = {}) {
  const definitions = createVerticalClimbDefinitions(nexusRealtime, options);
  const { resources, events, components } = definitions;
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "vertical-climb-core",
    components,
    resources: { ClimbConfig: resources.ClimbConfig, ClimbState: resources.ClimbState, VisualTheme: resources.VisualTheme },
    events,
    provides: ["vertical-climb-core", "vertical-climb"],
    bindings: { verticalClimbDefinitions: definitions },
    initWorld({ world }) {
      ensureResource(world, resources.ClimbConfig, () => createDefaultClimbConfig(options));
      ensureResource(world, resources.ClimbState, () => createDefaultClimbState(options));
      ensureResource(world, resources.VisualTheme, () => options.visualTheme ?? { id: "default-climb-theme" });
    },
    install({ engine, world }) {
      engine.verticalClimb = {
        definitions,
        getConfig: () => world.getResource(resources.ClimbConfig),
        getState: () => world.getResource(resources.ClimbState),
        setState(patch) {
          const next = patchClimbState(world.getResource(resources.ClimbState) ?? createDefaultClimbState(options), typeof patch === "function" ? patch(clone(world.getResource(resources.ClimbState))) : patch);
          world.setResource(resources.ClimbState, next);
          return next;
        },
        reset(overrides = {}) {
          const next = createDefaultClimbState({ ...options, ...overrides });
          world.setResource(resources.ClimbState, next);
          world.emit(events.ClimbRestarted, { state: next });
          return next;
        },
        snapshot: () => ({ config: clone(world.getResource(resources.ClimbConfig)), state: clone(world.getResource(resources.ClimbState)), visualTheme: clone(world.getResource(resources.VisualTheme)) })
      };
    },
    metadata: { version: VERTICAL_CLIMB_CORE_VERSION, purpose: "Shared definitions and base state for vertical climbing ProtoKits." }
  });
}
