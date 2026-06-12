import {
  ARCADE_RACE_CORE_VERSION,
  clamp,
  computeProgress,
  createArcadeRaceDefinitions,
  createRaceSurfaces,
  defineInjectedRuntimeKit,
  ensureResource,
  getClockElapsed,
  number,
  progressDistanceToFinish,
  sortRacersByProgress
} from "../arcade-race-core/index.js";

export const DOWNHILL_RACE_KIT_VERSION = "0.0.1";

function createDefaultRaceConfig(options = {}) {
  return {
    countdownSeconds: number(options.countdownSeconds, 3),
    autoCountdown: options.autoCountdown ?? true,
    autoAdvanceRounds: options.autoAdvanceRounds ?? false,
    roundResetDelay: number(options.roundResetDelay, 2.5),
    progressAxis: options.progressAxis ?? "z",
    start: number(options.start, 0),
    finish: number(options.finish, 1000),
    finishProgress: number(options.finishProgress, 1),
    minRacersToStart: number(options.minRacersToStart, 1),
    playerRole: options.playerRole ?? "player"
  };
}

function createInitialRaceState(options = {}) {
  return {
    status: options.status ?? "waiting",
    countdown: 0,
    countdownStartedAt: null,
    startedAt: null,
    finishedAt: null,
    elapsed: 0,
    winner: null,
    playerFinished: false,
    playerPlacement: null,
    placements: [],
    registered: 0,
    finished: 0,
    round: number(options.round, 1)
  };
}

function createInitialRoundState(options = {}) {
  return {
    round: number(options.round, 1),
    heat: number(options.heat, 1),
    attempts: 0,
    wins: 0,
    losses: 0,
    lastPlacement: null,
    lastWinner: null
  };
}

function registerRacer(world, definitions, entity, config = {}) {
  const { components, events } = definitions;
  const racer = {
    id: config.id ?? `racer-${entity}`,
    role: config.role ?? "ai",
    team: config.team ?? null,
    lane: number(config.lane, 0),
    displayName: config.displayName ?? config.id ?? `Racer ${entity}`,
    registeredAt: getClockElapsed(world)
  };
  world.setComponent(entity, components.Racer, racer);
  if (config.player || racer.role === "player") {
    world.setComponent(entity, components.PlayerRacer, { id: racer.id });
  }
  if (config.ai || racer.role === "ai") {
    world.setComponent(entity, components.AIRacer, { id: racer.id });
  }
  world.setComponent(entity, components.TrackProgress, {
    progress: 0,
    distanceToFinish: Infinity,
    finished: false,
    finishTime: null,
    lastProgress: 0,
    sector: 0
  });
  world.setComponent(entity, components.RacePlacement, {
    rank: null,
    previousRank: null,
    finishedRank: null,
    delta: 0
  });
  world.emit(events.RacerRegistered, { entity, racer });
  return racer;
}

function resetRacerProgress(world, definitions) {
  const { components } = definitions;
  for (const entity of world.query(components.Racer)) {
    if (world.hasComponent(entity, components.TrackProgress)) {
      const progress = world.getComponent(entity, components.TrackProgress);
      progress.progress = 0;
      progress.distanceToFinish = Infinity;
      progress.finished = false;
      progress.finishTime = null;
      progress.lastProgress = 0;
      progress.sector = 0;
    } else {
      world.setComponent(entity, components.TrackProgress, {
        progress: 0,
        distanceToFinish: Infinity,
        finished: false,
        finishTime: null,
        lastProgress: 0,
        sector: 0
      });
    }

    if (world.hasComponent(entity, components.RacePlacement)) {
      const placement = world.getComponent(entity, components.RacePlacement);
      placement.rank = null;
      placement.previousRank = null;
      placement.finishedRank = null;
      placement.delta = 0;
    } else {
      world.setComponent(entity, components.RacePlacement, {
        rank: null,
        previousRank: null,
        finishedRank: null,
        delta: 0
      });
    }
  }
}

function startCountdown(world, definitions, override = {}) {
  const { resources, events } = definitions;
  const config = ensureResource(world, resources.RaceConfig, () => createDefaultRaceConfig());
  const state = ensureResource(world, resources.RaceState, () => createInitialRaceState());
  const now = getClockElapsed(world);
  state.status = "countdown";
  state.countdown = number(override.countdownSeconds, config.countdownSeconds);
  state.countdownStartedAt = now;
  state.startedAt = null;
  state.finishedAt = null;
  state.winner = null;
  state.finished = 0;
  state.playerFinished = false;
  state.playerPlacement = null;
  state.placements = [];
  resetRacerProgress(world, definitions);
  world.emit(events.RaceCountdownStarted, { countdown: state.countdown, at: now });
  return state;
}

function startRace(world, definitions) {
  const { resources, events } = definitions;
  const state = ensureResource(world, resources.RaceState, () => createInitialRaceState());
  const now = getClockElapsed(world);
  state.status = "racing";
  state.countdown = 0;
  state.startedAt = now;
  state.finishedAt = null;
  state.elapsed = 0;
  state.winner = null;
  state.finished = 0;
  state.playerFinished = false;
  state.playerPlacement = null;
  state.placements = [];
  resetRacerProgress(world, definitions);
  world.emit(events.RaceStarted, { at: now, round: state.round });
  return state;
}

function finishRace(world, definitions, reason = "complete") {
  const { resources, events } = definitions;
  const state = ensureResource(world, resources.RaceState, () => createInitialRaceState());
  if (state.status === "finished") return state;
  const now = getClockElapsed(world);
  state.status = "finished";
  state.finishedAt = now;
  state.elapsed = state.startedAt === null ? 0 : now - state.startedAt;
  const placements = sortRacersByProgress(world, definitions.components);
  state.placements = placements.map(({ entity, racer, progress, placement }, index) => ({
    entity,
    id: racer.id,
    role: racer.role,
    rank: placement?.finishedRank ?? index + 1,
    progress: number(progress.progress),
    finishTime: progress.finishTime
  }));
  state.winner = state.placements[0] ?? null;
  world.emit(events.RaceFinished, { reason, at: now, elapsed: state.elapsed, winner: state.winner, placements: state.placements });
  const player = state.placements.find((entry) => entry.role === "player");
  if (player && player.rank === 1) {
    world.emit(events.RaceWon, { player, placements: state.placements });
  } else if (player) {
    world.emit(events.RaceLost, { player, placements: state.placements });
  }
  return state;
}

function createCountdownSystem(definitions) {
  const { components, resources } = definitions;
  return function downhillRaceCountdownSystem(world) {
    const config = ensureResource(world, resources.RaceConfig, () => createDefaultRaceConfig());
    const state = ensureResource(world, resources.RaceState, () => createInitialRaceState());
    const racers = world.query(components.Racer).length;
    state.registered = racers;

    if (state.status === "waiting" && config.autoCountdown && racers >= config.minRacersToStart) {
      startCountdown(world, definitions);
      return;
    }

    if (state.status !== "countdown") return;

    const now = getClockElapsed(world);
    const startedAt = number(state.countdownStartedAt, now);
    const remaining = Math.max(0, number(config.countdownSeconds, 3) - (now - startedAt));
    state.countdown = remaining;
    if (remaining <= 0) {
      startRace(world, definitions);
    }
  };
}

function createProgressSystem(definitions, options) {
  const { components, resources, events } = definitions;
  return function downhillRaceProgressSystem(world) {
    const state = ensureResource(world, resources.RaceState, () => createInitialRaceState(options));
    const config = ensureResource(world, resources.RaceConfig, () => createDefaultRaceConfig(options));
    const course = world.getResource(resources.CourseState) ?? config;
    if (state.status !== "racing") return;

    const now = getClockElapsed(world);
    state.elapsed = state.startedAt === null ? 0 : now - state.startedAt;

    for (const entity of world.query(components.Racer, components.Position, components.TrackProgress)) {
      const position = world.getComponent(entity, components.Position);
      const racer = world.getComponent(entity, components.Racer);
      const progress = world.getComponent(entity, components.TrackProgress);
      progress.lastProgress = number(progress.progress);
      progress.progress = computeProgress(position, course, config);
      progress.distanceToFinish = progressDistanceToFinish(position, course, config);
      progress.sector = Math.floor(progress.progress * number(course.sectors, options.sectors ?? 8));

      if (!progress.finished && progress.progress >= number(config.finishProgress, 1)) {
        progress.finished = true;
        progress.finishTime = state.elapsed;
        state.finished += 1;
        const finishedRank = state.finished;
        const placement = world.hasComponent(entity, components.RacePlacement)
          ? world.getComponent(entity, components.RacePlacement)
          : world.setComponent(entity, components.RacePlacement, {});
        placement.finishedRank = finishedRank;
        if (racer.role === config.playerRole) {
          state.playerFinished = true;
          state.playerPlacement = finishedRank;
        }
        world.emit(events.RacerFinished, {
          entity,
          racer,
          rank: finishedRank,
          elapsed: state.elapsed,
          progress: progress.progress
        });
      }
    }

    const totalRacers = world.query(components.Racer).length;
    if (totalRacers > 0 && state.finished >= totalRacers) {
      finishRace(world, definitions, "all-racers-finished");
    }
  };
}

function createPlacementSystem(definitions) {
  const { components, resources, events } = definitions;
  return function downhillRacePlacementSystem(world) {
    const state = ensureResource(world, resources.RaceState, () => createInitialRaceState());
    const ranked = sortRacersByProgress(world, components);
    const placements = [];

    ranked.forEach(({ entity, racer, progress }, index) => {
      const placement = world.hasComponent(entity, components.RacePlacement)
        ? world.getComponent(entity, components.RacePlacement)
        : world.setComponent(entity, components.RacePlacement, {});
      const nextRank = progress.finished && placement.finishedRank
        ? placement.finishedRank
        : index + 1;
      if (placement.rank !== nextRank) {
        placement.previousRank = placement.rank;
        placement.rank = nextRank;
        placement.delta = placement.previousRank === null || placement.previousRank === undefined
          ? 0
          : placement.previousRank - nextRank;
        world.emit(events.PlacementChanged, {
          entity,
          racer,
          rank: placement.rank,
          previousRank: placement.previousRank,
          delta: placement.delta
        });
      }
      placements.push({
        entity,
        id: racer.id,
        role: racer.role,
        rank: placement.rank,
        progress: number(progress.progress),
        finished: Boolean(progress.finished),
        finishTime: progress.finishTime
      });
    });

    state.placements = placements;
  };
}

function createRoundProgressionSystem(definitions, options) {
  const { resources, events } = definitions;
  return function downhillRaceRoundProgressionSystem(world) {
    const config = ensureResource(world, resources.RaceConfig, () => createDefaultRaceConfig(options));
    if (!config.autoAdvanceRounds) return;
    const state = ensureResource(world, resources.RaceState, () => createInitialRaceState(options));
    const round = ensureResource(world, resources.RoundState, () => createInitialRoundState(options));
    if (state.status !== "finished" || state.finishedAt === null) return;

    const now = getClockElapsed(world);
    if (now - state.finishedAt < number(config.roundResetDelay, 2.5)) return;

    round.round += 1;
    round.heat += 1;
    round.attempts += 1;
    round.lastPlacement = state.playerPlacement;
    round.lastWinner = state.winner;
    if (state.playerPlacement === 1) round.wins += 1;
    else round.losses += 1;

    state.round = round.round;
    world.emit(events.RoundAdvanced, { round: round.round, heat: round.heat, previousWinner: round.lastWinner });
    startCountdown(world, definitions);
  };
}

export function createDownhillRaceKit(nexusRealtime = {}, options = {}) {
  const definitions = createArcadeRaceDefinitions(nexusRealtime, options);
  const { components, resources, events } = definitions;

  const bindings = {
    definitions,
    createSurfaces: (engine) => createRaceSurfaces(engine, definitions),
    registerRacer: (world, entity, config) => registerRacer(world, definitions, entity, config),
    startCountdown: (world, override) => startCountdown(world, definitions, override),
    startRace: (world) => startRace(world, definitions),
    finishRace: (world, reason) => finishRace(world, definitions, reason),
    resetRace: (world) => {
      const state = ensureResource(world, resources.RaceState, () => createInitialRaceState(options));
      Object.assign(state, createInitialRaceState({ round: state.round }));
      resetRacerProgress(world, definitions);
      return state;
    },
    snapshot: (world) => ({
      state: world.getResource(resources.RaceState),
      round: world.getResource(resources.RoundState),
      racers: sortRacersByProgress(world, components).map(({ entity, racer, progress, placement }) => ({
        entity,
        racer,
        progress,
        placement
      }))
    })
  };

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: "downhill-race-kit",
    components: {
      Racer: components.Racer,
      PlayerRacer: components.PlayerRacer,
      AIRacer: components.AIRacer,
      Position: components.Position,
      TrackProgress: components.TrackProgress,
      RacePlacement: components.RacePlacement
    },
    resources: {
      RaceState: resources.RaceState,
      RaceConfig: resources.RaceConfig,
      RoundState: resources.RoundState,
      CourseState: resources.CourseState
    },
    events: {
      RaceCountdownStarted: events.RaceCountdownStarted,
      RaceStarted: events.RaceStarted,
      RaceFinished: events.RaceFinished,
      RacerRegistered: events.RacerRegistered,
      RacerFinished: events.RacerFinished,
      PlacementChanged: events.PlacementChanged,
      RoundAdvanced: events.RoundAdvanced,
      RaceWon: events.RaceWon,
      RaceLost: events.RaceLost
    },
    systems: [
      { phase: "input", name: "downhillRaceCountdownSystem", system: createCountdownSystem(definitions) },
      { phase: "simulate", name: "downhillRaceProgressSystem", system: createProgressSystem(definitions, options) },
      { phase: "resolve", name: "downhillRacePlacementSystem", system: createPlacementSystem(definitions) },
      { phase: "cleanup", name: "downhillRaceRoundProgressionSystem", system: createRoundProgressionSystem(definitions, options) }
    ],
    provides: ["arcade-race", "downhill-race"],
    bindings: {
      downhillRace: bindings
    },
    initWorld({ world }) {
      ensureResource(world, resources.RaceConfig, () => createDefaultRaceConfig(options));
      ensureResource(world, resources.RaceState, () => createInitialRaceState(options));
      ensureResource(world, resources.RoundState, () => createInitialRoundState(options));
    },
    install({ engine }) {
      engine.downhillRace = bindings;
    },
    metadata: {
      version: DOWNHILL_RACE_KIT_VERSION,
      coreVersion: ARCADE_RACE_CORE_VERSION,
      purpose: "Race countdown, registration, finish detection, placement, rounds, and win/loss events.",
      usesNexusRealtimeKits: ["runtime-kit", "surfaces", "common-game-definitions"]
    }
  });
}
