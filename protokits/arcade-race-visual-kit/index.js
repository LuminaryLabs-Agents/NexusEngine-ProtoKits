import {
  ARCADE_RACE_CORE_VERSION,
  createArcadeRaceDefinitions,
  defineInjectedRuntimeKit,
  ensureResource,
  getClockDelta,
  number,
  setRenderable
} from "../arcade-race-core/index.js";

export const ARCADE_RACE_VISUAL_KIT_VERSION = "0.0.1";

function defaultTheme(options = {}) {
  return {
    racerPrimitive: options.racerPrimitive ?? "low-poly-racer",
    aiColor: options.aiColor ?? "#5ad2ff",
    playerColor: options.playerColor ?? "#ffcc4d",
    hazardColor: options.hazardColor ?? "#dfe7ef",
    boostColor: options.boostColor ?? "#7de7ff",
    gateColor: options.gateColor ?? "#ff5a7a",
    signColor: options.signColor ?? "#2b3440",
    trailColor: options.trailColor ?? "#ffffff",
    crashColor: options.crashColor ?? "#ffe0a3",
    boostTrailColor: options.boostTrailColor ?? "#92f7ff",
    lowPoly: true
  };
}

function upsertVisual(world, definitions, entity, descriptor) {
  const { components, events } = definitions;
  const current = world.hasComponent(entity, components.RaceVisual)
    ? world.getComponent(entity, components.RaceVisual)
    : {};
  const next = { ...current, ...descriptor, updatedAt: world.__nexusClock?.elapsed ?? 0 };
  world.setComponent(entity, components.RaceVisual, next);
  setRenderable(world, components, entity, {
    kind: next.kind,
    primitive: next.primitive,
    color: next.color,
    scale: next.scale,
    emissive: next.emissive,
    visible: next.visible !== false,
    metadata: {
      ...(next.metadata ?? {}),
      raceVisual: true
    }
  });
  world.emit(events.VisualDescriptorChanged, { entity, visual: next });
  return next;
}

function createEffect(world, definitions, descriptor) {
  const { components } = definitions;
  const entity = world.addEntity();
  world.setComponent(entity, components.Position, {
    x: number(descriptor.position?.x ?? descriptor.x, 0),
    y: number(descriptor.position?.y ?? descriptor.y, 0),
    z: number(descriptor.position?.z ?? descriptor.z ?? descriptor.position?.y, 0)
  });
  world.setComponent(entity, components.RaceVisual, {
    kind: descriptor.kind ?? "race-effect",
    primitive: descriptor.primitive ?? "low-poly-particles",
    color: descriptor.color ?? "#ffffff",
    scale: number(descriptor.scale, 1),
    ttl: number(descriptor.ttl, 0.55),
    age: 0,
    emissive: descriptor.emissive ?? true,
    metadata: descriptor.metadata ?? {}
  });
  setRenderable(world, components, entity, {
    kind: descriptor.kind ?? "race-effect",
    primitive: descriptor.primitive ?? "low-poly-particles",
    color: descriptor.color ?? "#ffffff",
    scale: number(descriptor.scale, 1),
    emissive: descriptor.emissive ?? true,
    metadata: descriptor.metadata ?? {}
  });
  return entity;
}

function createCourseProps(world, definitions, theme, options) {
  const { components, resources } = definitions;
  const course = world.getResource(resources.CourseState);
  if (!course || course.visualPropsCreated) return [];

  const created = [];
  const start = number(course.start, 0);
  const finish = number(course.finish, number(options.finish, 1000));
  const width = number(course.width, number(options.width, 28));

  const props = [
    { id: "start-gate", kind: "race-gate", primitive: "start-gate", z: start, color: theme.gateColor, label: "START" },
    { id: "finish-arch", kind: "race-gate", primitive: "finish-arch", z: finish, color: theme.gateColor, label: "FINISH" }
  ];

  for (const prop of props) {
    const entity = world.addEntity();
    world.setComponent(entity, components.CourseMarker, {
      id: prop.id,
      kind: prop.kind,
      label: prop.label,
      width
    });
    world.setComponent(entity, components.Position, { x: 0, y: 0, z: prop.z });
    upsertVisual(world, definitions, entity, {
      kind: prop.kind,
      primitive: prop.primitive,
      color: prop.color,
      scale: { x: width, y: 4, z: 1 },
      metadata: { label: prop.label }
    });
    created.push(entity);
  }

  for (const section of course.sections ?? []) {
    if (section.kind === "shortcut-branch" || section.kind === "hazard-cluster" || section.kind === "boost-section") {
      const entity = world.addEntity();
      world.setComponent(entity, components.CourseMarker, {
        id: `${section.id}-sign`,
        kind: "course-sign",
        label: section.kind.replace("-", " ")
      });
      world.setComponent(entity, components.Position, {
        x: -width * 0.5 - 2,
        y: 0,
        z: (number(section.start) + number(section.end)) * 0.5
      });
      upsertVisual(world, definitions, entity, {
        kind: "course-sign",
        primitive: "low-poly-sign",
        color: theme.signColor,
        scale: 1,
        metadata: { section: section.id, label: section.kind }
      });
      created.push(entity);
    }
  }

  course.visualPropsCreated = true;
  return created;
}

function createVisualDescriptorSystem(definitions, options = {}) {
  const { components, resources } = definitions;

  return function arcadeRaceVisualDescriptorSystem(world) {
    const theme = ensureResource(world, resources.VisualTheme, () => defaultTheme(options));

    for (const entity of world.query(components.Racer)) {
      const racer = world.getComponent(entity, components.Racer);
      const boosted = world.hasComponent(entity, components.BoostState);
      const crashed = world.hasComponent(entity, components.CrashState) && world.getComponent(entity, components.CrashState).active;
      upsertVisual(world, definitions, entity, {
        kind: "racer",
        primitive: theme.racerPrimitive,
        color: racer.role === "player" ? theme.playerColor : theme.aiColor,
        scale: racer.role === "player" ? 1.08 : 1,
        emissive: boosted,
        metadata: {
          role: racer.role,
          boosted,
          crashed,
          pose: crashed ? "crashed" : boosted ? "boosting" : "sliding"
        }
      });
    }

    for (const entity of world.query(components.RaceHazard)) {
      if (!world.hasComponent(entity, components.Renderable)) {
        const hazard = world.getComponent(entity, components.RaceHazard);
        upsertVisual(world, definitions, entity, {
          kind: "race-hazard",
          primitive: hazard.mode === "slowdown" ? "low-poly-snowbank" : "low-poly-obstacle",
          color: theme.hazardColor,
          scale: 1,
          metadata: { hazard }
        });
      }
    }

    for (const entity of world.query(components.BoostPad)) {
      const boost = world.getComponent(entity, components.BoostPad);
      upsertVisual(world, definitions, entity, {
        kind: "boost-pad",
        primitive: boost.risky ? "risky-boost-pad" : "boost-pad",
        color: theme.boostColor,
        scale: number(boost.radius, 1.35),
        emissive: true,
        metadata: { boost }
      });
    }

    createCourseProps(world, definitions, theme, options);
  };
}

function createVisualEventSystem(definitions, options = {}) {
  const { components, resources, events } = definitions;

  return function arcadeRaceVisualEventSystem(world) {
    const theme = ensureResource(world, resources.VisualTheme, () => defaultTheme(options));

    for (const event of world.readEvents(events.RacerCrash)) {
      if (!event.entity || !world.hasComponent(event.entity, components.Position)) continue;
      createEffect(world, definitions, {
        kind: "crash-effect",
        primitive: "low-poly-snow-burst",
        color: theme.crashColor,
        position: world.getComponent(event.entity, components.Position),
        scale: 1.4 + number(event.severity, 1) * 0.7,
        ttl: 0.7,
        metadata: { event }
      });
    }

    for (const event of world.readEvents(events.BoostApplied)) {
      if (!event.entity || !world.hasComponent(event.entity, components.Position)) continue;
      createEffect(world, definitions, {
        kind: "boost-trail",
        primitive: "low-poly-speed-streak",
        color: theme.boostTrailColor,
        position: world.getComponent(event.entity, components.Position),
        scale: 1.1,
        ttl: number(event.state?.duration, 0.8),
        metadata: { event }
      });
    }

    for (const entity of world.query(components.Racer, components.Position, components.Velocity)) {
      const velocity = world.getComponent(entity, components.Velocity);
      const speed = Math.hypot(number(velocity.x), number(velocity.z ?? velocity.y));
      if (speed < number(options.trailMinSpeed, 10)) continue;
      const frame = Math.floor((world.__nexusClock?.elapsed ?? 0) * 60);
      const density = number(options.trailDensity, 0.25);
      const interval = Math.max(1, Math.round(1 / Math.max(0.01, density)));
      if ((frame + entity) % interval !== 0) continue;
      createEffect(world, definitions, {
        kind: "snow-trail",
        primitive: "low-poly-snow-trail",
        color: theme.trailColor,
        position: world.getComponent(entity, components.Position),
        scale: 0.35 + speed * 0.012,
        ttl: 0.35,
        emissive: false,
        metadata: { speed }
      });
    }
  };
}

function createVisualCleanupSystem(definitions) {
  const { components } = definitions;

  return function arcadeRaceVisualCleanupSystem(world) {
    const delta = getClockDelta(world);
    for (const entity of world.query(components.RaceVisual)) {
      const visual = world.getComponent(entity, components.RaceVisual);
      if (visual.ttl === undefined || visual.ttl === null) continue;
      visual.age = number(visual.age) + delta;
      if (visual.age >= number(visual.ttl)) {
        world.removeEntity(entity);
      }
    }
  };
}

export function createArcadeRaceVisualKit(nexusEngine = {}, options = {}) {
  const definitions = createArcadeRaceDefinitions(nexusEngine, options);
  const { components, resources, events } = definitions;

  const bindings = {
    definitions,
    upsertVisual: (world, entity, descriptor) => upsertVisual(world, definitions, entity, descriptor),
    createEffect: (world, descriptor) => createEffect(world, definitions, descriptor),
    createCourseProps: (world) => createCourseProps(world, definitions, world.getResource(resources.VisualTheme) ?? defaultTheme(options), options),
    snapshot(world) {
      return world.query(components.RaceVisual).map((entity) => ({
        entity,
        visual: world.getComponent(entity, components.RaceVisual),
        renderable: world.hasComponent(entity, components.Renderable) ? world.getComponent(entity, components.Renderable) : null
      }));
    }
  };

  return defineInjectedRuntimeKit(nexusEngine, {
    id: "arcade-race-visual-kit",
    components: {
      Racer: components.Racer,
      Position: components.Position,
      Velocity: components.Velocity,
      Renderable: components.Renderable,
      RaceVisual: components.RaceVisual,
      RaceHazard: components.RaceHazard,
      BoostPad: components.BoostPad,
      BoostState: components.BoostState,
      CrashState: components.CrashState,
      CourseMarker: components.CourseMarker
    },
    resources: {
      CourseState: resources.CourseState,
      VisualTheme: resources.VisualTheme
    },
    events: {
      RacerCrash: events.RacerCrash,
      BoostApplied: events.BoostApplied,
      VisualDescriptorChanged: events.VisualDescriptorChanged
    },
    systems: [
      { phase: "resolve", name: "arcadeRaceVisualDescriptorSystem", system: createVisualDescriptorSystem(definitions, options) },
      { phase: "cleanup", name: "arcadeRaceVisualEventSystem", system: createVisualEventSystem(definitions, options) },
      { phase: "cleanup", name: "arcadeRaceVisualCleanupSystem", system: createVisualCleanupSystem(definitions) }
    ],
    provides: ["arcade-race", "arcade-race-visual"],
    bindings: {
      arcadeRaceVisual: bindings
    },
    initWorld({ world }) {
      ensureResource(world, resources.VisualTheme, () => defaultTheme(options));
    },
    install({ engine }) {
      engine.arcadeRaceVisual = bindings;
    },
    metadata: {
      version: ARCADE_RACE_VISUAL_KIT_VERSION,
      coreVersion: ARCADE_RACE_CORE_VERSION,
      purpose: "Low-poly render descriptors, trail effects, crash effects, boost effects, gates, signs, and finish arch descriptors.",
      usesNexusEngineKits: ["runtime-kit", "render-descriptor-kit", "renderer-agnostic"]
    }
  });
}
