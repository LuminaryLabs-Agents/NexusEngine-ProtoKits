export const GENERIC_DEFENSE_KITS_VERSION = "0.1.0";

const DEFAULT_BLUEPRINTS = Object.freeze({
  bolt: {
    id: "bolt",
    label: "Bolt Spire",
    cost: 45,
    upgradeCost: 38,
    maxLevel: 4,
    range: 126,
    damage: 22,
    fireRate: 1.18,
    projectileSpeed: 390,
    color: "#8bd3ff",
    role: "single-target"
  },
  ember: {
    id: "ember",
    label: "Ember Loom",
    cost: 70,
    upgradeCost: 52,
    maxLevel: 3,
    range: 104,
    damage: 13,
    fireRate: 2.45,
    projectileSpeed: 330,
    splash: 34,
    color: "#ffbc6b",
    role: "splash"
  },
  slow: {
    id: "slow",
    label: "Frost Pin",
    cost: 55,
    upgradeCost: 44,
    maxLevel: 3,
    range: 116,
    damage: 9,
    fireRate: 1.55,
    projectileSpeed: 350,
    slow: { amount: 0.42, duration: 1.8 },
    color: "#b7f7ff",
    role: "control"
  }
});

const DEFAULT_PATH = Object.freeze([
  { x: 40, y: 318 },
  { x: 178, y: 318 },
  { x: 248, y: 210 },
  { x: 390, y: 210 },
  { x: 492, y: 350 },
  { x: 660, y: 350 },
  { x: 735, y: 250 },
  { x: 918, y: 250 }
]);

const DEFAULT_SLOTS = Object.freeze([
  { id: "slot-a", x: 150, y: 246, tags: ["frontline"] },
  { id: "slot-b", x: 238, y: 386, tags: ["bend"] },
  { id: "slot-c", x: 354, y: 144, tags: ["high-ground"] },
  { id: "slot-d", x: 438, y: 286, tags: ["center"] },
  { id: "slot-e", x: 570, y: 420, tags: ["support"] },
  { id: "slot-f", x: 635, y: 274, tags: ["crossfire"] },
  { id: "slot-g", x: 750, y: 170, tags: ["late"] },
  { id: "slot-h", x: 806, y: 330, tags: ["core"] }
]);

const DEFAULT_WAVES = Object.freeze([
  { id: "wave-1", label: "First signal", reward: 24, groups: [{ archetype: "runner", count: 8, cadence: 0.76 }] },
  { id: "wave-2", label: "Dense braid", reward: 32, groups: [{ archetype: "runner", count: 7, cadence: 0.6 }, { archetype: "brute", count: 3, cadence: 1.1, delay: 2.3 }] },
  { id: "wave-3", label: "Glass swarm", reward: 44, groups: [{ archetype: "skitter", count: 14, cadence: 0.42 }, { archetype: "brute", count: 4, cadence: 0.95, delay: 3.0 }] },
  { id: "wave-4", label: "Armored press", reward: 56, groups: [{ archetype: "brute", count: 8, cadence: 0.78 }, { archetype: "runner", count: 10, cadence: 0.38, delay: 4.2 }] },
  { id: "wave-5", label: "Warden", reward: 90, groups: [{ archetype: "warden", count: 1, cadence: 1.0 }, { archetype: "skitter", count: 18, cadence: 0.34, delay: 3.5 }] }
]);

const DEFAULT_ARCHETYPES = Object.freeze({
  runner: { id: "runner", label: "Runner", maxHealth: 58, speed: 58, reward: 6, coreDamage: 1, radius: 9, color: "#84f0a4" },
  skitter: { id: "skitter", label: "Skitter", maxHealth: 34, speed: 90, reward: 4, coreDamage: 1, radius: 7, color: "#d7ff8a" },
  brute: { id: "brute", label: "Brute", maxHealth: 155, speed: 34, reward: 13, coreDamage: 2, radius: 13, color: "#ff9c7a" },
  warden: { id: "warden", label: "Warden", maxHealth: 980, speed: 24, reward: 75, coreDamage: 8, radius: 20, color: "#ffdc6e", boss: true }
});

function n(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function arr(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function idOf(value, fallback = "id") {
  const text = String(value ?? fallback).trim();
  return text || fallback;
}

function keyed(list = []) {
  return Object.fromEntries(arr(list).filter(Boolean).map((entry, index) => [idOf(entry.id, `item-${index + 1}`), { ...entry, id: idOf(entry.id, `item-${index + 1}`) }]));
}

function withCommand(state, commandId) {
  if (!commandId) return { duplicate: false, state };
  const processed = state.processedCommandIds ?? [];
  if (processed.includes(commandId)) return { duplicate: true, state };
  return { duplicate: false, state: { ...state, processedCommandIds: [...processed, commandId].slice(-256) } };
}

function pathLength(points = []) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += Math.hypot(n(points[i].x) - n(points[i - 1].x), n(points[i].y) - n(points[i - 1].y));
  return total || 1;
}

function samplePath(points = [], t = 0) {
  const safe = points.length >= 2 ? points : DEFAULT_PATH;
  const total = pathLength(safe);
  let remaining = clamp(t, 0, 1) * total;
  for (let i = 1; i < safe.length; i += 1) {
    const a = safe[i - 1];
    const b = safe[i];
    const segment = Math.hypot(n(b.x) - n(a.x), n(b.y) - n(a.y));
    if (remaining <= segment || i === safe.length - 1) {
      const u = segment <= 0 ? 0 : remaining / segment;
      return {
        x: n(a.x) + (n(b.x) - n(a.x)) * u,
        y: n(a.y) + (n(b.y) - n(a.y)) * u,
        angle: Math.atan2(n(b.y) - n(a.y), n(b.x) - n(a.x)),
        segmentIndex: i - 1
      };
    }
    remaining -= segment;
  }
  const end = safe[safe.length - 1];
  return { x: n(end.x), y: n(end.y), angle: 0, segmentIndex: safe.length - 2 };
}

function dist(a, b) {
  return Math.hypot(n(a?.x) - n(b?.x), n(a?.y) - n(b?.y));
}

function createDefaultLevel(config = {}) {
  const blueprints = { ...DEFAULT_BLUEPRINTS, ...(config.blueprints ?? {}) };
  const path = clone(config.path ?? DEFAULT_PATH);
  const slots = clone(config.slots ?? DEFAULT_SLOTS);
  const waves = clone(config.waves ?? DEFAULT_WAVES);
  const archetypes = { ...DEFAULT_ARCHETYPES, ...(config.archetypes ?? {}) };
  return {
    id: config.id ?? "generic-defense-demo",
    label: config.label ?? "Signal Bastion",
    width: n(config.width, 960),
    height: n(config.height, 540),
    path,
    pathLength: pathLength(path),
    slots,
    vital: {
      id: "core",
      label: "Core",
      x: n(config.vital?.x, 914),
      y: n(config.vital?.y, 250),
      maxHealth: n(config.vital?.maxHealth, 18),
      ...config.vital
    },
    blueprints,
    waves,
    archetypes,
    startingCurrency: n(config.startingCurrency, 130),
    buildOrder: clone(config.buildOrder ?? ["bolt", "ember", "slow"])
  };
}

export function createGenericDefenseLevel(config = {}) {
  return createDefaultLevel(config);
}

function createDefinitions(NexusRealtime, config = {}) {
  const { defineResource, defineEvent } = NexusRealtime;
  const prefix = config.resourcePrefix ?? "genericDefense";
  return {
    level: createDefaultLevel(config.level ?? config),
    resources: {
      SessionState: defineResource(`${prefix}.session.state`),
      MapState: defineResource(`${prefix}.map.state`),
      EconomyState: defineResource(`${prefix}.economy.state`),
      StructureState: defineResource(`${prefix}.structure.state`),
      AgentState: defineResource(`${prefix}.agent.state`),
      CombatState: defineResource(`${prefix}.combat.state`),
      RenderState: defineResource(`${prefix}.render.state`)
    },
    events: {
      Reset: defineEvent(`${prefix}.reset`),
      Select: defineEvent(`${prefix}.select`),
      BuildRequested: defineEvent(`${prefix}.build.requested`),
      UpgradeRequested: defineEvent(`${prefix}.upgrade.requested`),
      StartWave: defineEvent(`${prefix}.wave.start`),
      WaveStarted: defineEvent(`${prefix}.wave.started`),
      WaveCompleted: defineEvent(`${prefix}.wave.completed`),
      EnemyKilled: defineEvent(`${prefix}.enemy.killed`),
      VitalDamaged: defineEvent(`${prefix}.vital.damaged`),
      EconomyCredit: defineEvent(`${prefix}.economy.credit`),
      EconomyDebit: defineEvent(`${prefix}.economy.debit`),
      StructureBuilt: defineEvent(`${prefix}.structure.built`),
      StructureUpgraded: defineEvent(`${prefix}.structure.upgraded`),
      Rejected: defineEvent(`${prefix}.command.rejected`)
    }
  };
}

function initialSession(level, config = {}) {
  return {
    version: GENERIC_DEFENSE_KITS_VERSION,
    id: config.id ?? "generic-defense-session",
    status: "planning",
    phase: "planning",
    waveIndex: 0,
    completedWaveIds: [],
    selectedId: null,
    selectedKind: null,
    blueprintId: config.defaultBlueprintId ?? level.buildOrder[0] ?? "bolt",
    message: "Build towers on the lit anchors, then press Space to start the wave.",
    won: false,
    lost: false,
    processedCommandIds: []
  };
}

function initialMap(level) {
  return {
    version: GENERIC_DEFENSE_KITS_VERSION,
    id: `${level.id}:map`,
    width: level.width,
    height: level.height,
    path: clone(level.path),
    pathLength: level.pathLength,
    slots: keyed(level.slots.map((slot) => ({ radius: 26, ...slot }))),
    vital: { ...level.vital, health: level.vital.maxHealth },
    lastReason: "initialized"
  };
}

function initialEconomy(level) {
  return {
    version: GENERIC_DEFENSE_KITS_VERSION,
    currency: level.startingCurrency,
    transactions: [],
    rejected: [],
    processedCommandIds: []
  };
}

function initialStructures(level) {
  return {
    version: GENERIC_DEFENSE_KITS_VERSION,
    blueprints: clone(level.blueprints),
    structures: {},
    nextIndex: 1,
    processedCommandIds: []
  };
}

function initialAgents(level) {
  return {
    version: GENERIC_DEFENSE_KITS_VERSION,
    archetypes: clone(level.archetypes),
    waves: clone(level.waves),
    active: {},
    spawnQueue: [],
    waveActive: false,
    currentWaveId: null,
    currentWaveNumber: 0,
    nextIndex: 1,
    processedCommandIds: [],
    lastReason: "initialized"
  };
}

function initialCombat() {
  return {
    version: GENERIC_DEFENSE_KITS_VERSION,
    projectiles: {},
    effects: [],
    nextProjectileIndex: 1,
    processedCommandIds: []
  };
}

function initialRender(level) {
  return {
    version: GENERIC_DEFENSE_KITS_VERSION,
    levelId: level.id,
    frame: 0,
    descriptors: [],
    hud: {},
    world: {}
  };
}

function createMapKit(NexusRealtime, defs, config = {}) {
  const { defineRuntimeKit } = NexusRealtime;
  const { MapState } = defs.resources;
  const { Reset, VitalDamaged } = defs.events;
  const level = defs.level;

  function system(world) {
    let state = world.getResource(MapState) ?? initialMap(level);
    for (const event of world.readEvents(Reset)) {
      state = initialMap(level);
      state.lastReason = event.reason ?? "reset";
    }
    let vital = state.vital;
    for (const event of world.readEvents(VitalDamaged)) {
      const amount = Math.max(0, n(event.amount, 0));
      vital = { ...vital, health: clamp(n(vital.health, vital.maxHealth) - amount, 0, vital.maxHealth), lastDamageReason: event.reason ?? "breach" };
    }
    if (vital !== state.vital) state = { ...state, vital };
    world.setResource(MapState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "generic-defense-map-kit",
    provides: ["world:paths", "world:slots", "vital:target"],
    resources: { MapState },
    events: { Reset, VitalDamaged },
    systems: [{ phase: "resolve", name: "genericDefenseMapSystem", system }],
    initWorld({ world }) { world.setResource(MapState, initialMap(level)); },
    install({ engine, world }) {
      engine.defenseMap = {
        getState: () => world.getResource(MapState),
        samplePath: (t) => samplePath(level.path, t),
        getSlot: (slotId) => world.getResource(MapState)?.slots?.[slotId] ?? null
      };
    },
    metadata: { version: GENERIC_DEFENSE_KITS_VERSION, purpose: "Generic path, build-slot, and vital-target state for 2.5D defense-style games." }
  });
}

function createEconomyKit(NexusRealtime, defs, config = {}) {
  const { defineRuntimeKit } = NexusRealtime;
  const { EconomyState } = defs.resources;
  const { Reset, EconomyCredit, EconomyDebit, Rejected } = defs.events;
  const level = defs.level;

  function addTransaction(state, tx) {
    return { ...state, transactions: [{ at: tx.at ?? 0, ...tx }, ...state.transactions].slice(0, 48) };
  }

  function system(world) {
    let state = world.getResource(EconomyState) ?? initialEconomy(level);
    for (const event of world.readEvents(Reset)) state = initialEconomy(level);

    for (const event of [...world.readEvents(EconomyCredit), ...world.readEvents(EconomyDebit)]) {
      const commandId = event.commandId ?? event.transactionId;
      const mark = withCommand(state, commandId);
      state = mark.state;
      if (mark.duplicate) continue;
      const amount = Math.max(0, n(event.amount, 0));
      const type = event.type ?? (world.readEvents(EconomyDebit).includes(event) ? "debit" : "credit");
      if (type === "debit" || event.debit === true) {
        if (state.currency < amount) {
          const rejection = { reason: "insufficient-currency", amount, currency: state.currency, commandId };
          state = { ...state, rejected: [rejection, ...state.rejected].slice(0, 16) };
          world.emit(Rejected, rejection);
          continue;
        }
        state = addTransaction({ ...state, currency: state.currency - amount }, { kind: "debit", amount, commandId, reason: event.reason ?? "spend", at: world.__nexusClock?.elapsed ?? 0 });
      } else {
        state = addTransaction({ ...state, currency: state.currency + amount }, { kind: "credit", amount, commandId, reason: event.reason ?? "reward", at: world.__nexusClock?.elapsed ?? 0 });
      }
    }

    world.setResource(EconomyState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "generic-defense-economy-kit",
    provides: ["economy:wallet", "economy:costs"],
    resources: { EconomyState },
    events: { EconomyCredit, EconomyDebit, Rejected },
    systems: [{ phase: "resolve", name: "genericDefenseEconomySystem", system }],
    initWorld({ world }) { world.setResource(EconomyState, initialEconomy(level)); },
    install({ engine, world }) {
      engine.defenseEconomy = {
        credit(amount, payload = {}) { world.emit(EconomyCredit, { amount, ...payload }); return world.getResource(EconomyState); },
        debit(amount, payload = {}) { world.emit(EconomyDebit, { amount, debit: true, ...payload }); return world.getResource(EconomyState); },
        getState: () => world.getResource(EconomyState)
      };
    },
    metadata: { version: GENERIC_DEFENSE_KITS_VERSION, purpose: "Idempotent wallet and transaction ledger for generic defense compositions." }
  });
}

function createStructureKit(NexusRealtime, defs, config = {}) {
  const { defineRuntimeKit } = NexusRealtime;
  const { MapState, EconomyState, StructureState } = defs.resources;
  const { Reset, BuildRequested, UpgradeRequested, EconomyDebit, StructureBuilt, StructureUpgraded, Rejected } = defs.events;
  const level = defs.level;

  function occupiedSlotIds(state) {
    return new Set(Object.values(state.structures).map((structure) => structure.slotId));
  }

  function buildStructure(world, state, event) {
    const mark = withCommand(state, event.commandId);
    state = mark.state;
    if (mark.duplicate) return state;
    const map = world.getResource(MapState) ?? initialMap(level);
    const economy = world.getResource(EconomyState) ?? initialEconomy(level);
    const slotId = idOf(event.slotId, "");
    const slot = map.slots?.[slotId];
    const blueprint = state.blueprints[event.blueprintId] ?? state.blueprints[level.buildOrder[0]] ?? Object.values(state.blueprints)[0];
    if (!slot) {
      world.emit(Rejected, { reason: "unknown-slot", slotId, commandId: event.commandId });
      return state;
    }
    if (!blueprint) {
      world.emit(Rejected, { reason: "unknown-blueprint", blueprintId: event.blueprintId, commandId: event.commandId });
      return state;
    }
    if (occupiedSlotIds(state).has(slotId)) {
      world.emit(Rejected, { reason: "slot-occupied", slotId, commandId: event.commandId });
      return state;
    }
    const cost = Math.max(0, n(blueprint.cost, 0));
    if (economy.currency < cost) {
      world.emit(Rejected, { reason: "insufficient-currency", amount: cost, currency: economy.currency, commandId: event.commandId });
      return state;
    }
    const id = event.structureId ?? `structure-${state.nextIndex}`;
    const structure = {
      id,
      slotId,
      blueprintId: blueprint.id,
      label: blueprint.label,
      x: slot.x,
      y: slot.y,
      level: 1,
      range: n(blueprint.range, 100),
      damage: n(blueprint.damage, 10),
      fireRate: n(blueprint.fireRate, 1),
      projectileSpeed: n(blueprint.projectileSpeed, 340),
      splash: n(blueprint.splash, 0),
      slow: blueprint.slow ?? null,
      cooldown: 0,
      color: blueprint.color,
      role: blueprint.role ?? "damage",
      builtAt: world.__nexusClock?.elapsed ?? 0
    };
    world.emit(EconomyDebit, { amount: cost, debit: true, commandId: `${event.commandId ?? id}:cost`, reason: "build" });
    world.emit(StructureBuilt, { structureId: id, slotId, blueprintId: blueprint.id });
    return { ...state, nextIndex: state.nextIndex + 1, structures: { ...state.structures, [id]: structure } };
  }

  function upgradeStructure(world, state, event) {
    const mark = withCommand(state, event.commandId);
    state = mark.state;
    if (mark.duplicate) return state;
    const economy = world.getResource(EconomyState) ?? initialEconomy(level);
    const structure = state.structures[event.structureId];
    if (!structure) {
      world.emit(Rejected, { reason: "unknown-structure", structureId: event.structureId, commandId: event.commandId });
      return state;
    }
    const blueprint = state.blueprints[structure.blueprintId];
    const maxLevel = Math.max(1, Math.floor(n(blueprint.maxLevel, 3)));
    if (structure.level >= maxLevel) {
      world.emit(Rejected, { reason: "max-level", structureId: structure.id, commandId: event.commandId });
      return state;
    }
    const cost = Math.ceil(n(blueprint.upgradeCost, blueprint.cost * 0.75) * structure.level);
    if (economy.currency < cost) {
      world.emit(Rejected, { reason: "insufficient-currency", amount: cost, currency: economy.currency, commandId: event.commandId });
      return state;
    }
    const upgraded = {
      ...structure,
      level: structure.level + 1,
      range: structure.range + 10,
      damage: Math.round(structure.damage * 1.34),
      fireRate: structure.fireRate * 1.08,
      projectileSpeed: structure.projectileSpeed + 18
    };
    world.emit(EconomyDebit, { amount: cost, debit: true, commandId: `${event.commandId ?? structure.id}:upgrade-cost`, reason: "upgrade" });
    world.emit(StructureUpgraded, { structureId: structure.id, level: upgraded.level });
    return { ...state, structures: { ...state.structures, [structure.id]: upgraded } };
  }

  function system(world) {
    let state = world.getResource(StructureState) ?? initialStructures(level);
    for (const event of world.readEvents(Reset)) state = initialStructures(level);
    for (const event of world.readEvents(BuildRequested)) state = buildStructure(world, state, event);
    for (const event of world.readEvents(UpgradeRequested)) state = upgradeStructure(world, state, event);
    const dt = n(world.__nexusClock?.delta, 1 / 60);
    const structures = {};
    for (const [id, structure] of Object.entries(state.structures)) {
      structures[id] = { ...structure, cooldown: Math.max(0, n(structure.cooldown, 0) - dt) };
    }
    state = { ...state, structures };
    world.setResource(StructureState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "generic-defense-structure-kit",
    requires: ["world:slots", "economy:wallet"],
    provides: ["placement:structures", "structure:runtime", "structure:upgrade"],
    resources: { StructureState },
    events: { BuildRequested, UpgradeRequested, StructureBuilt, StructureUpgraded, Rejected },
    systems: [{ phase: "simulate", name: "genericDefenseStructureSystem", system }],
    initWorld({ world }) { world.setResource(StructureState, initialStructures(level)); },
    install({ engine, world }) {
      engine.defenseStructures = {
        build(slotId, blueprintId, payload = {}) { world.emit(BuildRequested, { slotId, blueprintId, ...payload }); return world.getResource(StructureState); },
        upgrade(structureId, payload = {}) { world.emit(UpgradeRequested, { structureId, ...payload }); return world.getResource(StructureState); },
        getState: () => world.getResource(StructureState)
      };
    },
    metadata: { version: GENERIC_DEFENSE_KITS_VERSION, purpose: "Generic placeable structure runtime, build, and upgrade rules." }
  });
}

function createAgentWaveKit(NexusRealtime, defs, config = {}) {
  const { defineRuntimeKit } = NexusRealtime;
  const { SessionState, AgentState } = defs.resources;
  const { Reset, StartWave, WaveStarted, WaveCompleted, VitalDamaged } = defs.events;
  const level = defs.level;

  function createSpawnQueueForWave(wave, waveNumber) {
    const queue = [];
    let cursor = 0;
    for (const group of arr(wave.groups)) {
      const count = Math.max(0, Math.floor(n(group.count, 0)));
      const cadence = Math.max(0.05, n(group.cadence, 0.7));
      const delay = n(group.delay, 0);
      for (let i = 0; i < count; i += 1) {
        queue.push({
          archetype: group.archetype ?? "runner",
          spawnAt: cursor + delay + i * cadence,
          waveNumber,
          groupId: group.id ?? `${wave.id}:group-${queue.length}`,
          index: i
        });
      }
      cursor += delay + count * cadence;
    }
    return queue.sort((a, b) => a.spawnAt - b.spawnAt);
  }

  function spawnAgent(state, entry, now) {
    const archetype = state.archetypes[entry.archetype] ?? state.archetypes.runner ?? Object.values(state.archetypes)[0];
    const scale = 1 + Math.max(0, entry.waveNumber - 1) * 0.16;
    const id = `agent-${state.nextIndex}`;
    const maxHealth = Math.round(n(archetype.maxHealth, 50) * scale);
    const sample = samplePath(level.path, 0);
    return {
      ...state,
      nextIndex: state.nextIndex + 1,
      active: {
        ...state.active,
        [id]: {
          id,
          archetypeId: archetype.id,
          label: archetype.label,
          progress: 0,
          x: sample.x,
          y: sample.y,
          angle: sample.angle,
          health: maxHealth,
          maxHealth,
          speed: n(archetype.speed, 50) * (1 + Math.max(0, entry.waveNumber - 1) * 0.04),
          reward: Math.round(n(archetype.reward, 5) * scale),
          coreDamage: n(archetype.coreDamage, 1),
          radius: n(archetype.radius, 9),
          color: archetype.color,
          boss: archetype.boss === true,
          slowUntil: 0,
          slowAmount: 0,
          spawnedAt: now
        }
      }
    };
  }

  function system(world) {
    let state = world.getResource(AgentState) ?? initialAgents(level);
    for (const event of world.readEvents(Reset)) state = initialAgents(level);

    const session = world.getResource(SessionState) ?? initialSession(level);
    for (const event of world.readEvents(StartWave)) {
      const mark = withCommand(state, event.commandId ?? `wave-${session.waveIndex + 1}`);
      state = mark.state;
      if (mark.duplicate || state.waveActive || session.won || session.lost) continue;
      const waveNumber = Math.min(level.waves.length, Math.max(1, n(event.waveNumber, session.waveIndex + 1)));
      const wave = level.waves[waveNumber - 1];
      if (!wave) continue;
      state = {
        ...state,
        waveActive: true,
        currentWaveId: wave.id,
        currentWaveNumber: waveNumber,
        spawnQueue: createSpawnQueueForWave(wave, waveNumber),
        lastReason: "wave-started"
      };
      world.emit(WaveStarted, { waveId: wave.id, waveNumber, label: wave.label });
    }

    if (state.waveActive) {
      const dt = n(world.__nexusClock?.delta, 1 / 60);
      const now = n(world.__nexusClock?.elapsed, 0);
      let spawnQueue = state.spawnQueue.map((entry) => ({ ...entry, spawnAt: entry.spawnAt - dt }));
      while (spawnQueue.length && spawnQueue[0].spawnAt <= 0) {
        const [entry, ...rest] = spawnQueue;
        state = spawnAgent(state, entry, now);
        spawnQueue = rest;
      }

      const active = {};
      for (const [id, agent] of Object.entries(state.active)) {
        const slowActive = n(agent.slowUntil, 0) > now;
        const speed = n(agent.speed, 40) * (slowActive ? (1 - clamp(n(agent.slowAmount, 0), 0, 0.85)) : 1);
        const progress = n(agent.progress, 0) + (speed * dt) / level.pathLength;
        if (progress >= 1) {
          world.emit(VitalDamaged, { agentId: id, amount: agent.coreDamage, reason: "breach" });
          continue;
        }
        active[id] = { ...agent, progress, ...samplePath(level.path, progress) };
      }
      state = { ...state, spawnQueue, active };

      if (state.spawnQueue.length === 0 && Object.keys(state.active).length === 0) {
        state = { ...state, waveActive: false, lastReason: "wave-completed" };
        const wave = level.waves[state.currentWaveNumber - 1];
        world.emit(WaveCompleted, { waveId: state.currentWaveId, waveNumber: state.currentWaveNumber, reward: n(wave?.reward, 0) });
      }
    }

    world.setResource(AgentState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "generic-defense-agent-wave-kit",
    requires: ["world:paths", "vital:target"],
    provides: ["agent:spawn", "agent:path-follow", "encounter:waves"],
    resources: { AgentState },
    events: { StartWave, WaveStarted, WaveCompleted, VitalDamaged },
    systems: [{ phase: "simulate", name: "genericDefenseAgentWaveSystem", system }],
    initWorld({ world }) { world.setResource(AgentState, initialAgents(level)); },
    install({ engine, world }) {
      engine.defenseAgents = {
        startWave(payload = {}) { world.emit(StartWave, payload); return world.getResource(AgentState); },
        getState: () => world.getResource(AgentState)
      };
    },
    metadata: { version: GENERIC_DEFENSE_KITS_VERSION, purpose: "Generic wave spawning and path-following agent state." }
  });
}

function createCombatKit(NexusRealtime, defs, config = {}) {
  const { defineRuntimeKit } = NexusRealtime;
  const { StructureState, AgentState, CombatState } = defs.resources;
  const { Reset, EnemyKilled, EconomyCredit } = defs.events;
  const level = defs.level;

  function targetFor(structure, agents) {
    let best = null;
    let bestScore = -Infinity;
    for (const agent of Object.values(agents)) {
      const d = dist(structure, agent);
      if (d > structure.range) continue;
      const score = agent.progress * 100000 - d + (agent.boss ? 5000 : 0);
      if (score > bestScore) {
        best = agent;
        bestScore = score;
      }
    }
    return best;
  }

  function applyDamageToAgent(agent, amount, slow, now) {
    const next = { ...agent, health: Math.max(0, n(agent.health) - Math.max(0, amount)) };
    if (slow) {
      next.slowUntil = Math.max(n(next.slowUntil, 0), now + n(slow.duration, 1));
      next.slowAmount = Math.max(n(next.slowAmount, 0), n(slow.amount, 0));
    }
    return next;
  }

  function system(world) {
    let state = world.getResource(CombatState) ?? initialCombat();
    for (const event of world.readEvents(Reset)) state = initialCombat();

    let structures = world.getResource(StructureState) ?? initialStructures(level);
    let agentsState = world.getResource(AgentState) ?? initialAgents(level);
    const dt = n(world.__nexusClock?.delta, 1 / 60);
    const now = n(world.__nexusClock?.elapsed, 0);
    const projectiles = { ...state.projectiles };
    const effects = [...state.effects].map((effect) => ({ ...effect, age: n(effect.age, 0) + dt })).filter((effect) => n(effect.age, 0) < n(effect.life, 0.9));

    const nextStructures = { ...structures.structures };
    for (const [id, structure] of Object.entries(nextStructures)) {
      const cooldown = Math.max(0, n(structure.cooldown, 0) - dt);
      if (cooldown > 0) {
        nextStructures[id] = { ...structure, cooldown };
        continue;
      }
      const target = targetFor(structure, agentsState.active);
      if (!target) {
        nextStructures[id] = { ...structure, cooldown: 0 };
        continue;
      }
      const projectileId = `projectile-${state.nextProjectileIndex}`;
      state = { ...state, nextProjectileIndex: state.nextProjectileIndex + 1 };
      projectiles[projectileId] = {
        id: projectileId,
        sourceId: structure.id,
        targetId: target.id,
        x: structure.x,
        y: structure.y,
        damage: n(structure.damage, 10),
        speed: n(structure.projectileSpeed, 340),
        splash: n(structure.splash, 0),
        slow: structure.slow,
        color: structure.color,
        age: 0
      };
      nextStructures[id] = { ...structure, cooldown: 1 / Math.max(0.05, n(structure.fireRate, 1)) };
      effects.unshift({ id: `muzzle-${projectileId}`, type: "muzzle", x: structure.x, y: structure.y, color: structure.color, age: 0, life: 0.24 });
    }
    structures = { ...structures, structures: nextStructures };

    const active = { ...agentsState.active };
    for (const [id, projectile] of Object.entries(projectiles)) {
      const target = active[projectile.targetId];
      if (!target) {
        delete projectiles[id];
        continue;
      }
      const d = dist(projectile, target);
      const step = n(projectile.speed, 300) * dt;
      if (d <= step + target.radius) {
        const impacted = [];
        if (projectile.splash > 0) {
          for (const agent of Object.values(active)) {
            if (dist(target, agent) <= projectile.splash) impacted.push(agent.id);
          }
        } else {
          impacted.push(target.id);
        }
        for (const agentId of impacted) {
          if (!active[agentId]) continue;
          const falloff = projectile.splash > 0 ? clamp(1 - dist(target, active[agentId]) / Math.max(1, projectile.splash), 0.35, 1) : 1;
          const damaged = applyDamageToAgent(active[agentId], projectile.damage * falloff, projectile.slow, now);
          if (damaged.health <= 0) {
            const defeated = active[agentId];
            delete active[agentId];
            world.emit(EnemyKilled, { agentId, sourceId: projectile.sourceId, reward: defeated.reward });
            world.emit(EconomyCredit, { amount: defeated.reward, commandId: `kill:${agentId}`, reason: "kill" });
            effects.unshift({ id: `death-${agentId}-${now}`, type: "death", x: defeated.x, y: defeated.y, color: defeated.color, age: 0, life: 0.62, boss: defeated.boss });
          } else {
            active[agentId] = damaged;
          }
        }
        effects.unshift({ id: `impact-${id}`, type: "impact", x: target.x, y: target.y, color: projectile.color, age: 0, life: 0.36, radius: projectile.splash || 12 });
        delete projectiles[id];
        continue;
      }
      const u = d <= 0 ? 0 : step / d;
      projectiles[id] = { ...projectile, x: projectile.x + (target.x - projectile.x) * u, y: projectile.y + (target.y - projectile.y) * u, age: projectile.age + dt };
      if (projectiles[id].age > 5) delete projectiles[id];
    }

    world.setResource(StructureState, structures);
    world.setResource(AgentState, { ...agentsState, active });
    world.setResource(CombatState, { ...state, projectiles, effects: effects.slice(0, 128) });
  }

  return defineRuntimeKit({
    id: config.kitId ?? "generic-defense-combat-kit",
    requires: ["placement:structures", "agent:path-follow"],
    provides: ["target:query", "combat:attack", "projectile:motion", "combat:damage", "combat:status"],
    resources: { CombatState },
    events: { EnemyKilled, EconomyCredit },
    systems: [{ phase: "simulate", name: "genericDefenseCombatSystem", system }],
    initWorld({ world }) { world.setResource(CombatState, initialCombat()); },
    install({ engine, world }) {
      engine.defenseCombat = { getState: () => world.getResource(CombatState) };
    },
    metadata: { version: GENERIC_DEFENSE_KITS_VERSION, purpose: "Generic structure-emitter targeting, projectile motion, damage, kill rewards, and combat descriptors." }
  });
}

function createSessionFacadeKit(NexusRealtime, defs, config = {}) {
  const { defineRuntimeKit } = NexusRealtime;
  const { SessionState, MapState, EconomyState, StructureState, AgentState, CombatState, RenderState } = defs.resources;
  const { Reset, Select, BuildRequested, UpgradeRequested, StartWave, WaveCompleted, EconomyCredit, Rejected } = defs.events;
  const level = defs.level;

  function structureAtSlot(structureState, slotId) {
    return Object.values(structureState.structures).find((structure) => structure.slotId === slotId) ?? null;
  }

  function system(world) {
    let state = world.getResource(SessionState) ?? initialSession(level, config);
    for (const event of world.readEvents(Reset)) state = initialSession(level, config);
    for (const event of world.readEvents(Select)) {
      state = { ...state, selectedId: event.id ?? null, selectedKind: event.kind ?? null, message: event.message ?? state.message };
    }
    for (const event of world.readEvents(StartWave)) {
      if (!state.won && !state.lost) state = { ...state, phase: "combat", status: "combat", message: `Wave ${state.waveIndex + 1} incoming.` };
    }
    for (const event of world.readEvents(WaveCompleted)) {
      if (!state.completedWaveIds.includes(event.waveId)) {
        const completedWaveIds = [...state.completedWaveIds, event.waveId];
        const nextWaveIndex = Math.max(state.waveIndex + 1, n(event.waveNumber, state.waveIndex + 1));
        const won = nextWaveIndex >= level.waves.length;
        state = {
          ...state,
          completedWaveIds,
          waveIndex: nextWaveIndex,
          phase: won ? "complete" : "planning",
          status: won ? "won" : "planning",
          won,
          message: won ? "All signals held. The bastion is secure." : `Wave cleared. +${n(event.reward, 0)} reserves. Build, upgrade, then press Space.`
        };
        if (event.reward) world.emit(EconomyCredit, { amount: event.reward, commandId: `wave-reward:${event.waveId}`, reason: "wave-complete" });
      }
    }
    const vital = world.getResource(MapState)?.vital;
    if (!state.lost && vital && n(vital.health, vital.maxHealth) <= 0) {
      state = { ...state, lost: true, phase: "failed", status: "lost", message: "Core breached. Press R to rebuild the run." };
    }
    for (const event of world.readEvents(Rejected)) {
      state = { ...state, message: `Blocked: ${event.reason ?? "invalid command"}` };
    }
    world.setResource(SessionState, state);
  }

  function snapshot(world) {
    return {
      level,
      session: world.getResource(SessionState),
      map: world.getResource(MapState),
      economy: world.getResource(EconomyState),
      structures: world.getResource(StructureState),
      agents: world.getResource(AgentState),
      combat: world.getResource(CombatState),
      render: world.getResource(RenderState)
    };
  }

  return defineRuntimeKit({
    id: config.kitId ?? "generic-defense-session-kit",
    provides: ["game:generic-defense", "session:defense"],
    resources: { SessionState },
    events: { Reset, Select, StartWave, BuildRequested, UpgradeRequested, WaveCompleted, Rejected },
    systems: [{ phase: "resolve", name: "genericDefenseSessionSystem", system }],
    initWorld({ world }) { world.setResource(SessionState, initialSession(level, config)); },
    install({ engine, world }) {
      engine.genericDefense = {
        resources: defs.resources,
        events: defs.events,
        getState: () => world.getResource(SessionState),
        getSnapshot: () => snapshot(world),
        startWave(payload = {}) {
          const session = world.getResource(SessionState) ?? initialSession(level, config);
          if (session.won || session.lost) return session;
          world.emit(StartWave, { commandId: payload.commandId ?? `start-wave-${session.waveIndex + 1}`, waveNumber: session.waveIndex + 1, ...payload });
          return world.getResource(SessionState);
        },
        build(slotId, blueprintId, payload = {}) {
          const session = world.getResource(SessionState) ?? initialSession(level, config);
          const structures = world.getResource(StructureState) ?? initialStructures(level);
          const existing = structureAtSlot(structures, slotId);
          if (existing) {
            world.emit(Select, { id: existing.id, kind: "structure", message: `${existing.label} selected. Press U to upgrade.` });
            return session;
          }
          world.emit(BuildRequested, { slotId, blueprintId: blueprintId ?? session.blueprintId, commandId: payload.commandId ?? `build:${slotId}:${engine.clock?.frame ?? 0}`, ...payload });
          world.emit(Select, { id: slotId, kind: "slot", message: "Build command sent." });
          return world.getResource(SessionState);
        },
        upgrade(structureId, payload = {}) {
          const targetId = structureId ?? (world.getResource(SessionState)?.selectedKind === "structure" ? world.getResource(SessionState)?.selectedId : null);
          if (!targetId) return world.getResource(SessionState);
          world.emit(UpgradeRequested, { structureId: targetId, commandId: payload.commandId ?? `upgrade:${targetId}:${engine.clock?.frame ?? 0}`, ...payload });
          return world.getResource(SessionState);
        },
        select(id, kind = "unknown", payload = {}) {
          world.emit(Select, { id, kind, ...payload });
          return world.getResource(SessionState);
        },
        cycleBlueprint(direction = 1) {
          const session = world.getResource(SessionState) ?? initialSession(level, config);
          const order = level.buildOrder;
          const index = order.indexOf(session.blueprintId);
          const next = order[(index + direction + order.length) % order.length] ?? order[0];
          const nextState = { ...session, blueprintId: next, message: `${level.blueprints[next]?.label ?? next} selected.` };
          world.setResource(SessionState, nextState);
          return nextState;
        },
        restart(payload = {}) {
          world.emit(Reset, { commandId: payload.commandId ?? `restart:${engine.clock?.frame ?? 0}`, reason: "host-restart", ...payload });
          return world.getResource(SessionState);
        }
      };
    },
    metadata: { version: GENERIC_DEFENSE_KITS_VERSION, purpose: "Small facade over generic defense DSKs for host input and debug snapshots." }
  });
}

function createRenderDescriptorKit(NexusRealtime, defs, config = {}) {
  const { defineRuntimeKit } = NexusRealtime;
  const { SessionState, MapState, EconomyState, StructureState, AgentState, CombatState, RenderState } = defs.resources;
  const level = defs.level;

  function system(world) {
    const session = world.getResource(SessionState) ?? initialSession(level);
    const map = world.getResource(MapState) ?? initialMap(level);
    const economy = world.getResource(EconomyState) ?? initialEconomy(level);
    const structures = world.getResource(StructureState) ?? initialStructures(level);
    const agents = world.getResource(AgentState) ?? initialAgents(level);
    const combat = world.getResource(CombatState) ?? initialCombat();
    const descriptors = [
      { id: "path", kind: "path", points: map.path },
      { id: map.vital.id, kind: "vital", ...map.vital },
      ...Object.values(map.slots).map((slot) => ({
        id: slot.id,
        kind: "build-slot",
        x: slot.x,
        y: slot.y,
        radius: slot.radius,
        occupied: Object.values(structures.structures).some((structure) => structure.slotId === slot.id)
      })),
      ...Object.values(structures.structures).map((structure) => ({ kind: "structure", ...structure })),
      ...Object.values(agents.active).map((agent) => ({ kind: "agent", ...agent })),
      ...Object.values(combat.projectiles).map((projectile) => ({ kind: "projectile", ...projectile })),
      ...combat.effects.map((effect) => ({ kind: "effect", ...effect }))
    ];
    const hud = {
      status: session.status,
      message: session.message,
      wave: `${Math.min(session.waveIndex + 1, level.waves.length)}/${level.waves.length}`,
      currency: economy.currency,
      core: `${Math.ceil(map.vital.health)}/${map.vital.maxHealth}`,
      blueprint: session.blueprintId,
      selectedId: session.selectedId,
      selectedKind: session.selectedKind
    };
    world.setResource(RenderState, {
      version: GENERIC_DEFENSE_KITS_VERSION,
      levelId: level.id,
      frame: world.__nexusClock?.frame ?? 0,
      descriptors,
      hud,
      world: { width: level.width, height: level.height, path: map.path }
    });
  }

  return defineRuntimeKit({
    id: config.kitId ?? "generic-defense-render-descriptor-kit",
    requires: ["game:generic-defense"],
    provides: ["render:descriptors", "feedback:diegetic", "ui:hud-descriptors"],
    resources: { RenderState },
    systems: [{ phase: "cleanup", name: "genericDefenseRenderDescriptorSystem", system }],
    initWorld({ world }) { world.setResource(RenderState, initialRender(level)); },
    install({ engine, world }) {
      engine.defenseRender = { getState: () => world.getResource(RenderState), getSnapshot: () => clone(world.getResource(RenderState)) };
    },
    metadata: { version: GENERIC_DEFENSE_KITS_VERSION, purpose: "Renderer-agnostic descriptors for generic defense games." }
  });
}

export function createGenericDefenseKits(NexusRealtime, config = {}) {
  if (!NexusRealtime?.defineRuntimeKit || !NexusRealtime?.defineResource || !NexusRealtime?.defineEvent) {
    throw new TypeError("createGenericDefenseKits requires NexusRealtime runtime helpers.");
  }
  const defs = createDefinitions(NexusRealtime, config);
  return [
    createMapKit(NexusRealtime, defs, config.mapKit ?? {}),
    createEconomyKit(NexusRealtime, defs, config.economyKit ?? {}),
    createStructureKit(NexusRealtime, defs, config.structureKit ?? {}),
    createAgentWaveKit(NexusRealtime, defs, config.agentWaveKit ?? {}),
    createCombatKit(NexusRealtime, defs, config.combatKit ?? {}),
    createSessionFacadeKit(NexusRealtime, defs, config.sessionKit ?? {}),
    createRenderDescriptorKit(NexusRealtime, defs, config.renderKit ?? {})
  ];
}

export function createGenericDefenseGame(NexusRealtime, config = {}) {
  if (typeof NexusRealtime?.createRealtimeGame !== "function") {
    throw new TypeError("createGenericDefenseGame requires NexusRealtime.createRealtimeGame.");
  }
  return NexusRealtime.createRealtimeGame({
    kits: createGenericDefenseKits(NexusRealtime, config),
    renderer: typeof NexusRealtime.createRenderer === "function" ? NexusRealtime.createRenderer("headless") : undefined
  });
}

export default createGenericDefenseKits;
