export const HORDE_DIRECTOR_KIT_VERSION = "0.0.1";

const DEFAULTS = {
  initialSpawnCooldown: 0.8,
  minSpawnIntervalSeconds: 0.7,
  maxSpawnIntervalSeconds: 4.5,
  maxSpawnPerTick: 4,
  offscreenDistance: 18,
  minSpawnDistance: 10,
  criticalSpawnDistance: 20,
  criticalHealth: 0.28,
  backoffSeconds: 4,
  pressureRiseSpeed: 0.85,
  pressureFallSpeed: 1.4,
  nearMissPressure: 0.72
};

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const i = (value, fallback = 0) => Math.max(0, Math.floor(n(value, fallback)));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dt = (world) => clamp(n(world.__nexusClock?.delta, 1 / 60), 0, 1);
const dist = (a = {}, b = {}) => Math.hypot(n((a.position ?? a).x) - n((b.position ?? b).x), n((a.position ?? a).z ?? (a.position ?? a).y) - n((b.position ?? b).z ?? (b.position ?? b).y));

function runtime(nexusRealtime) {
  const missing = ["defineRuntimeKit", "defineResource", "defineEvent"].filter((name) => typeof nexusRealtime?.[name] !== "function");
  if (missing.length) throw new TypeError(`createHordeDirectorKit requires NexusRealtime helpers: ${missing.join(", ")}`);
  return nexusRealtime;
}

function namespace(engine) {
  if (!engine.zombieOrchard) engine.zombieOrchard = {};
  return engine.zombieOrchard;
}

function initialState(config) {
  return {
    id: config.id ?? "zombie-orchard-horde-director",
    pressure: 0,
    desiredPressure: 0,
    pressureBias: n(config.pressureBias),
    spawnCooldown: n(config.initialSpawnCooldown, DEFAULTS.initialSpawnCooldown),
    backoffRemaining: 0,
    sequence: 0,
    mode: "waiting",
    lastRequests: [],
    lastFairness: [],
    nearMissCount: 0
  };
}

function initialPlayer(config) {
  return {
    position: { x: n(config.playerX), z: n(config.playerZ) },
    health01: 1,
    stamina01: 1,
    scoreMomentum: 0,
    hitsTakenRecently: 0,
    killsRecently: 0,
    applesRecently: 0
  };
}

function playerPerformance(player) {
  return clamp(
    n(player.health01, 1) * 0.35 +
    n(player.stamina01, 1) * 0.25 +
    clamp(n(player.killsRecently) / 10, 0, 1) * 0.2 +
    clamp(n(player.applesRecently) / 8, 0, 1) * 0.1 +
    (clamp(n(player.scoreMomentum), -1, 1) + 1) * 0.05,
    0,
    1.25
  );
}

function playerDistress(player, config) {
  const health = clamp(n(player.health01, 1), 0, 1);
  const stamina = clamp(n(player.stamina01, 1), 0, 1);
  const critical = n(config.criticalHealth, DEFAULTS.criticalHealth);
  const lowHealth = health < critical ? (critical - health) / Math.max(0.01, critical) : 0;
  const lowStamina = stamina < 0.2 ? (0.2 - stamina) / 0.2 : 0;
  return clamp(lowHealth * 0.8 + lowStamina * 0.35 + clamp(n(player.hitsTakenRecently) / 3, 0, 1) * 0.7, 0, 1.5);
}

function approach(current, target, amount) {
  return current < target ? Math.min(target, current + amount) : Math.max(target, current - amount);
}

function spawnZones(orchard = {}) {
  return [
    ...(orchard.monsterSpawnZones ?? []),
    ...(orchard.fogLanes ?? []).map((lane) => ({ id: `${lane.id}-spawn`, position: lane.center ?? lane.position, radius: lane.width, tags: ["fog"] })),
    ...(orchard.barnLandmarks ?? []).map((barn) => ({ id: `${barn.id}-shadow`, position: barn.position, radius: barn.spawnRadius ?? 6, tags: ["barn", "shadow"] }))
  ].map((zone) => ({
    id: zone.id,
    kind: zone.kind ?? "monster-spawn-zone",
    position: { x: n(zone.position?.x ?? zone.x), z: n(zone.position?.z ?? zone.z ?? zone.y) },
    radius: n(zone.radius, 4),
    tags: zone.tags ?? []
  }));
}

function chooseZone(zones, player, state, config, critical) {
  const minDistance = Math.max(n(config.offscreenDistance, DEFAULTS.offscreenDistance), critical ? n(config.criticalSpawnDistance, DEFAULTS.criticalSpawnDistance) : n(config.minSpawnDistance, DEFAULTS.minSpawnDistance));
  const legal = zones.filter((zone) => dist(zone.position, player.position) >= minDistance);
  if (!legal.length) return { zone: null, reason: `no-offscreen-zone-${minDistance}` };
  return { zone: legal[state.sequence % legal.length], reason: "offscreen" };
}

function chooseMonster(roster = {}, roundState = {}, state = {}) {
  const archetypes = roster.archetypes ?? [];
  if (!archetypes.length) return { id: "shambler-zombie", label: "Shambler Zombie", budgetCost: 1, tags: ["zombie"] };
  const round = i(roundState.round, 1);
  const boss = Boolean(roundState.bossWave);
  const elite = Boolean(roundState.eliteWave);
  const pool = archetypes.filter((entry) => !entry.disabled && round >= i(entry.minRound, 1) && (!entry.boss || boss) && (!entry.elite || elite || i(entry.tier, 1) < 3));
  const choices = pool.length ? pool : archetypes;
  let total = choices.reduce((sum, entry) => sum + Math.max(0.01, n(entry.spawnWeight, 1) * (entry.boss && boss ? 8 : 1) * (entry.elite && elite ? 2 : 1)), 0);
  let cursor = ((state.sequence * 9301 + round * 49297) % 233280) / 233280 * total;
  for (const entry of choices) {
    cursor -= Math.max(0.01, n(entry.spawnWeight, 1) * (entry.boss && boss ? 8 : 1) * (entry.elite && elite ? 2 : 1));
    if (cursor <= 0) return entry;
  }
  return choices[choices.length - 1];
}

export function createHordeDirectorKit(nexusRealtime = {}, options = {}) {
  const r = runtime(nexusRealtime);
  const config = { ...DEFAULTS, ...options };
  const D = {
    HordeDirectorState: r.defineResource("zombie-orchard.horde-director.state"),
    PlayerSurvivalSnapshot: r.defineResource("zombie-orchard.player-survival.snapshot"),
    SurvivalRoundState: r.defineResource("zombie-orchard.survival-round.state"),
    OrchardBiomeState: r.defineResource("zombie-orchard.orchard-biome.state"),
    MonsterRosterState: r.defineResource("zombie-orchard.monster-roster.state"),
    HordeSpawnRequested: r.defineEvent("zombie-orchard.horde.spawn-requested"),
    HordePressureChanged: r.defineEvent("zombie-orchard.horde.pressure-changed"),
    NearMissCreated: r.defineEvent("zombie-orchard.horde.near-miss-created"),
    HordeBackoffStarted: r.defineEvent("zombie-orchard.horde.backoff-started")
  };

  function system(world) {
    const delta = dt(world);
    let state = world.getResource(D.HordeDirectorState) ?? initialState(config);
    const player = world.getResource(D.PlayerSurvivalSnapshot) ?? initialPlayer(config);
    const round = world.getResource(D.SurvivalRoundState);
    const orchard = world.getResource(D.OrchardBiomeState) ?? {};
    const roster = world.getResource(D.MonsterRosterState) ?? {};

    if (!round || round.status !== "active") {
      const pressure = approach(n(state.pressure), 0, delta * n(config.pressureFallSpeed, 1.4));
      world.setResource(D.HordeDirectorState, { ...state, pressure, desiredPressure: 0, mode: "waiting", lastRequests: [], lastFairness: [] });
      return;
    }

    const distress = playerDistress(player, config);
    const performance = playerPerformance(player);
    let backoffRemaining = Math.max(0, n(state.backoffRemaining) - delta);
    if (distress > 0.65) {
      const wasBackingOff = backoffRemaining > 0;
      backoffRemaining = Math.max(backoffRemaining, n(config.backoffSeconds, 4));
      if (!wasBackingOff) world.emit(D.HordeBackoffStarted, { round: round.round, distress, player });
    }

    const desiredPressure = clamp(n(round.intensity) * 0.32 + performance * 0.78 + n(state.pressureBias) - (backoffRemaining > 0 ? 0.55 + distress * 0.45 : distress * 0.35), 0, 1);
    const pressure = approach(n(state.pressure), desiredPressure, delta * (desiredPressure > state.pressure ? n(config.pressureRiseSpeed, 0.85) : n(config.pressureFallSpeed, 1.4)));
    let spawnCooldown = Math.max(0, n(state.spawnCooldown) - delta);
    const requests = [];
    const fairness = [];

    if (spawnCooldown <= 0 && backoffRemaining <= 0 && i(round.activeEnemies) < i(round.enemyCap, 1) && n(round.spawnBudgetRemaining) > 0) {
      const zones = spawnZones(orchard);
      const count = Math.min(i(config.maxSpawnPerTick, 4), i(round.enemyCap, 1) - i(round.activeEnemies), Math.ceil(n(round.spawnBudgetRemaining)), Math.max(1, Math.round(1 + pressure * 3)));
      for (let index = 0; index < count; index += 1) {
        const pick = chooseZone(zones, player, state, config, distress > 0.65);
        if (!pick.zone) {
          fairness.push(pick.reason);
          break;
        }
        const archetype = chooseMonster(roster, round, state);
        const cost = Math.max(1, n(archetype.budgetCost, 1));
        const spent = requests.reduce((sum, request) => sum + n(request.budgetCost, 1), 0) + cost;
        if (spent > n(round.spawnBudgetRemaining)) {
          fairness.push("budget-blocked");
          break;
        }
        const request = {
          id: `horde-${round.round}-${world.__nexusClock?.frame ?? 0}-${state.sequence}`,
          round: round.round,
          archetypeId: archetype.id,
          archetypeLabel: archetype.label,
          budgetCost: cost,
          pressure,
          intent: pressure >= n(config.nearMissPressure, 0.72) ? "near-miss-or-flank" : "pressure",
          location: { x: pick.zone.position.x + (index - 1) * pick.zone.radius * 0.2, z: pick.zone.position.z },
          zoneId: pick.zone.id,
          zoneKind: pick.zone.kind,
          tags: [...(pick.zone.tags ?? []), ...(archetype.tags ?? [])],
          fairness: { distanceToPlayer: dist(pick.zone.position, player.position) }
        };
        requests.push(request);
        world.emit(D.HordeSpawnRequested, request);
        if (request.intent === "near-miss-or-flank") world.emit(D.NearMissCreated, request);
        state = { ...state, sequence: state.sequence + 1 };
      }
      spawnCooldown = n(config.maxSpawnIntervalSeconds, 4.5) + (n(config.minSpawnIntervalSeconds, 0.7) - n(config.maxSpawnIntervalSeconds, 4.5)) * pressure;
    }

    if (Math.abs(desiredPressure - n(state.desiredPressure)) > 0.08) world.emit(D.HordePressureChanged, { round: round.round, pressure, desiredPressure, performance, distress, backoffRemaining });

    world.setResource(D.HordeDirectorState, {
      ...state,
      pressure,
      desiredPressure,
      spawnCooldown,
      backoffRemaining,
      mode: backoffRemaining > 0 ? "backoff" : pressure > 0.75 ? "panic" : pressure > 0.35 ? "pressure" : "stalk",
      lastRequests: requests,
      lastFairness: fairness,
      nearMissCount: i(state.nearMissCount) + requests.filter((request) => request.intent === "near-miss-or-flank").length
    });
  }

  return r.defineRuntimeKit({
    id: config.id ?? "zombie-orchard-horde-director-kit",
    resources: { HordeDirectorState: D.HordeDirectorState, PlayerSurvivalSnapshot: D.PlayerSurvivalSnapshot },
    events: { HordeSpawnRequested: D.HordeSpawnRequested, HordePressureChanged: D.HordePressureChanged, NearMissCreated: D.NearMissCreated, HordeBackoffStarted: D.HordeBackoffStarted },
    systems: [{ phase: "simulate", name: "ZombieOrchardHordeDirectorSystem", system }],
    requires: ["zombie-orchard.rounds", "zombie-orchard.orchard", "zombie-orchard.monsters"],
    provides: ["zombie-orchard.horde-director"],
    initWorld({ world }) {
      world.setResource(D.HordeDirectorState, initialState(config));
      world.setResource(D.PlayerSurvivalSnapshot, initialPlayer(config));
    },
    install({ engine }) {
      namespace(engine).hordeDirector = {
        definitions: D,
        getState: () => engine.world.getResource(D.HordeDirectorState),
        getPlayerSnapshot: () => engine.world.getResource(D.PlayerSurvivalSnapshot),
        feedPlayerSnapshot(snapshot = {}) {
          const current = engine.world.getResource(D.PlayerSurvivalSnapshot) ?? initialPlayer(config);
          const next = { ...current, ...snapshot, position: { ...current.position, ...(snapshot.position ?? {}) } };
          engine.world.setResource(D.PlayerSurvivalSnapshot, next);
          return next;
        },
        setPressureBias(pressureBias = 0) {
          const current = engine.world.getResource(D.HordeDirectorState) ?? initialState(config);
          const next = { ...current, pressureBias: n(pressureBias) };
          engine.world.setResource(D.HordeDirectorState, next);
          return next;
        },
        forceBackoff(seconds = config.backoffSeconds) {
          const current = engine.world.getResource(D.HordeDirectorState) ?? initialState(config);
          const next = { ...current, backoffRemaining: Math.max(n(current.backoffRemaining), n(seconds)) };
          engine.world.setResource(D.HordeDirectorState, next);
          return next;
        }
      };
    },
    metadata: { version: HORDE_DIRECTOR_KIT_VERSION, domain: "zombie-orchard", purpose: "Pressure pacing, offscreen spawn requests, near-misses, and fairness backoff." }
  });
}

export const hordeDirectorKitResources = Object.freeze({
  HordeDirectorState: "zombie-orchard.horde-director.state",
  PlayerSurvivalSnapshot: "zombie-orchard.player-survival.snapshot"
});

export const hordeDirectorKitEvents = Object.freeze({
  HordeSpawnRequested: "zombie-orchard.horde.spawn-requested",
  HordePressureChanged: "zombie-orchard.horde.pressure-changed",
  NearMissCreated: "zombie-orchard.horde.near-miss-created",
  HordeBackoffStarted: "zombie-orchard.horde.backoff-started"
});
