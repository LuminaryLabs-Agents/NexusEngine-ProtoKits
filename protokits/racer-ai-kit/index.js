import {
  ARCADE_RACE_CORE_VERSION,
  clamp,
  computeProgress,
  createArcadeRaceDefinitions,
  defineInjectedRuntimeKit,
  downhillDirection,
  getClockDelta,
  getClockElapsed,
  number
} from "../arcade-race-core/index.js";

export const RACER_AI_KIT_VERSION = "0.0.1";

function defaultDriver(options = {}) {
  return {
    skill: number(options.skill, 0.35),
    aggression: number(options.aggression, 0.18),
    mistakeRate: number(options.mistakeRate, 0.42),
    obstacleAwareness: number(options.obstacleAwareness, 0.38),
    boostPreference: number(options.boostPreference, 0.45),
    routeCommitment: number(options.routeCommitment, 0.55),
    reactionTime: number(options.reactionTime, 0.42),
    lane: number(options.lane, 0),
    targetLane: number(options.targetLane, 0),
    decisionAge: 0,
    lastDecisionAt: 0,
    seed: number(options.seed, 1)
  };
}

function getDifficulty(world, resources) {
  const difficulty = world.getResource(resources.DifficultyState) ?? {};
  return {
    skill: clamp(number(difficulty.skill, 0), 0, 1),
    aggression: clamp(number(difficulty.aggression, 0), 0, 1),
    mistakeRate: clamp(number(difficulty.mistakeRate, 1), 0, 1),
    boostSkill: clamp(number(difficulty.boostSkill, 0), 0, 1),
    avoidanceSkill: clamp(number(difficulty.avoidanceSkill, 0), 0, 1),
    pacingPressure: clamp(number(difficulty.pacingPressure, 0), 0, 1)
  };
}

function laneCenter(course, lane, options) {
  const width = number(course?.width, number(options.width, 26));
  const lanes = Math.max(1, Math.floor(number(course?.lanes, number(options.lanes, 5))));
  const laneIndex = clamp(Math.round(lane), 0, lanes - 1);
  if (lanes === 1) return 0;
  return -width * 0.5 + (laneIndex / (lanes - 1)) * width;
}

function progressOfEntity(world, components, entity, course, options) {
  if (world.hasComponent(entity, components.TrackProgress)) {
    return number(world.getComponent(entity, components.TrackProgress).progress);
  }
  if (world.hasComponent(entity, components.Position)) {
    return computeProgress(world.getComponent(entity, components.Position), course, options);
  }
  return 0;
}

function nearestUpcoming(world, components, position, course, options, kind) {
  const currentProgress = computeProgress(position, course, options);
  const sourceComponent = kind === "boost" ? components.BoostPad : components.RaceHazard;
  let best = null;
  for (const entity of world.query(sourceComponent, components.Position)) {
    const otherPosition = world.getComponent(entity, components.Position);
    const progress = computeProgress(otherPosition, course, options);
    const ahead = progress - currentProgress;
    if (ahead < 0 || ahead > number(options.lookAheadProgress, 0.14)) continue;
    const lateralGap = Math.abs(number(otherPosition.x) - number(position.x));
    const score = ahead * 100 + lateralGap * 0.04;
    if (!best || score < best.score) {
      best = {
        entity,
        progress,
        ahead,
        lateralGap,
        position: otherPosition,
        data: world.getComponent(entity, sourceComponent),
        score
      };
    }
  }
  return best;
}

function findPlayer(world, components) {
  const players = world.query(components.Racer, components.PlayerRacer, components.Position);
  return players.length ? players[0] : null;
}

function speedIntentForDifficulty(skill, difficulty) {
  return clamp(0.45 + skill * 0.45 + difficulty.aggression * 0.1, 0, 1);
}

function createAIDriverSystem(definitions, options = {}) {
  const { components, resources, events } = definitions;

  return function racerAIDriverSystem(world) {
    const raceState = world.getResource(resources.RaceState);
    if (options.requireRacing !== false && raceState && raceState.status !== "racing") return;

    const course = world.getResource(resources.CourseState) ?? options;
    const difficulty = getDifficulty(world, resources);
    const delta = getClockDelta(world);
    const now = getClockElapsed(world);
    const direction = downhillDirection(course, options);
    const playerEntity = findPlayer(world, components);
    const playerPosition = playerEntity ? world.getComponent(playerEntity, components.Position) : null;
    const playerProgress = playerEntity ? progressOfEntity(world, components, playerEntity, course, options) : null;
    const laneCount = Math.max(1, Math.floor(number(course.lanes, number(options.lanes, 5))));
    const laneWidth = number(course.width, number(options.width, 26)) / laneCount;

    for (const entity of world.query(components.Racer, components.AIRacer, components.Position)) {
      const racer = world.getComponent(entity, components.Racer);
      const position = world.getComponent(entity, components.Position);
      const driver = world.hasComponent(entity, components.AIDriver)
        ? world.getComponent(entity, components.AIDriver)
        : world.setComponent(entity, components.AIDriver, defaultDriver({ ...options, seed: entity }));

      const personalSkill = clamp(number(driver.skill, 0.35) + difficulty.skill * 0.65, 0, 1);
      const aggression = clamp(number(driver.aggression, 0.18) + difficulty.aggression * 0.55, 0, 1);
      const mistakeRate = clamp(number(driver.mistakeRate, 0.42) * (1 - difficulty.skill * 0.75) * Math.max(0.15, difficulty.mistakeRate), 0, 1);
      const obstacleAwareness = clamp(number(driver.obstacleAwareness, 0.38) + difficulty.avoidanceSkill * 0.62, 0, 1);
      const boostPreference = clamp(number(driver.boostPreference, 0.45) + difficulty.boostSkill * 0.55, 0, 1);
      const reactionTime = Math.max(0.05, number(driver.reactionTime, 0.42) * (1 - personalSkill * 0.7));

      driver.decisionAge = number(driver.decisionAge) + delta;
      const shouldReplan = driver.decisionAge >= reactionTime;
      if (shouldReplan) {
        const hazard = nearestUpcoming(world, components, position, course, options, "hazard");
        const boost = nearestUpcoming(world, components, position, course, options, "boost");
        let targetLane = Math.round(number(driver.targetLane, number(driver.lane, 0)));

        if (boost && boostPreference > 0.35) {
          const boostLane = clamp(Math.round(((number(boost.position.x) / Math.max(1, number(course.width, 26))) + 0.5) * laneCount), 0, laneCount - 1);
          const boostCanBeHit = boostPreference + personalSkill > 0.78 || boost.lateralGap < laneWidth * 1.4;
          if (boostCanBeHit) targetLane = boostLane;
        }

        if (hazard && obstacleAwareness > 0.25) {
          const hazardLane = clamp(Math.round(((number(hazard.position.x) / Math.max(1, number(course.width, 26))) + 0.5) * laneCount), 0, laneCount - 1);
          const tooClose = hazard.lateralGap < laneWidth * (1.1 + (1 - personalSkill));
          if (tooClose) {
            const side = ((entity + Math.floor(now * 10)) % 2 === 0) ? 1 : -1;
            targetLane = clamp(hazardLane + side, 0, laneCount - 1);
          }
        }

        if (playerPosition && playerProgress !== null) {
          const myProgress = progressOfEntity(world, components, entity, course, options);
          const pressure = aggression + difficulty.pacingPressure * 0.35;
          const nearPlayer = Math.abs(playerProgress - myProgress) < 0.08;
          if (nearPlayer && pressure > 0.55) {
            const playerLane = clamp(Math.round(((number(playerPosition.x) / Math.max(1, number(course.width, 26))) + 0.5) * laneCount), 0, laneCount - 1);
            targetLane = Math.round((targetLane + playerLane) * 0.5);
          }
        }

        driver.targetLane = clamp(targetLane, 0, laneCount - 1);
        driver.decisionAge = 0;
        driver.lastDecisionAt = now;
      }

      const targetX = laneCenter(course, driver.targetLane, options);
      const lateralError = targetX - number(position.x);
      const mistakeWave = Math.sin((now + number(driver.seed, entity)) * (1.6 + mistakeRate * 3.1));
      const mistake = mistakeWave * mistakeRate * (1 - personalSkill) * number(options.mistakeSteerScale, 0.65);
      const steering = clamp(lateralError / Math.max(1, laneWidth) + mistake, -1, 1);

      const hazard = nearestUpcoming(world, components, position, course, options, "hazard");
      const brakeForHazard = hazard && hazard.lateralGap < laneWidth * 0.85 && hazard.ahead < 0.045
        ? clamp((1 - obstacleAwareness) * 0.7 + (1 - personalSkill) * 0.4, 0, 1)
        : 0;

      const drift = Math.abs(steering) > 0.65 && personalSkill > 0.45 && speedIntentForDifficulty(personalSkill, difficulty) > 0.65;
      const intent = {
        x: steering,
        z: direction.sign,
        steer: steering,
        brake: brakeForHazard,
        drift,
        aggression,
        targetLane: driver.targetLane
      };

      world.setComponent(entity, components.InputIntent, intent);
      world.setComponent(entity, components.AIRouteIntent, {
        targetLane: driver.targetLane,
        targetX,
        steering,
        brake: brakeForHazard,
        skill: personalSkill,
        aggression,
        mistakeRate,
        updatedAt: now
      });

      if (!driver.lastDecisionEmittedAt || now - driver.lastDecisionEmittedAt > number(options.emitDecisionInterval, 0.5)) {
        driver.lastDecisionEmittedAt = now;
        world.emit(events.AIDecision, {
          entity,
          racer,
          intent,
          targetLane: driver.targetLane,
          skill: personalSkill,
          aggression,
          mistakeRate
        });
      }
    }
  };
}

export function createRacerAIKit(nexusEngine = {}, options = {}) {
  const definitions = createArcadeRaceDefinitions(nexusEngine, options);
  const { components, resources, events } = definitions;

  const bindings = {
    definitions,
    configureDriver(world, entity, driver = {}) {
      const current = world.hasComponent(entity, components.AIDriver)
        ? world.getComponent(entity, components.AIDriver)
        : defaultDriver({ ...options, seed: entity });
      return world.setComponent(entity, components.AIDriver, { ...current, ...driver });
    },
    snapshot(world) {
      return world.query(components.AIDriver).map((entity) => ({
        entity,
        driver: world.getComponent(entity, components.AIDriver),
        intent: world.hasComponent(entity, components.InputIntent) ? world.getComponent(entity, components.InputIntent) : null,
        route: world.hasComponent(entity, components.AIRouteIntent) ? world.getComponent(entity, components.AIRouteIntent) : null
      }));
    }
  };

  return defineInjectedRuntimeKit(nexusEngine, {
    id: "racer-ai-kit",
    components: {
      Racer: components.Racer,
      AIRacer: components.AIRacer,
      Position: components.Position,
      InputIntent: components.InputIntent,
      TrackProgress: components.TrackProgress,
      AIDriver: components.AIDriver,
      AIRouteIntent: components.AIRouteIntent
    },
    resources: {
      RaceState: resources.RaceState,
      CourseState: resources.CourseState,
      DifficultyState: resources.DifficultyState,
      PacingState: resources.PacingState
    },
    events: {
      AIDecision: events.AIDecision
    },
    systems: [
      { phase: "input", name: "racerAIDriverSystem", system: createAIDriverSystem(definitions, options) }
    ],
    provides: ["arcade-race", "racer-ai"],
    bindings: {
      racerAI: bindings
    },
    install({ engine }) {
      engine.racerAI = bindings;
    },
    metadata: {
      version: RACER_AI_KIT_VERSION,
      coreVersion: ARCADE_RACE_CORE_VERSION,
      purpose: "AI route choice, obstacle avoidance, boost targeting, mistake injection, aggression tuning, and scalable driving skill.",
      usesNexusEngineKits: ["runtime-kit", "pathfinding-compatible", "navmesh-compatible"]
    }
  });
}
