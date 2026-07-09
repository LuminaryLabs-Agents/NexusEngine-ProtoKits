import {
  ARCADE_RACE_CORE_VERSION,
  clamp,
  createArcadeRaceDefinitions,
  defineInjectedRuntimeKit,
  ensureResource,
  number
} from "../arcade-race-core/index.js";

export const DIFFICULTY_CURVE_KIT_VERSION = "0.0.1";

function createDifficultyConfig(options = {}) {
  return {
    baseSkill: number(options.baseSkill, 0.16),
    maxSkill: number(options.maxSkill, 0.94),
    baseAggression: number(options.baseAggression, 0.12),
    maxAggression: number(options.maxAggression, 0.82),
    baseMistakeRate: number(options.baseMistakeRate, 0.9),
    minMistakeRate: number(options.minMistakeRate, 0.08),
    baseAvoidanceSkill: number(options.baseAvoidanceSkill, 0.18),
    maxAvoidanceSkill: number(options.maxAvoidanceSkill, 0.92),
    baseBoostSkill: number(options.baseBoostSkill, 0.12),
    maxBoostSkill: number(options.maxBoostSkill, 0.9),
    basePacingPressure: number(options.basePacingPressure, 0.16),
    maxPacingPressure: number(options.maxPacingPressure, 0.78),
    growth: number(options.growth, 0.55),
    softCapRound: Math.max(2, number(options.softCapRound, 24))
  };
}

function logarithmicT(round, config) {
  const r = Math.max(1, number(round, 1));
  const growth = Math.max(0.0001, number(config.growth, 0.55));
  const cap = Math.max(2, number(config.softCapRound, 24));
  return clamp(Math.log1p((r - 1) * growth) / Math.log1p((cap - 1) * growth), 0, 1);
}

function interpolateDifficulty(round, config) {
  const t = logarithmicT(round, config);
  const skill = config.baseSkill + (config.maxSkill - config.baseSkill) * t;
  const aggression = config.baseAggression + (config.maxAggression - config.baseAggression) * Math.pow(t, 1.18);
  const mistakeRate = config.baseMistakeRate + (config.minMistakeRate - config.baseMistakeRate) * t;
  const avoidanceSkill = config.baseAvoidanceSkill + (config.maxAvoidanceSkill - config.baseAvoidanceSkill) * Math.pow(t, 0.86);
  const boostSkill = config.baseBoostSkill + (config.maxBoostSkill - config.baseBoostSkill) * Math.pow(t, 0.92);
  const pacingPressure = config.basePacingPressure + (config.maxPacingPressure - config.basePacingPressure) * Math.pow(t, 1.05);
  return {
    round,
    t,
    skill: clamp(skill, 0, 1),
    aggression: clamp(aggression, 0, 1),
    mistakeRate: clamp(mistakeRate, 0, 1),
    avoidanceSkill: clamp(avoidanceSkill, 0, 1),
    boostSkill: clamp(boostSkill, 0, 1),
    pacingPressure: clamp(pacingPressure, 0, 1),
    modifiers: {
      speed: clamp(0.88 + skill * 0.26, 0.75, 1.25),
      reaction: clamp(1 - skill * 0.68, 0.18, 1),
      steering: clamp(0.65 + skill * 0.55, 0.45, 1.28),
      hazardRead: avoidanceSkill,
      boostRead: boostSkill,
      contact: aggression,
      pacing: pacingPressure
    }
  };
}

function createDifficultySystem(definitions, options = {}) {
  const { components, resources, events } = definitions;
  const config = createDifficultyConfig(options);

  return function difficultyCurveSystem(world) {
    const roundState = ensureResource(world, resources.RoundState, () => ({ round: number(options.round, 1) }));
    const difficulty = ensureResource(world, resources.DifficultyState, () => ({
      ...interpolateDifficulty(number(roundState.round, 1), config),
      previousRound: null
    }));

    const round = number(roundState.round, 1);
    if (difficulty.round !== round) {
      const previous = { ...difficulty };
      Object.assign(difficulty, interpolateDifficulty(round, config), {
        previousRound: previous.round,
        changedAt: world.__nexusClock?.elapsed ?? 0
      });
      world.emit(events.DifficultyChanged, {
        round,
        previous,
        difficulty: { ...difficulty }
      });
    }

    for (const entity of world.query(components.AIRacer)) {
      const current = world.hasComponent(entity, components.DifficultyTuning)
        ? world.getComponent(entity, components.DifficultyTuning)
        : {};
      current.skill = difficulty.skill;
      current.aggression = difficulty.aggression;
      current.mistakeRate = difficulty.mistakeRate;
      current.avoidanceSkill = difficulty.avoidanceSkill;
      current.boostSkill = difficulty.boostSkill;
      current.pacingPressure = difficulty.pacingPressure;
      current.modifiers = difficulty.modifiers;
      world.setComponent(entity, components.DifficultyTuning, current);
    }
  };
}

export function createDifficultyCurveKit(nexusEngine = {}, options = {}) {
  const definitions = createArcadeRaceDefinitions(nexusEngine, options);
  const { components, resources, events } = definitions;
  const config = createDifficultyConfig(options);

  const bindings = {
    definitions,
    config,
    evaluate(round) {
      return interpolateDifficulty(round, config);
    },
    setRound(world, round) {
      const roundState = ensureResource(world, resources.RoundState, () => ({ round: 1 }));
      roundState.round = Math.max(1, Math.floor(number(round, 1)));
      return roundState;
    },
    snapshot(world) {
      return {
        round: world.getResource(resources.RoundState),
        difficulty: world.getResource(resources.DifficultyState)
      };
    }
  };

  return defineInjectedRuntimeKit(nexusEngine, {
    id: "difficulty-curve-kit",
    components: {
      AIRacer: components.AIRacer,
      DifficultyTuning: components.DifficultyTuning
    },
    resources: {
      RoundState: resources.RoundState,
      DifficultyState: resources.DifficultyState
    },
    events: {
      DifficultyChanged: events.DifficultyChanged
    },
    systems: [
      { phase: "input", name: "difficultyCurveSystem", system: createDifficultySystem(definitions, options) }
    ],
    provides: ["arcade-race", "difficulty-curve"],
    bindings: {
      difficultyCurve: bindings
    },
    initWorld({ world }) {
      ensureResource(world, resources.RoundState, () => ({ round: number(options.round, 1), heat: 1 }));
      ensureResource(world, resources.DifficultyState, () => interpolateDifficulty(number(options.round, 1), config));
    },
    install({ engine }) {
      engine.difficultyCurve = bindings;
    },
    metadata: {
      version: DIFFICULTY_CURVE_KIT_VERSION,
      coreVersion: ARCADE_RACE_CORE_VERSION,
      purpose: "Logarithmic round scaling for AI skill, mistakes, aggression, pacing, boost targeting, and obstacle avoidance.",
      curve: "log1p"
    }
  });
}
