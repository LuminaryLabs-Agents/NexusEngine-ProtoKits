import {
  ARCADE_RACE_CORE_VERSION,
  clamp,
  createArcadeRaceDefinitions,
  defineInjectedRuntimeKit,
  distance2,
  ensureResource,
  getClockElapsed,
  number,
  setRenderable,
  speed2
} from "../arcade-race-core/index.js";

export const RACE_HAZARD_KIT_VERSION = "0.0.1";

function defaultHazard(options = {}) {
  return {
    kind: options.kind ?? "obstacle",
    mode: options.mode ?? "crash",
    radius: number(options.radius, 1.2),
    slowdown: number(options.slowdown, 0.55),
    drag: number(options.drag, 5),
    crashRecoverySeconds: number(options.crashRecoverySeconds, 1.15),
    minCrashSpeed: number(options.minCrashSpeed, 8),
    readableDistance: number(options.readableDistance, 18),
    severity: number(options.severity, 1),
    cooldown: number(options.cooldown, 0.65)
  };
}

function createHazard(world, definitions, descriptor = {}) {
  const { components } = definitions;
  const hazard = { ...defaultHazard(), ...descriptor };
  const entity = descriptor.entity ?? world.addEntity();
  world.setComponent(entity, components.RaceHazard, {
    id: hazard.id ?? `hazard-${entity}`,
    kind: hazard.kind,
    mode: hazard.mode,
    severity: hazard.severity,
    readableDistance: hazard.readableDistance,
    tags: hazard.tags ?? []
  });
  world.setComponent(entity, components.Position, {
    x: number(hazard.x ?? hazard.position?.x, 0),
    y: number(hazard.y ?? hazard.position?.y, 0),
    z: number(hazard.z ?? hazard.position?.z ?? hazard.position?.y, 0)
  });
  world.setComponent(entity, components.HazardCollider, {
    radius: hazard.radius,
    mode: hazard.mode,
    slowdown: hazard.slowdown,
    drag: hazard.drag,
    minCrashSpeed: hazard.minCrashSpeed,
    crashRecoverySeconds: hazard.crashRecoverySeconds,
    severity: hazard.severity,
    cooldown: hazard.cooldown,
    lastHits: new Map()
  });
  world.setComponent(entity, components.Collider, {
    radius: hazard.radius,
    kind: "race-hazard",
    mode: hazard.mode
  });
  if (components.NavigationObstacle) {
    world.setComponent(entity, components.NavigationObstacle, {
      radius: hazard.radius,
      cost: hazard.mode === "crash" ? 10 : 4,
      kind: hazard.kind
    });
  }
  if (hazard.render !== false) {
    setRenderable(world, components, entity, {
      kind: "race-hazard",
      primitive: hazard.primitive ?? "low-poly-obstacle",
      color: hazard.color ?? "#dfe7ef",
      scale: hazard.scale ?? hazard.radius,
      metadata: { hazard: true, kind: hazard.kind, mode: hazard.mode }
    });
  }
  return entity;
}

function shouldHit(collider, racerEntity, now) {
  const lastHits = collider.lastHits instanceof Map ? collider.lastHits : new Map();
  collider.lastHits = lastHits;
  const last = number(lastHits.get(racerEntity), -Infinity);
  return now - last >= number(collider.cooldown, 0.65);
}

function markHit(collider, racerEntity, now) {
  const lastHits = collider.lastHits instanceof Map ? collider.lastHits : new Map();
  collider.lastHits = lastHits;
  lastHits.set(racerEntity, now);
}

function applyHazardEffect(world, definitions, racerEntity, hazardEntity, hazard, collider, options) {
  const { components, events } = definitions;
  const now = getClockElapsed(world);
  const velocity = world.hasComponent(racerEntity, components.Velocity)
    ? world.getComponent(racerEntity, components.Velocity)
    : null;
  const speed = velocity ? speed2(velocity) : 0;
  const mode = collider.mode ?? hazard.mode ?? "crash";
  const severity = number(collider.severity, number(hazard.severity, 1));
  const payload = {
    racer: racerEntity,
    hazard: hazardEntity,
    mode,
    severity,
    speed,
    at: now
  };

  world.emit(events.HazardCollision, payload);

  if (mode === "slowdown" || speed < number(collider.minCrashSpeed, 8)) {
    if (velocity) {
      const scale = clamp(number(collider.slowdown, 0.55), 0, 1);
      velocity.x *= scale;
      if ("z" in velocity) velocity.z *= scale;
      else velocity.y *= scale;
    }
    if (world.hasComponent(racerEntity, components.SurfaceContact)) {
      const surface = world.getComponent(racerEntity, components.SurfaceContact);
      surface.drag = Math.max(number(surface.drag, 0), number(collider.drag, 5));
      surface.slowdown = Math.min(number(surface.slowdown, 1), number(collider.slowdown, 0.55));
    }
    return;
  }

  const recoverAt = now + number(collider.crashRecoverySeconds, number(options.crashRecoverySeconds, 1.15)) * severity;
  world.setComponent(racerEntity, components.CrashState, {
    active: true,
    reason: `hazard:${hazard.kind ?? "obstacle"}`,
    hazard: hazardEntity,
    speed,
    severity,
    recoverAt,
    drag: number(collider.drag, 5)
  });

  if (velocity) {
    const bounce = -0.18 * severity;
    velocity.x *= bounce;
    if ("z" in velocity) velocity.z *= bounce;
    else velocity.y *= bounce;
  }

  world.emit(events.RacerCrash, {
    entity: racerEntity,
    hazard: hazardEntity,
    reason: `hazard:${hazard.kind ?? "obstacle"}`,
    speed,
    recoverAt,
    severity
  });
}

function createHazardCollisionSystem(definitions, options = {}) {
  const { components } = definitions;
  return function raceHazardCollisionSystem(world) {
    const now = getClockElapsed(world);
    const hazards = world.query(components.RaceHazard, components.HazardCollider, components.Position);
    const racers = world.query(components.Racer, components.Position);

    for (const racerEntity of racers) {
      const racerPosition = world.getComponent(racerEntity, components.Position);
      const racerRadius = world.hasComponent(racerEntity, components.Collider)
        ? number(world.getComponent(racerEntity, components.Collider).radius, number(options.racerRadius, 0.75))
        : number(options.racerRadius, 0.75);

      for (const hazardEntity of hazards) {
        const hazardPosition = world.getComponent(hazardEntity, components.Position);
        const collider = world.getComponent(hazardEntity, components.HazardCollider);
        const radius = number(collider.radius, 1.2) + racerRadius;
        if (distance2(racerPosition, hazardPosition) > radius) continue;
        if (!shouldHit(collider, racerEntity, now)) continue;
        markHit(collider, racerEntity, now);
        applyHazardEffect(
          world,
          definitions,
          racerEntity,
          hazardEntity,
          world.getComponent(hazardEntity, components.RaceHazard),
          collider,
          options
        );
      }
    }
  };
}

export function createRaceHazardKit(nexusEngine = {}, options = {}) {
  const definitions = createArcadeRaceDefinitions(nexusEngine, options);
  const { components, resources, events } = definitions;

  const bindings = {
    definitions,
    createHazard: (world, descriptor) => createHazard(world, definitions, descriptor),
    createHazards(world, descriptors = []) {
      return descriptors.map((descriptor) => createHazard(world, definitions, descriptor));
    },
    snapshot(world) {
      return world.query(components.RaceHazard, components.Position).map((entity) => ({
        entity,
        hazard: world.getComponent(entity, components.RaceHazard),
        position: world.getComponent(entity, components.Position),
        collider: world.hasComponent(entity, components.HazardCollider) ? world.getComponent(entity, components.HazardCollider) : null
      }));
    }
  };

  return defineInjectedRuntimeKit(nexusEngine, {
    id: "race-hazard-kit",
    components: {
      Racer: components.Racer,
      Position: components.Position,
      Velocity: components.Velocity,
      Collider: components.Collider,
      NavigationObstacle: components.NavigationObstacle,
      RaceHazard: components.RaceHazard,
      HazardCollider: components.HazardCollider,
      CrashState: components.CrashState,
      SurfaceContact: components.SurfaceContact
    },
    resources: {
      CourseState: resources.CourseState
    },
    events: {
      HazardCollision: events.HazardCollision,
      RacerCrash: events.RacerCrash
    },
    systems: [
      { phase: "resolve", name: "raceHazardCollisionSystem", system: createHazardCollisionSystem(definitions, options) }
    ],
    provides: ["arcade-race", "race-hazard"],
    bindings: {
      raceHazard: bindings
    },
    initWorld({ world }) {
      const course = ensureResource(world, resources.CourseState, () => ({ hazards: [] }));
      if (Array.isArray(options.hazards) && !course.hazardsSeeded) {
        bindings.createHazards(world, options.hazards);
        course.hazardsSeeded = true;
      }
    },
    install({ engine }) {
      engine.raceHazard = bindings;
    },
    metadata: {
      version: RACE_HAZARD_KIT_VERSION,
      coreVersion: ARCADE_RACE_CORE_VERSION,
      purpose: "Obstacle descriptors, crash zones, slowdown zones, hazard density, readable danger placement, and collision event emission.",
      usesNexusEngineKits: ["runtime-kit", "common-game-definitions", "navmesh-compatible", "render-descriptor-compatible"]
    }
  });
}
