export const MONSTER_ROSTER_KIT_VERSION = "0.0.1";

const ARCHETYPES = Object.freeze([
  { id: "shambler-zombie", label: "Shambler Zombie", role: "swarm", minRound: 1, tier: 1, threat: 1, budgetCost: 1, spawnWeight: 36, health: 3, speed: 1.35, damage: 1, tags: ["zombie", "slow", "swarm"], abilities: ["grab-pressure"], movementProfile: "direct-navmesh" },
  { id: "runner-zombie", label: "Runner Zombie", role: "chaser", minRound: 2, tier: 1, threat: 1.35, budgetCost: 2, spawnWeight: 18, health: 2, speed: 2.5, damage: 1, tags: ["zombie", "fast"], abilities: ["burst-sprint"], movementProfile: "direct-navmesh" },
  { id: "crawler", label: "Crawler", role: "ambush", minRound: 2, tier: 1, threat: 1.2, budgetCost: 1, spawnWeight: 16, health: 2, speed: 1.8, damage: 1, tags: ["low", "ambush"], abilities: ["under-fence-crawl"], movementProfile: "tight-gap" },
  { id: "scarecrow-stalker", label: "Scarecrow Stalker", role: "elite", minRound: 3, tier: 2, elite: true, threat: 2.1, budgetCost: 4, spawnWeight: 7, health: 7, speed: 1.65, damage: 2, tags: ["scarecrow", "stalker", "elite"], abilities: ["line-of-sight-freeze", "hay-hook"], movementProfile: "stalk-and-lunge" },
  { id: "rotting-deer", label: "Rotting Deer", role: "flanker", minRound: 3, tier: 2, threat: 1.8, budgetCost: 3, spawnWeight: 9, health: 4, speed: 3.1, damage: 2, tags: ["beast", "flanker"], abilities: ["vault-row", "panic-charge"], movementProfile: "wide-flank" },
  { id: "orchard-witch", label: "Orchard Witch", role: "caster", minRound: 4, tier: 3, elite: true, threat: 2.8, budgetCost: 6, spawnWeight: 4, health: 9, speed: 1.25, damage: 2, tags: ["witch", "fog", "elite"], abilities: ["fog-summon", "apple-curse", "lane-block"], movementProfile: "keep-distance" },
  { id: "apple-golem", label: "Apple Golem", role: "tank", minRound: 4, tier: 3, elite: true, threat: 3.2, budgetCost: 7, spawnWeight: 3, health: 16, speed: 0.9, damage: 3, tags: ["golem", "tank", "elite"], abilities: ["tree-slam", "rot-puddle"], movementProfile: "slow-crusher" },
  { id: "fog-hound", label: "Fog Hound", role: "pressure", minRound: 5, tier: 2, threat: 2.2, budgetCost: 4, spawnWeight: 6, health: 5, speed: 3.35, damage: 2, tags: ["hound", "fog", "fast"], abilities: ["phase-through-fog", "howl-mark"], movementProfile: "fog-flank" },
  { id: "orchard-keeper", label: "The Orchard Keeper", role: "boss", minRound: 5, tier: 5, boss: true, bossOnlyWave: true, threat: 6, budgetCost: 16, spawnWeight: 1, health: 48, speed: 1.15, damage: 4, tags: ["boss", "keeper", "orchard"], abilities: ["summon-roots", "bell-toll", "apple-storm", "fence-lockdown"], movementProfile: "boss-navmesh" }
]);

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const i = (value, fallback = 0) => Math.max(0, Math.floor(n(value, fallback)));

function runtime(nexusRealtime) {
  const missing = ["defineRuntimeKit", "defineResource", "defineEvent", "defineComponent"].filter((name) => typeof nexusRealtime?.[name] !== "function");
  if (missing.length) throw new TypeError(`createMonsterRosterKit requires NexusRealtime helpers: ${missing.join(", ")}`);
  return nexusRealtime;
}

function namespace(engine) {
  if (!engine.zombieOrchard) engine.zombieOrchard = {};
  return engine.zombieOrchard;
}

function table(config) {
  return Object.fromEntries([...ARCHETYPES, ...(config.archetypes ?? [])].map((entry) => [entry.id, { ...entry }]));
}

function initialState(config) {
  const archetypeTable = table(config);
  return { id: config.id ?? "zombie-orchard-monster-roster", archetypes: Object.values(archetypeTable), archetypeTable, active: {}, defeated: {}, spawnSequence: 0, bossQueued: false, recentSpawnRequests: [] };
}

function choose(state, request = {}) {
  if (request.archetypeId && state.archetypeTable[request.archetypeId]) return state.archetypeTable[request.archetypeId];
  const round = i(request.round, 1);
  const boss = Boolean(request.bossWave);
  const elite = Boolean(request.eliteWave);
  const pool = (state.archetypes ?? []).filter((entry) => !entry.disabled && round >= i(entry.minRound, 1) && (!entry.boss || boss) && (!entry.elite || elite || i(entry.tier, 1) < 3));
  const choices = pool.length ? pool : state.archetypes;
  const total = choices.reduce((sum, entry) => sum + Math.max(0.01, n(entry.spawnWeight, 1) * (entry.boss && boss ? 8 : 1) * (entry.elite && elite ? 2 : 1)), 0);
  let cursor = ((i(request.sequence, state.spawnSequence) * 1103515245 + round * 12345) >>> 0) / 4294967295 * total;
  for (const entry of choices) {
    cursor -= Math.max(0.01, n(entry.spawnWeight, 1) * (entry.boss && boss ? 8 : 1) * (entry.elite && elite ? 2 : 1));
    if (cursor <= 0) return entry;
  }
  return choices[choices.length - 1] ?? null;
}

function spawnDescriptor(state, request = {}) {
  const archetype = choose(state, request);
  if (!archetype) return null;
  const sequence = i(state.spawnSequence);
  return {
    id: request.id ?? `monster-spawn-${sequence}`,
    spawnId: `monster-${archetype.id}-${sequence}`,
    round: i(request.round, 1),
    archetypeId: archetype.id,
    archetype: JSON.parse(JSON.stringify(archetype)),
    location: request.location ?? { x: 0, z: 0 },
    budgetCost: n(request.budgetCost ?? archetype.budgetCost, 1),
    pressure: n(request.pressure),
    intent: request.intent ?? "pressure",
    zoneId: request.zoneId ?? null,
    tags: [...(archetype.tags ?? []), ...(request.tags ?? [])],
    components: {
      MonsterArchetype: { id: archetype.id, label: archetype.label, role: archetype.role, tier: archetype.tier, boss: Boolean(archetype.boss), elite: Boolean(archetype.elite) },
      MonsterThreat: { threat: archetype.threat, health: archetype.health, speed: archetype.speed, damage: archetype.damage, abilities: archetype.abilities ?? [] }
    }
  };
}

export function createMonsterRosterKit(nexusRealtime = {}, options = {}) {
  const r = runtime(nexusRealtime);
  const D = {
    MonsterArchetype: r.defineComponent("zombie-orchard.monster-archetype"),
    MonsterThreat: r.defineComponent("zombie-orchard.monster-threat"),
    MonsterSpawnRequestTag: r.defineComponent("zombie-orchard.monster-spawn-request"),
    MonsterRosterState: r.defineResource("zombie-orchard.monster-roster.state"),
    HordeSpawnRequested: r.defineEvent("zombie-orchard.horde.spawn-requested"),
    MonsterSpawnRequested: r.defineEvent("zombie-orchard.monster.spawn-requested"),
    MonsterArchetypeSelected: r.defineEvent("zombie-orchard.monster.archetype-selected"),
    MonsterDefeated: r.defineEvent("zombie-orchard.monster.defeated"),
    BossMonsterQueued: r.defineEvent("zombie-orchard.monster.boss-queued")
  };

  function system(world) {
    let state = world.getResource(D.MonsterRosterState) ?? initialState(options);
    const spawned = [];
    for (const request of world.readEvents(D.HordeSpawnRequested)) {
      const spawn = spawnDescriptor(state, { ...request, sequence: state.spawnSequence });
      if (!spawn) continue;
      spawned.push(spawn);
      state = { ...state, spawnSequence: state.spawnSequence + 1, recentSpawnRequests: [...(state.recentSpawnRequests ?? []), spawn].slice(-24), bossQueued: state.bossQueued || Boolean(spawn.archetype.boss) };
      world.emit(D.MonsterArchetypeSelected, { requestId: request.id, archetypeId: spawn.archetypeId, round: spawn.round });
      if (spawn.archetype.boss) world.emit(D.BossMonsterQueued, { spawn });
      world.emit(D.MonsterSpawnRequested, spawn);
    }
    for (const event of world.readEvents(D.MonsterDefeated)) {
      if (!event.archetypeId) continue;
      state = { ...state, defeated: { ...(state.defeated ?? {}), [event.archetypeId]: i(state.defeated?.[event.archetypeId]) + i(event.count, 1) }, active: { ...(state.active ?? {}), [event.archetypeId]: Math.max(0, i(state.active?.[event.archetypeId]) - i(event.count, 1)) } };
    }
    if (spawned.length) {
      const active = { ...(state.active ?? {}) };
      for (const spawn of spawned) active[spawn.archetypeId] = i(active[spawn.archetypeId]) + 1;
      state = { ...state, active };
    }
    world.setResource(D.MonsterRosterState, state);
  }

  return r.defineRuntimeKit({
    id: options.id ?? "zombie-orchard-monster-roster-kit",
    components: { MonsterArchetype: D.MonsterArchetype, MonsterThreat: D.MonsterThreat, MonsterSpawnRequestTag: D.MonsterSpawnRequestTag },
    resources: { MonsterRosterState: D.MonsterRosterState },
    events: { HordeSpawnRequested: D.HordeSpawnRequested, MonsterSpawnRequested: D.MonsterSpawnRequested, MonsterArchetypeSelected: D.MonsterArchetypeSelected, MonsterDefeated: D.MonsterDefeated, BossMonsterQueued: D.BossMonsterQueued },
    systems: [{ phase: "cleanup", name: "ZombieOrchardMonsterRosterSystem", system }],
    provides: ["zombie-orchard.monsters"],
    initWorld({ world }) {
      world.setResource(D.MonsterRosterState, initialState(options));
    },
    install({ engine }) {
      namespace(engine).monsterRoster = {
        definitions: D,
        getState: () => engine.world.getResource(D.MonsterRosterState),
        listArchetypes: () => engine.world.getResource(D.MonsterRosterState)?.archetypes ?? [],
        getArchetype: (id) => engine.world.getResource(D.MonsterRosterState)?.archetypeTable?.[id] ?? null,
        chooseForRound(request = {}) {
          return choose(engine.world.getResource(D.MonsterRosterState) ?? initialState(options), request);
        },
        buildSpawnRequest(request = {}) {
          return spawnDescriptor(engine.world.getResource(D.MonsterRosterState) ?? initialState(options), request);
        },
        defeat(payload = {}) {
          engine.world.emit(D.MonsterDefeated, payload);
          return engine.world.getResource(D.MonsterRosterState);
        }
      };
    },
    metadata: { version: MONSTER_ROSTER_KIT_VERSION, domain: "zombie-orchard", purpose: "Enemy archetypes and spawn descriptors for zombies, monsters, fog hounds, and The Orchard Keeper." }
  });
}

export const monsterRosterKitResources = Object.freeze({ MonsterRosterState: "zombie-orchard.monster-roster.state" });
export const monsterRosterKitEvents = Object.freeze({ HordeSpawnRequested: "zombie-orchard.horde.spawn-requested", MonsterSpawnRequested: "zombie-orchard.monster.spawn-requested", MonsterArchetypeSelected: "zombie-orchard.monster.archetype-selected", MonsterDefeated: "zombie-orchard.monster.defeated", BossMonsterQueued: "zombie-orchard.monster.boss-queued" });
export const monsterRosterDefaults = Object.freeze({ archetypes: ARCHETYPES });
