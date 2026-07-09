import {
  ARCADE_RACE_CORE_VERSION,
  createArcadeRaceDefinitions,
  defineInjectedRuntimeKit,
  ensureResource,
  makeRandom,
  number,
  setRenderable
} from "../arcade-race-core/index.js";

export const COURSE_DIRECTOR_KIT_VERSION = "0.0.1";

function clampLocal(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function laneX(lane, lanes, width) {
  if (lanes <= 1) return 0;
  return -width * 0.5 + (lane / (lanes - 1)) * width;
}

function lerpRaw(a, b, t) {
  return a + (b - a) * t;
}

function sectionKind(index, count, random) {
  if (index === 0) return "calm";
  if (index === count - 1) return "final-sprint";
  const roll = random();
  if (roll < 0.24) return "calm";
  if (roll < 0.52) return "hazard-cluster";
  if (roll < 0.74) return "boost-section";
  return "shortcut-branch";
}

function createCourse(options = {}) {
  const seed = options.seed ?? "arcade-race-course";
  const random = makeRandom(seed);
  const length = number(options.length, 1000);
  const width = number(options.width, 28);
  const lanes = Math.max(1, Math.floor(number(options.lanes, 5)));
  const sectionCount = Math.max(3, Math.floor(number(options.sections, 12)));
  const start = number(options.start, 0);
  const finish = number(options.finish, length);
  const progressAxis = options.progressAxis ?? "z";
  const hazards = [];
  const boostPads = [];
  const branches = [];
  const sections = [];

  for (let index = 0; index < sectionCount; index += 1) {
    const startT = index / sectionCount;
    const endT = (index + 1) / sectionCount;
    const kind = sectionKind(index, sectionCount, random);
    const intensity = clampLocal(0.25 + index / Math.max(1, sectionCount - 1) * 0.75, 0, 1);
    const section = {
      id: `section-${index}`,
      index,
      kind,
      startProgress: startT,
      endProgress: endT,
      start: lerpRaw(start, finish, startT),
      end: lerpRaw(start, finish, endT),
      width,
      lanes,
      intensity
    };

    if (kind === "hazard-cluster") {
      const count = Math.max(1, Math.round(number(options.baseHazardsPerCluster, 2) + intensity * number(options.hazardEscalation, 4)));
      for (let h = 0; h < count; h += 1) {
        const lane = Math.floor(random() * lanes);
        const localT = startT + (endT - startT) * (0.18 + random() * 0.68);
        const z = lerpRaw(start, finish, localT);
        hazards.push({
          id: `hazard-${index}-${h}`,
          kind: random() < 0.25 ? "soft-slowdown" : "hard-obstacle",
          mode: random() < 0.28 ? "slowdown" : "crash",
          x: laneX(lane, lanes, width) + (random() - 0.5) * width * 0.08,
          z,
          lane,
          radius: 0.8 + random() * 1.2,
          severity: 0.65 + intensity * 0.8,
          readableDistance: 18 + intensity * 8
        });
      }
    }

    if (kind === "boost-section" || kind === "final-sprint") {
      const count = kind === "final-sprint" ? lanes : Math.max(1, Math.round(1 + intensity * 3));
      for (let b = 0; b < count; b += 1) {
        const lane = kind === "final-sprint" ? b % lanes : Math.floor(random() * lanes);
        const localT = startT + (endT - startT) * (0.2 + random() * 0.6);
        boostPads.push({
          id: `boost-${index}-${b}`,
          x: laneX(lane, lanes, width),
          z: lerpRaw(start, finish, localT),
          lane,
          risky: kind !== "final-sprint" && random() < 0.38,
          multiplier: 1.25 + intensity * 0.32,
          duration: 0.9 + intensity * 0.55
        });
      }
    }

    if (kind === "shortcut-branch") {
      const fromLane = Math.floor(random() * lanes);
      const toLane = Math.floor(random() * lanes);
      const branch = {
        id: `shortcut-${index}`,
        startProgress: startT + (endT - startT) * 0.12,
        endProgress: startT + (endT - startT) * 0.88,
        from: { x: laneX(fromLane, lanes, width), z: lerpRaw(start, finish, startT + (endT - startT) * 0.12) },
        to: { x: laneX(toLane, lanes, width), z: lerpRaw(start, finish, startT + (endT - startT) * 0.88) },
        risk: 0.35 + intensity * 0.55,
        reward: 0.18 + intensity * 0.35
      };
      branches.push(branch);

      hazards.push({
        id: `shortcut-risk-${index}`,
        kind: "shortcut-risk",
        mode: "crash",
        x: (branch.from.x + branch.to.x) * 0.5,
        z: (branch.from.z + branch.to.z) * 0.5,
        radius: 1.4,
        severity: 1 + intensity,
        readableDistance: 24
      });
      boostPads.push({
        id: `shortcut-reward-${index}`,
        x: branch.to.x,
        z: branch.to.z,
        risky: true,
        multiplier: 1.35 + intensity * 0.35,
        duration: 1 + intensity * 0.6
      });
    }

    sections.push(section);
  }

  return {
    id: options.id ?? "arcade-race-course",
    seed,
    progressAxis,
    start,
    finish,
    length: Math.abs(finish - start),
    width,
    lanes,
    sectors: sectionCount,
    sections,
    hazards,
    boostPads,
    branches,
    surface: options.surface ?? { kind: "packed-snow", grip: 0.72, drag: 0.72, slowdown: 1 },
    generatedAt: 0
  };
}

function materializeSections(world, definitions, course) {
  const { components } = definitions;
  const existing = world.query(components.CourseSection);
  if (existing.length > 0 && !course.rematerializeSections) return existing;

  return course.sections.map((section) => {
    const entity = world.addEntity();
    world.setComponent(entity, components.CourseSection, section);
    world.setComponent(entity, components.Position, {
      x: 0,
      y: 0,
      z: (number(section.start) + number(section.end)) * 0.5
    });
    setRenderable(world, components, entity, {
      kind: "course-section",
      primitive: "course-band",
      visible: false,
      metadata: { section }
    });
    return entity;
  });
}

function createCourseSectionSystem(definitions) {
  const { components, resources, events } = definitions;
  return function courseSectionSystem(world) {
    const course = world.getResource(resources.CourseState);
    if (!course || !Array.isArray(course.sections)) return;

    for (const entity of world.query(components.Racer, components.TrackProgress)) {
      const progress = world.getComponent(entity, components.TrackProgress);
      const value = number(progress.progress);
      const section = course.sections.find((entry) => value >= number(entry.startProgress) && value < number(entry.endProgress))
        ?? course.sections[course.sections.length - 1];
      if (!section) continue;
      if (progress.sectionId !== section.id) {
        const previous = progress.sectionId ?? null;
        progress.sectionId = section.id;
        progress.sectionKind = section.kind;
        world.emit(events.CourseSectionEntered, {
          entity,
          section,
          previous,
          progress: value
        });
      }
    }
  };
}

export function createCourseDirectorKit(nexusEngine = {}, options = {}) {
  const definitions = createArcadeRaceDefinitions(nexusEngine, options);
  const { components, resources, events } = definitions;

  const bindings = {
    definitions,
    generateCourse(world, overrides = {}) {
      const course = createCourse({ ...options, ...overrides });
      course.generatedAt = world.__nexusClock?.elapsed ?? 0;
      world.setResource(resources.CourseState, course);
      materializeSections(world, definitions, course);
      world.emit(events.CourseGenerated, {
        course,
        sectionCount: course.sections.length,
        hazardCount: course.hazards.length,
        boostCount: course.boostPads.length,
        branchCount: course.branches.length
      });
      return course;
    },
    materializeHazards(world, raceHazard) {
      const course = world.getResource(resources.CourseState);
      if (!course || !raceHazard?.createHazards) return [];
      return raceHazard.createHazards(world, course.hazards ?? []);
    },
    materializeBoosts(world, boostPath) {
      const course = world.getResource(resources.CourseState);
      if (!course || !boostPath?.createBoostPad) return [];
      return (course.boostPads ?? []).map((pad) => boostPath.createBoostPad(world, pad));
    },
    snapshot(world) {
      return world.getResource(resources.CourseState);
    }
  };

  return defineInjectedRuntimeKit(nexusEngine, {
    id: "course-director-kit",
    components: {
      Racer: components.Racer,
      Position: components.Position,
      TrackProgress: components.TrackProgress,
      CourseSection: components.CourseSection,
      CourseMarker: components.CourseMarker,
      Renderable: components.Renderable
    },
    resources: {
      CourseState: resources.CourseState,
      CourseDirectorState: resources.CourseDirectorState
    },
    events: {
      CourseGenerated: events.CourseGenerated,
      CourseSectionEntered: events.CourseSectionEntered
    },
    systems: [
      { phase: "resolve", name: "courseSectionSystem", system: createCourseSectionSystem(definitions) }
    ],
    provides: ["arcade-race", "course-director"],
    bindings: {
      courseDirector: bindings
    },
    initWorld({ world }) {
      ensureResource(world, resources.CourseDirectorState, () => ({
        seed: options.seed ?? "arcade-race-course",
        generation: 0
      }));
      if (options.autoGenerate !== false && !world.hasResource(resources.CourseState)) {
        bindings.generateCourse(world);
      }
    },
    install({ engine, world }) {
      engine.courseDirector = bindings;
      if (options.materializeHazards && engine.raceHazard) {
        bindings.materializeHazards(world, engine.raceHazard);
      }
      if (options.materializeBoosts && engine.boostPath) {
        bindings.materializeBoosts(world, engine.boostPath);
      }
    },
    metadata: {
      version: COURSE_DIRECTOR_KIT_VERSION,
      coreVersion: ARCADE_RACE_CORE_VERSION,
      purpose: "Calm sections, hazard clusters, shortcut branches, boost sections, final sprint sections, and procedural course pacing.",
      usesNexusEngineKits: ["runtime-kit", "procedural-kit-compatible", "terrain-kit-compatible", "render-descriptor-compatible"]
    }
  });
}
