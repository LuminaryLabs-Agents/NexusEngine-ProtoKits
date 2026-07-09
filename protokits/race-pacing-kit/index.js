import {
  ARCADE_RACE_CORE_VERSION,
  clamp,
  createArcadeRaceDefinitions,
  defineInjectedRuntimeKit,
  ensureResource,
  getClockElapsed,
  number,
  sortRacersByProgress
} from "../arcade-race-core/index.js";

export const RACE_PACING_KIT_VERSION = "0.0.1";

function defaultPacing(options = {}) {
  return {
    targetPackSpread: number(options.targetPackSpread, 0.12),
    earlyRoundBackoff: number(options.earlyRoundBackoff, 0.18),
    trailingAssist: number(options.trailingAssist, 0.12),
    leaderRestraint: number(options.leaderRestraint, 0.1),
    nearMissProgressGap: number(options.nearMissProgressGap, 0.025),
    closeFinishStartProgress: number(options.closeFinishStartProgress, 0.82),
    maxAdjustment: number(options.maxAdjustment, 0.18),
    pressure: 0,
    playerRank: null,
    leaderGap: 0,
    packSpread: 0,
    closeFinish: false,
    updatedAt: 0
  };
}

function getDifficulty(world, resources) {
  return world.getResource(resources.DifficultyState) ?? {};
}

function createPacingSystem(definitions, options = {}) {
  const { components, resources, events } = definitions;

  return function racePacingSystem(world) {
    const state = world.getResource(resources.RaceState);
    if (options.requireRacing !== false && state && state.status !== "racing") return;

    const pacing = ensureResource(world, resources.PacingState, () => defaultPacing(options));
    const difficulty = getDifficulty(world, resources);
    const ranked = sortRacersByProgress(world, components);
    if (ranked.length === 0) return;

    const playerIndex = ranked.findIndex((entry) => entry.racer.role === "player");
    const player = playerIndex >= 0 ? ranked[playerIndex] : ranked[0];
    const leader = ranked[0];
    const tail = ranked[ranked.length - 1];
    const playerProgress = number(player.progress.progress);
    const leaderProgress = number(leader.progress.progress);
    const tailProgress = number(tail.progress.progress);
    const spread = Math.max(0, leaderProgress - tailProgress);
    const leaderGap = Math.max(0, leaderProgress - playerProgress);
    const closeFinish = playerProgress >= number(pacing.closeFinishStartProgress, 0.82);
    const round = number(world.getResource(resources.RoundState)?.round, 1);
    const lateRoundIntensity = clamp(Math.log1p(round) / Math.log1p(number(options.fullIntensityRound, 18)), 0, 1);
    const difficultyPressure = clamp(number(difficulty.pacingPressure, 0) + lateRoundIntensity * 0.35, 0, 1);

    pacing.playerRank = playerIndex + 1;
    pacing.leaderGap = leaderGap;
    pacing.packSpread = spread;
    pacing.closeFinish = closeFinish;
    pacing.pressure = clamp(difficultyPressure + (spread < number(pacing.targetPackSpread, 0.12) ? 0.08 : -0.04), 0, 1);
    pacing.updatedAt = getClockElapsed(world);

    const targetSpread = number(pacing.targetPackSpread, 0.12);
    const maxAdjustment = number(pacing.maxAdjustment, 0.18);
    const assist = spread > targetSpread ? number(pacing.trailingAssist, 0.12) : number(pacing.trailingAssist, 0.12) * 0.35;
    const restraint = spread > targetSpread ? number(pacing.leaderRestraint, 0.1) : number(pacing.leaderRestraint, 0.1) * 0.25;

    for (const entry of ranked) {
      const { entity, racer, progress } = entry;
      if (racer.role !== "ai") continue;

      const gapToPlayer = number(progress.progress) - playerProgress;
      const aheadOfPlayer = gapToPlayer > 0;
      const behindPlayer = gapToPlayer < 0;
      const nearPlayer = Math.abs(gapToPlayer) <= number(pacing.nearMissProgressGap, 0.025);
      const earlyBackoff = number(pacing.earlyRoundBackoff, 0.18) * (1 - lateRoundIntensity);
      let speedAdjustment = 0;

      if (aheadOfPlayer && leaderGap > targetSpread * 0.55 && !closeFinish) {
        speedAdjustment -= restraint + earlyBackoff;
      }
      if (behindPlayer && Math.abs(gapToPlayer) > targetSpread * 0.35) {
        speedAdjustment += assist * (0.55 + difficultyPressure * 0.45);
      }
      if (closeFinish) {
        speedAdjustment += aheadOfPlayer ? -restraint * 0.45 : assist * 0.35;
      }

      speedAdjustment = clamp(speedAdjustment, -maxAdjustment, maxAdjustment);

      if (world.hasComponent(entity, components.SlopeTraversal)) {
        const traversal = world.getComponent(entity, components.SlopeTraversal);
        traversal.baseMaxSpeed = number(traversal.baseMaxSpeed, number(traversal.maxSpeed, options.maxSpeed ?? 42));
        traversal.pacingSpeedMultiplier = clamp(1 + speedAdjustment, 0.75, 1.25);
        traversal.maxSpeed = traversal.baseMaxSpeed * traversal.pacingSpeedMultiplier;
      }

      if (world.hasComponent(entity, components.AIDriver)) {
        const driver = world.getComponent(entity, components.AIDriver);
        driver.pacingPressure = pacing.pressure;
        driver.aggression = clamp(number(driver.aggression, 0.2) + (nearPlayer ? 0.04 : 0) + difficultyPressure * 0.015, 0, 1);
        if (aheadOfPlayer && !closeFinish) {
          driver.aggression = clamp(driver.aggression - earlyBackoff * 0.25, 0, 1);
        }
      }

      if (nearPlayer && (!pacing.lastNearMissAt || pacing.updatedAt - pacing.lastNearMissAt > number(options.nearMissCooldown, 0.75))) {
        pacing.lastNearMissAt = pacing.updatedAt;
        world.emit(events.PacingAdjusted, {
          kind: "near-miss",
          entity,
          player: player.entity,
          gap: gapToPlayer,
          pressure: pacing.pressure
        });
      }
    }

    if (!pacing.lastEmitAt || pacing.updatedAt - pacing.lastEmitAt > number(options.emitInterval, 1)) {
      pacing.lastEmitAt = pacing.updatedAt;
      world.emit(events.PacingAdjusted, {
        kind: "pack",
        playerRank: pacing.playerRank,
        leaderGap,
        spread,
        pressure: pacing.pressure,
        closeFinish
      });
    }
  };
}

export function createRacePacingKit(nexusEngine = {}, options = {}) {
  const definitions = createArcadeRaceDefinitions(nexusEngine, options);
  const { components, resources, events } = definitions;

  const bindings = {
    definitions,
    snapshot(world) {
      return {
        pacing: world.getResource(resources.PacingState),
        placements: sortRacersByProgress(world, components).map(({ entity, racer, progress, placement }) => ({
          entity,
          racer,
          progress,
          placement
        }))
      };
    }
  };

  return defineInjectedRuntimeKit(nexusEngine, {
    id: "race-pacing-kit",
    components: {
      Racer: components.Racer,
      AIRacer: components.AIRacer,
      TrackProgress: components.TrackProgress,
      RacePlacement: components.RacePlacement,
      SlopeTraversal: components.SlopeTraversal,
      AIDriver: components.AIDriver,
      PacingState: components.PacingState
    },
    resources: {
      RaceState: resources.RaceState,
      RoundState: resources.RoundState,
      DifficultyState: resources.DifficultyState,
      PacingState: resources.PacingState
    },
    events: {
      PacingAdjusted: events.PacingAdjusted
    },
    systems: [
      { phase: "resolve", name: "racePacingSystem", system: createPacingSystem(definitions, options) }
    ],
    provides: ["arcade-race", "race-pacing"],
    bindings: {
      racePacing: bindings
    },
    initWorld({ world }) {
      ensureResource(world, resources.PacingState, () => defaultPacing(options));
    },
    install({ engine }) {
      engine.racePacing = bindings;
    },
    metadata: {
      version: RACE_PACING_KIT_VERSION,
      coreVersion: ARCADE_RACE_CORE_VERSION,
      purpose: "Pack pressure, near-misses, comeback pressure, AI backing off, late-round intensity, and close-finish tuning.",
      usesNexusEngineKits: ["runtime-kit", "surfaces"]
    }
  });
}
