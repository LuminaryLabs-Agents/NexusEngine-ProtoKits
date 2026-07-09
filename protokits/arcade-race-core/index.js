export const ARCADE_RACE_CORE_VERSION = "0.0.1";

export function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

export function approach(current, target, rate, delta) {
  return lerp(number(current), number(target), 1 - Math.exp(-Math.max(0, rate) * Math.max(0, delta)));
}

export function normalize2(x, z) {
  const length = Math.hypot(number(x), number(z));
  if (length <= 0.000001) return { x: 0, z: 0, length: 0 };
  return { x: number(x) / length, z: number(z) / length, length };
}

export function distance2(a, b) {
  return Math.hypot(number(a?.x) - number(b?.x), number(a?.z ?? a?.y) - number(b?.z ?? b?.y));
}

export function speed2(velocity) {
  return Math.hypot(number(velocity?.x), number(velocity?.z ?? velocity?.y));
}

export function signed(value) {
  return value < 0 ? -1 : 1;
}

export function getClockDelta(world, fallback = 1 / 60) {
  return clamp(number(world?.__nexusClock?.delta, fallback), 0, 0.1);
}

export function getClockElapsed(world, fallback = 0) {
  return number(world?.__nexusClock?.elapsed, fallback);
}

export function defineInjectedRuntimeKit(nexusEngine = {}, config = {}) {
  if (typeof nexusEngine.defineRuntimeKit === "function") {
    return nexusEngine.defineRuntimeKit(config);
  }

  return Object.freeze({
    id: config.id ?? "runtime-kit",
    components: config.components ?? {},
    resources: config.resources ?? {},
    events: config.events ?? {},
    systems: (config.systems ?? []).map((entry) => (
      typeof entry === "function"
        ? { phase: "simulate", system: entry, name: entry.name || "anonymousSystem" }
        : {
            phase: entry.phase ?? "simulate",
            system: entry.system,
            name: entry.name ?? entry.system?.name ?? "anonymousSystem"
          }
    )),
    shaders: config.shaders ?? [],
    materials: config.materials ?? [],
    sequences: config.sequences ?? [],
    subscriptions: config.subscriptions ?? [],
    requires: Array.isArray(config.requires) ? config.requires.slice() : config.requires ? [config.requires] : [],
    provides: Array.isArray(config.provides) ? config.provides.slice() : config.provides ? [config.provides] : [],
    bindings: Object.freeze({ ...(config.bindings ?? {}) }),
    initWorld: config.initWorld,
    install: config.install,
    metadata: Object.freeze({ ...(config.metadata ?? {}) })
  });
}

function createFallbackDefinition(kind, name) {
  return Object.freeze({ kind, name });
}

function getCommonDefinitions(nexusEngine = {}) {
  if (typeof nexusEngine.getCommonGameDefinitions === "function") {
    return nexusEngine.getCommonGameDefinitions();
  }

  return {
    components: nexusEngine.CommonGameComponents ?? {},
    resources: nexusEngine.CommonGameResources ?? {},
    events: nexusEngine.CommonGameEvents ?? {}
  };
}

function prefixedName(namespace, localName) {
  const cleanNamespace = String(namespace || "arcade-race").trim();
  return cleanNamespace ? `${cleanNamespace}-${localName}` : localName;
}

export function createArcadeRaceDefinitions(nexusEngine = {}, options = {}) {
  const common = getCommonDefinitions(nexusEngine);
  const namespace = options.namespace ?? "arcade-race";
  const defineComponent = nexusEngine.defineComponent ?? ((name) => createFallbackDefinition("component", name));
  const defineResource = nexusEngine.defineResource ?? ((name) => createFallbackDefinition("resource", name));
  const defineEvent = nexusEngine.defineEvent ?? ((name) => createFallbackDefinition("event", name));
  const providedComponents = options.components ?? {};
  const providedResources = options.resources ?? {};
  const providedEvents = options.events ?? {};

  const components = Object.freeze({
    Position: providedComponents.Position ?? common.components?.Position ?? defineComponent("position"),
    Velocity: providedComponents.Velocity ?? common.components?.Velocity ?? defineComponent("velocity"),
    Transform: providedComponents.Transform ?? common.components?.Transform ?? defineComponent("transform"),
    Collider: providedComponents.Collider ?? common.components?.Collider ?? defineComponent("collider"),
    Renderable: providedComponents.Renderable ?? common.components?.Renderable ?? defineComponent("renderable"),
    NavigationAgent: providedComponents.NavigationAgent ?? common.components?.NavigationAgent ?? defineComponent("navigation-agent"),
    NavigationTarget: providedComponents.NavigationTarget ?? common.components?.NavigationTarget ?? defineComponent("navigation-target"),
    NavigationObstacle: providedComponents.NavigationObstacle ?? common.components?.NavigationObstacle ?? defineComponent("navigation-obstacle"),
    InputIntent: providedComponents.InputIntent ?? defineComponent("inputIntent"),
    Racer: providedComponents.Racer ?? defineComponent(prefixedName(namespace, "racer")),
    PlayerRacer: providedComponents.PlayerRacer ?? defineComponent(prefixedName(namespace, "player-racer")),
    AIRacer: providedComponents.AIRacer ?? defineComponent(prefixedName(namespace, "ai-racer")),
    TrackProgress: providedComponents.TrackProgress ?? defineComponent(prefixedName(namespace, "track-progress")),
    RacePlacement: providedComponents.RacePlacement ?? defineComponent(prefixedName(namespace, "race-placement")),
    SlopeTraversal: providedComponents.SlopeTraversal ?? defineComponent(prefixedName(namespace, "slope-traversal")),
    SurfaceContact: providedComponents.SurfaceContact ?? defineComponent(prefixedName(namespace, "surface-contact")),
    DriftState: providedComponents.DriftState ?? defineComponent(prefixedName(namespace, "drift-state")),
    CrashState: providedComponents.CrashState ?? defineComponent(prefixedName(namespace, "crash-state")),
    BoostState: providedComponents.BoostState ?? defineComponent(prefixedName(namespace, "boost-state")),
    AIDriver: providedComponents.AIDriver ?? defineComponent(prefixedName(namespace, "ai-driver")),
    AIRouteIntent: providedComponents.AIRouteIntent ?? defineComponent(prefixedName(namespace, "ai-route-intent")),
    DifficultyTuning: providedComponents.DifficultyTuning ?? defineComponent(prefixedName(namespace, "difficulty-tuning")),
    RaceHazard: providedComponents.RaceHazard ?? defineComponent(prefixedName(namespace, "hazard")),
    HazardCollider: providedComponents.HazardCollider ?? defineComponent(prefixedName(namespace, "hazard-collider")),
    BoostPad: providedComponents.BoostPad ?? defineComponent(prefixedName(namespace, "boost-pad")),
    RacerContact: providedComponents.RacerContact ?? defineComponent(prefixedName(namespace, "racer-contact")),
    PacingState: providedComponents.PacingState ?? defineComponent(prefixedName(namespace, "pacing-state")),
    CourseSection: providedComponents.CourseSection ?? defineComponent(prefixedName(namespace, "course-section")),
    CourseMarker: providedComponents.CourseMarker ?? defineComponent(prefixedName(namespace, "course-marker")),
    RaceVisual: providedComponents.RaceVisual ?? defineComponent(prefixedName(namespace, "visual"))
  });

  const resources = Object.freeze({
    Time: providedResources.Time ?? common.resources?.Time ?? defineResource("time"),
    GameState: providedResources.GameState ?? common.resources?.GameState ?? defineResource("game-state"),
    RaceState: providedResources.RaceState ?? defineResource(prefixedName(namespace, "state")),
    RaceConfig: providedResources.RaceConfig ?? defineResource(prefixedName(namespace, "config")),
    RoundState: providedResources.RoundState ?? defineResource(prefixedName(namespace, "round")),
    DifficultyState: providedResources.DifficultyState ?? defineResource(prefixedName(namespace, "difficulty")),
    CourseState: providedResources.CourseState ?? defineResource(prefixedName(namespace, "course")),
    CourseDirectorState: providedResources.CourseDirectorState ?? defineResource(prefixedName(namespace, "course-director")),
    PacingState: providedResources.PacingState ?? defineResource(prefixedName(namespace, "pacing")),
    VisualTheme: providedResources.VisualTheme ?? defineResource(prefixedName(namespace, "visual-theme"))
  });

  const events = Object.freeze({
    RaceCountdownStarted: providedEvents.RaceCountdownStarted ?? defineEvent(prefixedName(namespace, "countdown-started")),
    RaceStarted: providedEvents.RaceStarted ?? defineEvent(prefixedName(namespace, "started")),
    RaceFinished: providedEvents.RaceFinished ?? defineEvent(prefixedName(namespace, "finished")),
    RacerRegistered: providedEvents.RacerRegistered ?? defineEvent(prefixedName(namespace, "racer-registered")),
    RacerFinished: providedEvents.RacerFinished ?? defineEvent(prefixedName(namespace, "racer-finished")),
    PlacementChanged: providedEvents.PlacementChanged ?? defineEvent(prefixedName(namespace, "placement-changed")),
    RoundAdvanced: providedEvents.RoundAdvanced ?? defineEvent(prefixedName(namespace, "round-advanced")),
    RaceWon: providedEvents.RaceWon ?? defineEvent(prefixedName(namespace, "won")),
    RaceLost: providedEvents.RaceLost ?? defineEvent(prefixedName(namespace, "lost")),
    TraversalStateChanged: providedEvents.TraversalStateChanged ?? defineEvent(prefixedName(namespace, "traversal-state-changed")),
    RacerCrash: providedEvents.RacerCrash ?? defineEvent(prefixedName(namespace, "crash")),
    RacerRecovered: providedEvents.RacerRecovered ?? defineEvent(prefixedName(namespace, "recovered")),
    AIDecision: providedEvents.AIDecision ?? defineEvent(prefixedName(namespace, "ai-decision")),
    DifficultyChanged: providedEvents.DifficultyChanged ?? defineEvent(prefixedName(namespace, "difficulty-changed")),
    HazardCollision: providedEvents.HazardCollision ?? defineEvent(prefixedName(namespace, "hazard-collision")),
    BoostApplied: providedEvents.BoostApplied ?? defineEvent(prefixedName(namespace, "boost-applied")),
    BoostExpired: providedEvents.BoostExpired ?? defineEvent(prefixedName(namespace, "boost-expired")),
    RacerBumped: providedEvents.RacerBumped ?? defineEvent(prefixedName(namespace, "racer-bumped")),
    RacerSpinout: providedEvents.RacerSpinout ?? defineEvent(prefixedName(namespace, "racer-spinout")),
    PacingAdjusted: providedEvents.PacingAdjusted ?? defineEvent(prefixedName(namespace, "pacing-adjusted")),
    CourseGenerated: providedEvents.CourseGenerated ?? defineEvent(prefixedName(namespace, "course-generated")),
    CourseSectionEntered: providedEvents.CourseSectionEntered ?? defineEvent(prefixedName(namespace, "course-section-entered")),
    VisualDescriptorChanged: providedEvents.VisualDescriptorChanged ?? defineEvent(prefixedName(namespace, "visual-descriptor-changed"))
  });

  return Object.freeze({ namespace, components, resources, events });
}

export function ensureResource(world, resource, fallback) {
  if (!world.hasResource(resource)) {
    const value = typeof fallback === "function" ? fallback() : fallback;
    world.setResource(resource, value);
    return value;
  }
  return world.getResource(resource);
}

export function readAxis(value, axis = "z") {
  if (axis === "y") return number(value?.y);
  if (axis === "x") return number(value?.x);
  return number(value?.z ?? value?.y);
}

export function writeAxis(value, axis = "z", next) {
  if (!value || typeof value !== "object") return;
  if (axis === "y") {
    value.y = next;
    return;
  }
  if (axis === "x") {
    value.x = next;
    return;
  }
  value.z = next;
}

export function lateralAxis(axis = "z") {
  return axis === "x" ? "z" : "x";
}

export function computeProgress(position, course = {}, config = {}) {
  const axis = course.progressAxis ?? config.progressAxis ?? "z";
  const start = number(course.start, number(config.start, 0));
  const finish = number(course.finish, number(config.finish, 1000));
  const value = readAxis(position, axis);
  const span = finish - start;
  const progress = Math.abs(span) <= 0.000001
    ? 0
    : (value - start) / span;
  return clamp(progress, 0, 1);
}

export function progressDistanceToFinish(position, course = {}, config = {}) {
  const axis = course.progressAxis ?? config.progressAxis ?? "z";
  const finish = number(course.finish, number(config.finish, 1000));
  const value = readAxis(position, axis);
  return Math.abs(finish - value);
}

export function downhillDirection(course = {}, config = {}) {
  const axis = course.progressAxis ?? config.progressAxis ?? "z";
  const start = number(course.start, number(config.start, 0));
  const finish = number(course.finish, number(config.finish, 1000));
  const sign = signed(finish - start || 1);
  return axis === "x"
    ? { x: sign, z: 0, axis, sign }
    : { x: 0, z: sign, axis, sign };
}

export function makeRandom(seed = "arcade-race") {
  let h = 2166136261;
  const text = String(seed);
  for (let index = 0; index < text.length; index += 1) {
    h ^= text.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return function random() {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sortRacersByProgress(world, components) {
  const { Racer, TrackProgress, RacePlacement } = components;
  return world.query(Racer, TrackProgress).map((entity) => ({
    entity,
    racer: world.getComponent(entity, Racer),
    progress: world.getComponent(entity, TrackProgress),
    placement: world.hasComponent(entity, RacePlacement) ? world.getComponent(entity, RacePlacement) : null
  })).sort((a, b) => {
    const finishA = Number.isFinite(a.progress.finishTime) ? a.progress.finishTime : Infinity;
    const finishB = Number.isFinite(b.progress.finishTime) ? b.progress.finishTime : Infinity;
    if (finishA !== finishB) return finishA - finishB;
    return number(b.progress.progress) - number(a.progress.progress);
  });
}

export function createRaceSurfaces(engine, definitions) {
  const { components, resources, events } = definitions;
  return {
    raceState: engine.resourceSurface?.(resources.RaceState, { label: "race-state" }),
    roundState: engine.resourceSurface?.(resources.RoundState, { label: "race-round" }),
    difficultyState: engine.resourceSurface?.(resources.DifficultyState, { label: "race-difficulty" }),
    courseState: engine.resourceSurface?.(resources.CourseState, { label: "race-course" }),
    racers: engine.querySurface?.([components.Racer, components.TrackProgress], { label: "race-racers" }),
    hazards: engine.querySurface?.([components.RaceHazard], { label: "race-hazards" }),
    boosts: engine.querySurface?.([components.BoostPad], { label: "race-boosts" }),
    raceStarted: engine.eventSurface?.(events.RaceStarted, { label: "race-started" }),
    raceFinished: engine.eventSurface?.(events.RaceFinished, { label: "race-finished" }),
    racerFinished: engine.eventSurface?.(events.RacerFinished, { label: "racer-finished" }),
    crash: engine.eventSurface?.(events.RacerCrash, { label: "race-crash" }),
    boost: engine.eventSurface?.(events.BoostApplied, { label: "race-boost" })
  };
}

export function setRenderable(world, components, entity, descriptor) {
  if (!descriptor) return null;
  if (world.hasComponent(entity, components.Renderable)) {
    const renderable = world.getComponent(entity, components.Renderable);
    Object.assign(renderable, descriptor);
    return renderable;
  }
  return world.setComponent(entity, components.Renderable, descriptor);
}
