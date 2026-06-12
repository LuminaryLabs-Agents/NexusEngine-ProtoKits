export const SURVIVAL_ROUND_KIT_VERSION = "0.0.1";

const DEFAULT_CONFIG = Object.freeze({
  autoStart: true,
  initialBreathingSeconds: 2,
  breathingSeconds: 8,
  baseDurationSeconds: 45,
  durationGrowthSeconds: 8,
  baseSpawnBudget: 10,
  spawnBudgetGrowth: 6,
  baseEnemyCap: 8,
  enemyCapGrowth: 2,
  maxEnemyCap: 42,
  baseIntensity: 0.35,
  intensityGrowth: 0.12,
  maxIntensity: 2.75,
  eliteEvery: 3,
  bossEvery: 5,
  eliteBudgetBonus: 6,
  bossBudgetBonus: 18,
  completeWhenBudgetCleared: true
});

function requireRuntime(nexusRealtime) {
  const missing = ["defineRuntimeKit", "defineResource", "defineEvent"]
    .filter((name) => typeof nexusRealtime?.[name] !== "function");
  if (missing.length > 0) {
    throw new TypeError(`createSurvivalRoundKit requires NexusRealtime runtime helpers: ${missing.join(", ")}`);
  }
  return nexusRealtime;
}

function ensureNamespace(engine) {
  if (!engine.zombieOrchard) engine.zombieOrchard = {};
  return engine.zombieOrchard;
}

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function integer(value, fallback = 0) {
  return Math.max(0, Math.floor(number(value, fallback)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clockDelta(world) {
  return clamp(number(world.__nexusClock?.delta, 1 / 60), 0, 1);
}

function mergeConfig(config = {}) {
  return { ...DEFAULT_CONFIG, ...config };
}

function getRoundOverride(config, round) {
  const rounds = Array.isArray(config.rounds) ? config.rounds : [];
  return rounds.find((entry) => integer(entry?.round, -1) === round) ?? null;
}

function resolveValue(value, context, fallback) {
  if (typeof value === "function") {
    return value(context);
  }
  return value ?? fallback;
}

function createRoundPlan(round, config = {}) {
  const merged = mergeConfig(config);
  const override = getRoundOverride(merged, round) ?? {};
  const context = { round, config: merged, override };

  const eliteWave = Boolean(
    override.eliteWave ?? (
      merged.eliteEvery > 0 &&
      round > 0 &&
      round % integer(merged.eliteEvery, 0) === 0
    )
  );
  const bossWave = Boolean(
    override.bossWave ?? (
      merged.bossEvery > 0 &&
      round > 0 &&
      round % integer(merged.bossEvery, 0) === 0
    )
  );

  const intensity = clamp(
    number(
      resolveValue(
        override.intensity ?? merged.intensityCurve,
        context,
        number(merged.baseIntensity, 0.35) + (round - 1) * number(merged.intensityGrowth, 0.12)
      ),
      0.35
    ),
    0,
    number(merged.maxIntensity, 2.75)
  );

  const durationSeconds = Math.max(
    1,
    number(
      resolveValue(
        override.durationSeconds,
        context,
        number(merged.baseDurationSeconds, 45) + (round - 1) * number(merged.durationGrowthSeconds, 8)
      ),
      45
    )
  );

  const baseBudget = number(
    resolveValue(
      override.spawnBudget,
      context,
      number(merged.baseSpawnBudget, 10) + (round - 1) * number(merged.spawnBudgetGrowth, 6)
    ),
    10
  );
  const spawnBudget = Math.max(
    0,
    Math.round(baseBudget + (eliteWave ? number(merged.eliteBudgetBonus, 6) : 0) + (bossWave ? number(merged.bossBudgetBonus, 18) : 0))
  );

  const enemyCap = clamp(
    integer(
      resolveValue(
        override.enemyCap,
        context,
        number(merged.baseEnemyCap, 8) + (round - 1) * number(merged.enemyCapGrowth, 2)
      ),
      8
    ),
    1,
    integer(merged.maxEnemyCap, 42)
  );

  const breathingSeconds = Math.max(0, number(override.breathingSeconds ?? merged.breathingSeconds, 8));

  return Object.freeze({
    round,
    durationSeconds,
    breathingSeconds,
    spawnBudget,
    enemyCap,
    intensity,
    eliteWave,
    bossWave,
    eliteRules: override.eliteRules ?? merged.eliteRules ?? {},
    bossRules: override.bossRules ?? merged.bossRules ?? {},
    spawnWeights: override.spawnWeights ?? merged.spawnWeights ?? {},
    modifiers: override.modifiers ?? {}
  });
}

function createInitialState(config = {}) {
  const merged = mergeConfig(config);
  const nextRound = Math.max(1, integer(merged.initialRound, 0) + 1);
  const autoStart = merged.autoStart !== false;
  return {
    id: merged.id ?? "zombie-orchard-survival-rounds",
    status: autoStart ? "between" : "idle",
    round: integer(merged.initialRound, 0),
    nextRound,
    phaseTime: 0,
    roundElapsed: 0,
    roundDuration: 0,
    betweenRemaining: autoStart ? Math.max(0, number(merged.initialBreathingSeconds, 2)) : 0,
    spawnBudgetTotal: 0,
    spawnBudgetRemaining: 0,
    enemyCap: integer(merged.baseEnemyCap, 8),
    activeEnemies: 0,
    defeatedEnemies: 0,
    intensity: 0,
    eliteWave: false,
    bossWave: false,
    spawnPlan: null,
    history: [],
    lastReason: "initialized"
  };
}

function trimHistory(history, entry, maxHistory = 16) {
  return [...(history ?? []), entry].slice(-maxHistory);
}

function startRound(world, definitions, config, requestedRound, reason = "scheduled") {
  const current = world.getResource(definitions.SurvivalRoundState) ?? createInitialState(config);
  const round = Math.max(1, integer(requestedRound, current.nextRound || 1));
  const plan = createRoundPlan(round, config);
  const next = {
    ...current,
    status: "active",
    round,
    nextRound: round + 1,
    phaseTime: 0,
    roundElapsed: 0,
    roundDuration: plan.durationSeconds,
    betweenRemaining: 0,
    spawnBudgetTotal: plan.spawnBudget,
    spawnBudgetRemaining: plan.spawnBudget,
    enemyCap: plan.enemyCap,
    activeEnemies: 0,
    defeatedEnemies: 0,
    intensity: plan.intensity,
    eliteWave: plan.eliteWave,
    bossWave: plan.bossWave,
    spawnPlan: plan,
    lastReason: reason,
    history: trimHistory(current.history, {
      type: "round-started",
      round,
      frame: world.__nexusClock?.frame ?? 0,
      plan
    })
  };
  world.setResource(definitions.SurvivalRoundState, next);
  world.emit(definitions.SurvivalRoundStarted, { round, plan, reason });
  if (plan.eliteWave) world.emit(definitions.EliteWaveQueued, { round, rules: plan.eliteRules, plan });
  if (plan.bossWave) world.emit(definitions.BossWaveQueued, { round, rules: plan.bossRules, plan });
  return next;
}

function completeRound(world, definitions, config, reason = "survived") {
  const current = world.getResource(definitions.SurvivalRoundState) ?? createInitialState(config);
  if (current.status !== "active") return current;

  const plan = current.spawnPlan ?? createRoundPlan(current.round || 1, config);
  const next = {
    ...current,
    status: "between",
    phaseTime: 0,
    betweenRemaining: Math.max(0, number(plan.breathingSeconds, mergeConfig(config).breathingSeconds)),
    spawnBudgetRemaining: Math.max(0, number(current.spawnBudgetRemaining, 0)),
    activeEnemies: Math.max(0, integer(current.activeEnemies, 0)),
    lastReason: reason,
    history: trimHistory(current.history, {
      type: "round-completed",
      round: current.round,
      frame: world.__nexusClock?.frame ?? 0,
      reason,
      defeatedEnemies: current.defeatedEnemies
    })
  };

  world.setResource(definitions.SurvivalRoundState, next);
  world.emit(definitions.SurvivalRoundCompleted, {
    round: current.round,
    reason,
    nextRound: next.nextRound,
    breathingSeconds: next.betweenRemaining,
    defeatedEnemies: current.defeatedEnemies
  });
  return next;
}

function failRun(world, definitions, config, reason = "player-defeated") {
  const current = world.getResource(definitions.SurvivalRoundState) ?? createInitialState(config);
  const next = {
    ...current,
    status: "failed",
    phaseTime: 0,
    lastReason: reason,
    history: trimHistory(current.history, {
      type: "run-failed",
      round: current.round,
      frame: world.__nexusClock?.frame ?? 0,
      reason
    })
  };
  world.setResource(definitions.SurvivalRoundState, next);
  world.emit(definitions.SurvivalRoundFailed, { round: current.round, reason });
  return next;
}

function applySpawnAccounting(world, definitions, config) {
  let state = world.getResource(definitions.SurvivalRoundState);
  if (!state || state.status !== "active") return state;

  let changed = false;
  let budgetSpent = 0;
  let spawned = 0;
  for (const request of world.readEvents(definitions.HordeSpawnRequested)) {
    if (request.round !== undefined && integer(request.round, state.round) !== state.round) continue;
    const cost = Math.max(0, number(request.budgetCost ?? request.cost, 1));
    budgetSpent += cost;
    spawned += 1;
  }

  let defeated = 0;
  for (const event of world.readEvents(definitions.MonsterDefeated)) {
    if (event.round !== undefined && integer(event.round, state.round) !== state.round) continue;
    defeated += Math.max(1, integer(event.count, 1));
  }

  if (budgetSpent > 0 || spawned > 0 || defeated > 0) {
    state = {
      ...state,
      spawnBudgetRemaining: Math.max(0, number(state.spawnBudgetRemaining, 0) - budgetSpent),
      activeEnemies: Math.max(0, integer(state.activeEnemies, 0) + spawned - defeated),
      defeatedEnemies: integer(state.defeatedEnemies, 0) + defeated
    };
    changed = true;
    if (budgetSpent > 0) {
      world.emit(definitions.RoundBudgetSpent, {
        round: state.round,
        spent: budgetSpent,
        remaining: state.spawnBudgetRemaining
      });
    }
  }

  if (
    changed &&
    mergeConfig(config).completeWhenBudgetCleared !== false &&
    state.spawnBudgetRemaining <= 0 &&
    state.activeEnemies <= 0
  ) {
    world.setResource(definitions.SurvivalRoundState, state);
    return completeRound(world, definitions, config, "budget-cleared");
  }

  if (changed) {
    world.setResource(definitions.SurvivalRoundState, state);
  }
  return state;
}

export function createSurvivalRoundKit(nexusRealtime = {}, config = {}) {
  const runtime = requireRuntime(nexusRealtime);
  const definitions = {
    SurvivalRoundState: runtime.defineResource("zombie-orchard.survival-round.state"),
    HordeSpawnRequested: runtime.defineEvent("zombie-orchard.horde.spawn-requested"),
    MonsterDefeated: runtime.defineEvent("zombie-orchard.monster.defeated"),
    SurvivalRoundStarted: runtime.defineEvent("zombie-orchard.round.started"),
    SurvivalRoundCompleted: runtime.defineEvent("zombie-orchard.round.completed"),
    SurvivalRoundFailed: runtime.defineEvent("zombie-orchard.round.failed"),
    RoundBudgetSpent: runtime.defineEvent("zombie-orchard.round.budget-spent"),
    EliteWaveQueued: runtime.defineEvent("zombie-orchard.round.elite-queued"),
    BossWaveQueued: runtime.defineEvent("zombie-orchard.round.boss-queued")
  };

  function survivalRoundSystem(world) {
    let state = world.getResource(definitions.SurvivalRoundState);
    if (!state) return;

    const dt = clockDelta(world);
    if (state.status === "between") {
      const betweenRemaining = Math.max(0, number(state.betweenRemaining, 0) - dt);
      state = { ...state, phaseTime: number(state.phaseTime, 0) + dt, betweenRemaining };
      world.setResource(definitions.SurvivalRoundState, state);
      if (betweenRemaining <= 0) {
        startRound(world, definitions, config, state.nextRound, "breathing-complete");
      }
      return;
    }

    if (state.status !== "active") return;

    const roundElapsed = number(state.roundElapsed, 0) + dt;
    const phaseTime = number(state.phaseTime, 0) + dt;
    state = {
      ...state,
      roundElapsed,
      phaseTime,
      intensity: state.spawnPlan?.intensity ?? state.intensity
    };
    world.setResource(definitions.SurvivalRoundState, state);

    if (roundElapsed >= number(state.roundDuration, 0)) {
      completeRound(world, definitions, config, "timer-survived");
    }
  }

  function survivalRoundCleanupSystem(world) {
    applySpawnAccounting(world, definitions, config);
  }

  return runtime.defineRuntimeKit({
    id: config.id ?? "zombie-orchard-survival-round-kit",
    resources: {
      SurvivalRoundState: definitions.SurvivalRoundState
    },
    events: {
      SurvivalRoundStarted: definitions.SurvivalRoundStarted,
      SurvivalRoundCompleted: definitions.SurvivalRoundCompleted,
      SurvivalRoundFailed: definitions.SurvivalRoundFailed,
      RoundBudgetSpent: definitions.RoundBudgetSpent,
      EliteWaveQueued: definitions.EliteWaveQueued,
      BossWaveQueued: definitions.BossWaveQueued,
      HordeSpawnRequested: definitions.HordeSpawnRequested,
      MonsterDefeated: definitions.MonsterDefeated
    },
    systems: [
      { phase: "simulate", name: "ZombieOrchardSurvivalRoundSystem", system: survivalRoundSystem },
      { phase: "cleanup", name: "ZombieOrchardSurvivalRoundCleanupSystem", system: survivalRoundCleanupSystem }
    ],
    provides: ["zombie-orchard.rounds"],
    initWorld({ world }) {
      world.setResource(definitions.SurvivalRoundState, createInitialState(config));
    },
    install({ engine }) {
      const namespace = ensureNamespace(engine);
      namespace.survivalRounds = {
        definitions,
        createRoundPlan: (round) => createRoundPlan(round, config),
        getState: () => engine.world.getResource(definitions.SurvivalRoundState),
        startRound: (round, reason) => startRound(engine.world, definitions, config, round, reason ?? "manual"),
        completeRound: (reason) => completeRound(engine.world, definitions, config, reason ?? "manual"),
        failRun: (reason) => failRun(engine.world, definitions, config, reason ?? "manual"),
        registerKill(payload = {}) {
          engine.world.emit(definitions.MonsterDefeated, payload);
          return engine.world.getResource(definitions.SurvivalRoundState);
        },
        spendBudget(payload = {}) {
          engine.world.emit(definitions.HordeSpawnRequested, payload);
          return engine.world.getResource(definitions.SurvivalRoundState);
        },
        setState(patch = {}) {
          const current = engine.world.getResource(definitions.SurvivalRoundState) ?? createInitialState(config);
          const next = { ...current, ...patch };
          engine.world.setResource(definitions.SurvivalRoundState, next);
          return next;
        }
      };
    },
    metadata: {
      version: SURVIVAL_ROUND_KIT_VERSION,
      domain: "zombie-orchard",
      purpose: "Round survival wave state, spawn budgets, caps, intensity, elite waves, boss waves, and breathing windows."
    }
  });
}

export const survivalRoundKitResources = Object.freeze({
  SurvivalRoundState: "zombie-orchard.survival-round.state"
});

export const survivalRoundKitEvents = Object.freeze({
  SurvivalRoundStarted: "zombie-orchard.round.started",
  SurvivalRoundCompleted: "zombie-orchard.round.completed",
  SurvivalRoundFailed: "zombie-orchard.round.failed",
  RoundBudgetSpent: "zombie-orchard.round.budget-spent",
  EliteWaveQueued: "zombie-orchard.round.elite-queued",
  BossWaveQueued: "zombie-orchard.round.boss-queued",
  HordeSpawnRequested: "zombie-orchard.horde.spawn-requested",
  MonsterDefeated: "zombie-orchard.monster.defeated"
});
