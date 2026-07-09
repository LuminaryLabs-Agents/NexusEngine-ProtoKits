import {
  ARCADE_RACE_CORE_VERSION,
  clamp,
  createArcadeRaceDefinitions,
  defineInjectedRuntimeKit,
  distance2,
  getClockElapsed,
  number,
  setRenderable
} from "../arcade-race-core/index.js";

export const BOOST_PATH_KIT_VERSION = "0.0.1";

function defaultBoost(options = {}) {
  return {
    kind: options.kind ?? "boost-pad",
    radius: number(options.radius, 1.35),
    duration: number(options.duration, 1.15),
    multiplier: number(options.multiplier, 1.45),
    acceleration: number(options.acceleration, 12),
    cooldown: number(options.cooldown, 1.2),
    stacking: options.stacking ?? "replace",
    maxMultiplier: number(options.maxMultiplier, 2.25),
    risky: Boolean(options.risky),
    lane: options.lane ?? null
  };
}

function createBoostPad(world, definitions, descriptor = {}) {
  const { components } = definitions;
  const boost = { ...defaultBoost(), ...descriptor };
  const entity = descriptor.entity ?? world.addEntity();
  world.setComponent(entity, components.BoostPad, {
    id: boost.id ?? `boost-${entity}`,
    kind: boost.kind,
    radius: boost.radius,
    duration: boost.duration,
    multiplier: boost.multiplier,
    acceleration: boost.acceleration,
    cooldown: boost.cooldown,
    stacking: boost.stacking,
    maxMultiplier: boost.maxMultiplier,
    risky: boost.risky,
    lane: boost.lane,
    tags: boost.tags ?? [],
    lastUsed: new Map()
  });
  world.setComponent(entity, components.Position, {
    x: number(boost.x ?? boost.position?.x, 0),
    y: number(boost.y ?? boost.position?.y, 0),
    z: number(boost.z ?? boost.position?.z ?? boost.position?.y, 0)
  });
  world.setComponent(entity, components.Collider, {
    radius: boost.radius,
    kind: "boost-pad",
    sensor: true
  });
  if (boost.render !== false) {
    setRenderable(world, components, entity, {
      kind: "boost-pad",
      primitive: boost.primitive ?? "low-poly-boost-pad",
      color: boost.color ?? "#7de7ff",
      emissive: true,
      scale: boost.scale ?? boost.radius,
      metadata: { boost: true, risky: boost.risky, lane: boost.lane }
    });
  }
  return entity;
}

function canTrigger(boost, racerEntity, now) {
  const lastUsed = boost.lastUsed instanceof Map ? boost.lastUsed : new Map();
  boost.lastUsed = lastUsed;
  const last = number(lastUsed.get(racerEntity), -Infinity);
  return now - last >= number(boost.cooldown, 1.2);
}

function markTriggered(boost, racerEntity, now) {
  const lastUsed = boost.lastUsed instanceof Map ? boost.lastUsed : new Map();
  boost.lastUsed = lastUsed;
  lastUsed.set(racerEntity, now);
}

function applyBoost(world, definitions, racerEntity, boostEntity, boost) {
  const { components, events } = definitions;
  const now = getClockElapsed(world);
  const current = world.hasComponent(racerEntity, components.BoostState)
    ? world.getComponent(racerEntity, components.BoostState)
    : null;

  let next = {
    source: boostEntity,
    kind: boost.kind,
    startedAt: now,
    duration: number(boost.duration, 1.15),
    remaining: number(boost.duration, 1.15),
    multiplier: clamp(number(boost.multiplier, 1.45), 1, number(boost.maxMultiplier, 2.25)),
    acceleration: number(boost.acceleration, 12),
    risky: Boolean(boost.risky),
    stackCount: 1
  };

  if (current) {
    const stacking = boost.stacking ?? "replace";
    if (stacking === "add") {
      next.multiplier = clamp(number(current.multiplier, 1) + (number(boost.multiplier, 1.45) - 1), 1, number(boost.maxMultiplier, 2.25));
      next.acceleration = number(current.acceleration, 0) + number(boost.acceleration, 12) * 0.5;
      next.remaining = Math.max(number(current.remaining, 0), next.remaining);
      next.stackCount = number(current.stackCount, 1) + 1;
    } else if (stacking === "extend") {
      next.multiplier = Math.max(number(current.multiplier, 1), next.multiplier);
      next.acceleration = Math.max(number(current.acceleration, 0), next.acceleration);
      next.remaining = clamp(number(current.remaining, 0) + next.remaining * 0.65, 0, number(boost.maxDuration, 3.5));
      next.stackCount = number(current.stackCount, 1) + 1;
    }
  }

  world.setComponent(racerEntity, components.BoostState, next);
  world.emit(events.BoostApplied, {
    entity: racerEntity,
    boost: boostEntity,
    state: next
  });
  return next;
}

function createBoostCollisionSystem(definitions, options = {}) {
  const { components } = definitions;

  return function boostPathCollisionSystem(world) {
    const now = getClockElapsed(world);
    const pads = world.query(components.BoostPad, components.Position);
    const racers = world.query(components.Racer, components.Position);

    for (const racerEntity of racers) {
      const racerPosition = world.getComponent(racerEntity, components.Position);
      const racerRadius = world.hasComponent(racerEntity, components.Collider)
        ? number(world.getComponent(racerEntity, components.Collider).radius, number(options.racerRadius, 0.75))
        : number(options.racerRadius, 0.75);

      for (const boostEntity of pads) {
        const boost = world.getComponent(boostEntity, components.BoostPad);
        const boostPosition = world.getComponent(boostEntity, components.Position);
        const radius = number(boost.radius, number(options.radius, 1.35)) + racerRadius;
        if (distance2(racerPosition, boostPosition) > radius) continue;
        if (!canTrigger(boost, racerEntity, now)) continue;
        markTriggered(boost, racerEntity, now);
        applyBoost(world, definitions, racerEntity, boostEntity, boost);
      }
    }
  };
}

export function createBoostPathKit(nexusEngine = {}, options = {}) {
  const definitions = createArcadeRaceDefinitions(nexusEngine, options);
  const { components, resources, events } = definitions;

  const bindings = {
    definitions,
    createBoostPad: (world, descriptor) => createBoostPad(world, definitions, descriptor),
    createBoostLane(world, lane = {}) {
      const count = Math.max(1, Math.floor(number(lane.count, 3)));
      const pads = [];
      for (let index = 0; index < count; index += 1) {
        const t = count === 1 ? 0.5 : index / (count - 1);
        pads.push(createBoostPad(world, definitions, {
          ...lane,
          id: `${lane.id ?? "boost-lane"}-${index}`,
          x: number(lane.x, 0) + number(lane.dx, 0) * index,
          z: number(lane.startZ ?? lane.z, 0) + (number(lane.endZ, number(lane.startZ ?? lane.z, 0)) - number(lane.startZ ?? lane.z, 0)) * t
        }));
      }
      return pads;
    },
    grantBoost: (world, entity, boost = {}) => applyBoost(world, definitions, entity, boost.source ?? null, { ...defaultBoost(options), ...boost }),
    snapshot(world) {
      return {
        pads: world.query(components.BoostPad, components.Position).map((entity) => ({
          entity,
          boost: world.getComponent(entity, components.BoostPad),
          position: world.getComponent(entity, components.Position)
        })),
        active: world.query(components.BoostState).map((entity) => ({
          entity,
          boost: world.getComponent(entity, components.BoostState)
        }))
      };
    }
  };

  return defineInjectedRuntimeKit(nexusEngine, {
    id: "boost-path-kit",
    components: {
      Racer: components.Racer,
      Position: components.Position,
      Collider: components.Collider,
      BoostPad: components.BoostPad,
      BoostState: components.BoostState
    },
    resources: {
      CourseState: resources.CourseState
    },
    events: {
      BoostApplied: events.BoostApplied,
      BoostExpired: events.BoostExpired
    },
    systems: [
      { phase: "resolve", name: "boostPathCollisionSystem", system: createBoostCollisionSystem(definitions, options) }
    ],
    provides: ["arcade-race", "boost-path"],
    bindings: {
      boostPath: bindings
    },
    initWorld({ world }) {
      if (Array.isArray(options.boostPads)) {
        for (const pad of options.boostPads) createBoostPad(world, definitions, pad);
      }
      if (Array.isArray(options.boostLanes)) {
        for (const lane of options.boostLanes) bindings.createBoostLane(world, lane);
      }
    },
    install({ engine }) {
      engine.boostPath = bindings;
    },
    metadata: {
      version: BOOST_PATH_KIT_VERSION,
      coreVersion: ARCADE_RACE_CORE_VERSION,
      purpose: "Boost pads, lanes, risky shortcuts, boost duration, cooldowns, and stacking rules.",
      usesNexusEngineKits: ["runtime-kit", "render-descriptor-compatible"]
    }
  });
}
