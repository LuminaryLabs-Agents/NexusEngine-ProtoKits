import {
  ARCADE_RACE_CORE_VERSION,
  approach,
  clamp,
  createArcadeRaceDefinitions,
  defineInjectedRuntimeKit,
  downhillDirection,
  getClockDelta,
  getClockElapsed,
  lateralAxis,
  number,
  readAxis,
  speed2,
  writeAxis
} from "../arcade-race-core/index.js";

export const SLOPE_TRAVERSAL_KIT_VERSION = "0.0.1";

function createDefaultTraversal(options = {}) {
  return {
    maxSpeed: number(options.maxSpeed, 42),
    minSpeed: number(options.minSpeed, -10),
    slopeAcceleration: number(options.slopeAcceleration, 18),
    turnAcceleration: number(options.turnAcceleration, 34),
    steeringDrag: number(options.steeringDrag, 1.8),
    baseDrag: number(options.baseDrag, 0.72),
    snowDrag: number(options.snowDrag, 1.65),
    iceDrag: number(options.iceDrag, 0.28),
    grip: number(options.grip, 0.72),
    driftGrip: number(options.driftGrip, 0.38),
    stability: number(options.stability, 1),
    crashSpeed: number(options.crashSpeed, 48),
    spinoutSpeed: number(options.spinoutSpeed, 56),
    recoverySeconds: number(options.recoverySeconds, 1.15),
    requireRacing: options.requireRacing ?? true,
    allowReverse: options.allowReverse ?? false
  };
}

function defaultSurface() {
  return {
    kind: "packed-snow",
    grip: 0.72,
    drag: 0.72,
    slowdown: 1,
    crashRisk: 0
  };
}

function sampleCourseSurface(position, course, options) {
  if (typeof options.sampleSurface === "function") {
    return { ...defaultSurface(), ...options.sampleSurface(position, course) };
  }
  if (typeof course?.sampleSurface === "function") {
    return { ...defaultSurface(), ...course.sampleSurface(position) };
  }

  const zones = Array.isArray(course?.surfaceZones) ? course.surfaceZones : [];
  for (const zone of zones) {
    const x = number(position?.x);
    const z = number(position?.z ?? position?.y);
    const inX = x >= number(zone.minX, -Infinity) && x <= number(zone.maxX, Infinity);
    const inZ = z >= number(zone.minZ, -Infinity) && z <= number(zone.maxZ, Infinity);
    if (inX && inZ) return { ...defaultSurface(), ...zone.surface };
  }

  return { ...defaultSurface(), ...(course?.surface ?? {}) };
}

function isRaceActive(world, definitions, traversal) {
  if (traversal.requireRacing === false) return true;
  const raceState = world.getResource(definitions.resources.RaceState);
  return !raceState || raceState.status === "racing";
}

function getIntent(world, components, entity, traversal) {
  if (world.hasComponent(entity, components.InputIntent)) {
    return world.getComponent(entity, components.InputIntent) ?? {};
  }
  return traversal.intent ?? {};
}

function getBoostMultiplier(world, components, entity) {
  if (!world.hasComponent(entity, components.BoostState)) {
    return { multiplier: 1, acceleration: 0 };
  }
  const boost = world.getComponent(entity, components.BoostState);
  return {
    multiplier: Math.max(1, number(boost.multiplier, 1)),
    acceleration: Math.max(0, number(boost.acceleration, 0))
  };
}

function ensureTraversalComponents(world, components, entity, options) {
  if (!world.hasComponent(entity, components.SlopeTraversal)) {
    world.setComponent(entity, components.SlopeTraversal, createDefaultTraversal(options));
  }
  if (!world.hasComponent(entity, components.SurfaceContact)) {
    world.setComponent(entity, components.SurfaceContact, defaultSurface());
  }
  if (!world.hasComponent(entity, components.DriftState)) {
    world.setComponent(entity, components.DriftState, { active: false, amount: 0, direction: 0 });
  }
}

function createTraversalSystem(definitions, options = {}) {
  const { components, resources, events } = definitions;

  return function slopeTraversalSystem(world) {
    const course = world.getResource(resources.CourseState) ?? options;
    const delta = getClockDelta(world);
    const now = getClockElapsed(world);

    for (const entity of world.query(components.Racer, components.Position, components.Velocity)) {
      ensureTraversalComponents(world, components, entity, options);

      const position = world.getComponent(entity, components.Position);
      const velocity = world.getComponent(entity, components.Velocity);
      const traversal = world.getComponent(entity, components.SlopeTraversal);
      const surface = world.getComponent(entity, components.SurfaceContact);
      const drift = world.getComponent(entity, components.DriftState);
      const intent = getIntent(world, components, entity, traversal);
      const profile = { ...createDefaultTraversal(options), ...traversal };

      if (!isRaceActive(world, definitions, profile)) {
        velocity.x *= Math.exp(-delta * 4);
        if ("z" in velocity) velocity.z *= Math.exp(-delta * 4);
        else velocity.y *= Math.exp(-delta * 4);
        continue;
      }

      const sampledSurface = sampleCourseSurface(position, course, options);
      Object.assign(surface, sampledSurface);

      if (world.hasComponent(entity, components.CrashState)) {
        const crash = world.getComponent(entity, components.CrashState);
        if (crash.active && now < number(crash.recoverAt, now)) {
          velocity.x *= Math.exp(-delta * number(crash.drag, 5));
          if ("z" in velocity) velocity.z *= Math.exp(-delta * number(crash.drag, 5));
          else velocity.y *= Math.exp(-delta * number(crash.drag, 5));
          continue;
        }
        if (crash.active && now >= number(crash.recoverAt, now)) {
          crash.active = false;
          crash.recoveredAt = now;
          world.emit(events.RacerRecovered, { entity, at: now, crash });
        }
      }

      const direction = downhillDirection(course, options);
      const lateral = lateralAxis(direction.axis);
      const boost = getBoostMultiplier(world, components, entity);
      const steer = clamp(number(intent.steer ?? intent.x ?? intent.lateral, 0), -1, 1);
      const brake = clamp(number(intent.brake ?? 0), 0, 1);
      const driftInput = Boolean(intent.drift || intent.brakeDrift);
      const surfaceGrip = clamp(number(surface.grip, profile.grip), 0.05, 1.25);
      const slowdown = clamp(number(surface.slowdown, 1), 0.05, 1.5);
      const grip = driftInput ? number(profile.driftGrip, 0.38) : surfaceGrip;
      const downhillVelocity = readAxis(velocity, direction.axis);
      const maxSpeed = number(profile.maxSpeed, 42) * boost.multiplier * slowdown;

      drift.active = driftInput;
      drift.direction = steer;
      drift.amount = approach(number(drift.amount), driftInput ? Math.abs(steer) : 0, 7, delta);

      writeAxis(
        velocity,
        direction.axis,
        downhillVelocity
          + direction.sign * (number(profile.slopeAcceleration, 18) + boost.acceleration) * delta
          - direction.sign * brake * number(profile.slopeAcceleration, 18) * 1.5 * delta
      );

      const lateralVelocity = readAxis(velocity, lateral);
      writeAxis(
        velocity,
        lateral,
        lateralVelocity
          + steer * number(profile.turnAcceleration, 34) * grip * delta
          - lateralVelocity * number(profile.steeringDrag, 1.8) * delta * (1.2 - grip)
      );

      const drag = number(surface.drag, profile.baseDrag);
      const dragScale = Math.exp(-delta * drag);
      velocity.x *= dragScale;
      if ("z" in velocity) velocity.z *= dragScale;
      else velocity.y *= dragScale;

      const afterDragDownhill = readAxis(velocity, direction.axis);
      if (!profile.allowReverse && afterDragDownhill * direction.sign < 0) {
        writeAxis(velocity, direction.axis, 0);
      }

      const limitedSpeed = speed2(velocity);
      if (limitedSpeed > maxSpeed) {
        const scale = maxSpeed / limitedSpeed;
        velocity.x *= scale;
        if ("z" in velocity) velocity.z *= scale;
        else velocity.y *= scale;
      }

      const nextSpeed = speed2(velocity);
      const instability = Math.max(0, (nextSpeed - number(profile.crashSpeed, 48)) / Math.max(1, number(profile.spinoutSpeed, 56) - number(profile.crashSpeed, 48)));
      const turnRisk = Math.abs(steer) * (0.3 + number(drift.amount) * 0.7);
      const crashRisk = clamp(instability * turnRisk + number(surface.crashRisk, 0), 0, 2);
      profile.stability = clamp(number(profile.stability, 1) - crashRisk * delta + (1 - crashRisk) * delta * 0.5, 0, 1.5);
      traversal.stability = profile.stability;
      traversal.speed = nextSpeed;
      traversal.crashRisk = crashRisk;

      if (profile.stability <= 0.02 && nextSpeed > number(profile.crashSpeed, 48)) {
        const recoverAt = now + number(profile.recoverySeconds, 1.15);
        world.setComponent(entity, components.CrashState, {
          active: true,
          reason: "high-speed-instability",
          speed: nextSpeed,
          recoverAt,
          drag: 7,
          intensity: clamp(crashRisk, 0.2, 1.5)
        });
        traversal.stability = 0.35;
        velocity.x *= -0.12;
        if ("z" in velocity) velocity.z *= -0.12;
        else velocity.y *= -0.12;
        world.emit(events.RacerCrash, { entity, reason: "high-speed-instability", speed: nextSpeed, recoverAt });
      }

      position.x += number(velocity.x) * delta;
      if ("z" in position || "z" in velocity) position.z = number(position.z) + number(velocity.z) * delta;
      else position.y = number(position.y) + number(velocity.y) * delta;
    }
  };
}

function createBoostDecaySystem(definitions) {
  const { components, events } = definitions;
  return function slopeTraversalBoostDecaySystem(world) {
    const delta = getClockDelta(world);
    for (const entity of world.query(components.BoostState)) {
      const boost = world.getComponent(entity, components.BoostState);
      boost.remaining = number(boost.remaining, number(boost.duration, 0)) - delta;
      if (boost.remaining <= 0) {
        world.removeComponent(entity, components.BoostState);
        world.emit(events.BoostExpired, { entity, boost });
      }
    }
  };
}

export function createSlopeTraversalKit(nexusRealtime = {}, options = {}) {
  const definitions = createArcadeRaceDefinitions(nexusRealtime, options);
  const { components, resources, events } = definitions;

  const bindings = {
    definitions,
    applyProfile(world, entity, profile = {}) {
      const current = world.hasComponent(entity, components.SlopeTraversal)
        ? world.getComponent(entity, components.SlopeTraversal)
        : createDefaultTraversal(options);
      return world.setComponent(entity, components.SlopeTraversal, { ...current, ...profile });
    },
    setInput(world, entity, intent = {}) {
      return world.setComponent(entity, components.InputIntent, {
        x: number(intent.x ?? intent.steer ?? intent.lateral, 0),
        z: number(intent.z ?? intent.forward, 1),
        steer: number(intent.steer ?? intent.x ?? intent.lateral, 0),
        brake: number(intent.brake, 0),
        drift: Boolean(intent.drift)
      });
    },
    snapshot(world) {
      return world.query(components.Racer, components.SlopeTraversal).map((entity) => ({
        entity,
        traversal: world.getComponent(entity, components.SlopeTraversal),
        surface: world.hasComponent(entity, components.SurfaceContact) ? world.getComponent(entity, components.SurfaceContact) : null,
        drift: world.hasComponent(entity, components.DriftState) ? world.getComponent(entity, components.DriftState) : null,
        crash: world.hasComponent(entity, components.CrashState) ? world.getComponent(entity, components.CrashState) : null
      }));
    }
  };

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: "slope-traversal-kit",
    components: {
      Position: components.Position,
      Velocity: components.Velocity,
      InputIntent: components.InputIntent,
      Racer: components.Racer,
      SlopeTraversal: components.SlopeTraversal,
      SurfaceContact: components.SurfaceContact,
      DriftState: components.DriftState,
      CrashState: components.CrashState,
      BoostState: components.BoostState
    },
    resources: {
      RaceState: resources.RaceState,
      CourseState: resources.CourseState
    },
    events: {
      TraversalStateChanged: events.TraversalStateChanged,
      RacerCrash: events.RacerCrash,
      RacerRecovered: events.RacerRecovered,
      BoostExpired: events.BoostExpired
    },
    systems: [
      { phase: "simulate", name: "slopeTraversalSystem", system: createTraversalSystem(definitions, options) },
      { phase: "cleanup", name: "slopeTraversalBoostDecaySystem", system: createBoostDecaySystem(definitions) }
    ],
    provides: ["arcade-race", "slope-traversal"],
    bindings: {
      slopeTraversal: bindings
    },
    install({ engine }) {
      engine.slopeTraversal = bindings;
    },
    metadata: {
      version: SLOPE_TRAVERSAL_KIT_VERSION,
      coreVersion: ARCADE_RACE_CORE_VERSION,
      purpose: "Slope acceleration, sliding friction, surface grip, snow/ice drag, drift, and crash-prone high speed traversal.",
      usesNexusRealtimeKits: ["runtime-kit", "common-game-definitions", "character-movement-compatible"]
    }
  });
}
