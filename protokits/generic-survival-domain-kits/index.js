import {
  createFoundWeaponKit as createLegacyFoundWeaponKit,
  createHordeDirectorKit as createLegacyHordeDirectorKit,
  createMonsterRosterKit as createLegacyMonsterRosterKit,
  createOrchardBiomeKit as createLegacyOrchardBiomeKit,
  createSurvivalRoundKit as createLegacySurvivalRoundKit,
  foundWeaponDefaults,
  hordeDirectorKitEvents,
  hordeDirectorKitResources,
  monsterRosterDefaults,
  orchardBiomeDefaults,
  survivalRoundKitEvents as legacySurvivalRoundKitEvents,
  survivalRoundKitResources as legacySurvivalRoundKitResources
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@zombie-orchard-protokits/protokits/zombie-orchard/index.js";

export const GENERIC_SURVIVAL_DOMAIN_KITS_VERSION = "0.1.0";
export const GENERIC_GRID_LAYOUT_KIT_VERSION = "0.1.0";
export const GENERIC_ROW_FIELD_LAYOUT_KIT_VERSION = "0.1.0";
export const GENERIC_PLACEMENT_RESERVATION_KIT_VERSION = "0.1.0";
export const GENERIC_WALKABILITY_FIELD_KIT_VERSION = "0.1.0";
export const GENERIC_SPAWN_LANE_KIT_VERSION = "0.1.0";
export const GENERIC_NAVIGATION_GRID_ADAPTER_KIT_VERSION = "0.1.0";
export const SURVIVAL_ROUND_KIT_VERSION = "0.1.0";
export const THREAT_ROSTER_KIT_VERSION = "0.1.0";
export const PRESSURE_HORDE_DIRECTOR_KIT_VERSION = "0.1.0";
export const FOUND_GEAR_KIT_VERSION = "0.1.0";

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function simpleResourceKit(nexusRealtime = {}, config = {}, shape) {
  const { defineRuntimeKit, defineResource } = nexusRealtime;
  if (typeof defineRuntimeKit !== "function" || typeof defineResource !== "function") throw new TypeError(`${shape.id} requires NexusRealtime runtime helpers.`);
  const State = defineResource(shape.resource);
  const initial = () => shape.initial(config);
  return defineRuntimeKit({
    id: config.kitId ?? shape.id,
    resources: { [shape.exportName]: State },
    provides: shape.provides,
    initWorld({ world }) { world.setResource(State, initial()); },
    install({ engine, world }) {
      engine[shape.apiName] = {
        resources: { [shape.exportName]: State },
        getState: () => world.getResource(State),
        getSnapshot: () => world.getResource(State),
        rebuild(patch = {}) { const next = shape.initial({ ...config, ...patch }); world.setResource(State, next); return next; }
      };
    },
    metadata: { version: shape.version, domain: shape.domain, purpose: shape.purpose }
  });
}

export function createGenericGridLayoutKit(nexusRealtime = {}, config = {}) {
  return simpleResourceKit(nexusRealtime, config, {
    id: "generic-grid-layout-kit",
    resource: "generic-grid-layout.state",
    exportName: "GridLayoutState",
    apiName: "gridLayout",
    version: GENERIC_GRID_LAYOUT_KIT_VERSION,
    domain: "layout",
    provides: ["layout:grid"],
    purpose: "Generic grid bounds and cell descriptors.",
    initial(cfg = {}) {
      const bounds = cfg.bounds ?? { minX: -40, maxX: 40, minZ: -54, maxZ: 54 };
      const cellSize = Math.max(0.25, n(cfg.cellSize, 2));
      const width = Math.ceil((n(bounds.maxX, 40) - n(bounds.minX, -40)) / cellSize);
      const height = Math.ceil((n(bounds.maxZ, 54) - n(bounds.minZ, -54)) / cellSize);
      return { id: cfg.id ?? "grid-layout", width, height, cellSize, origin: { x: n(bounds.minX, -40), y: 0, z: n(bounds.minZ, -54) }, cells: [] };
    }
  });
}

export function createGenericPlacementReservationKit(nexusRealtime = {}, config = {}) {
  return simpleResourceKit(nexusRealtime, config, { id: "generic-placement-reservation-kit", resource: "placement-reservation.state", exportName: "PlacementReservationState", apiName: "placementReservations", version: GENERIC_PLACEMENT_RESERVATION_KIT_VERSION, domain: "layout", provides: ["layout:placement-reservations"], purpose: "Generic reservation descriptors for objects that block placement.", initial: (cfg = {}) => ({ id: cfg.id ?? "placement-reservations", reservations: cfg.reservations ?? [] }) });
}

export function createGenericWalkabilityFieldKit(nexusRealtime = {}, config = {}) {
  return simpleResourceKit(nexusRealtime, config, { id: "generic-walkability-field-kit", resource: "walkability-field.state", exportName: "WalkabilityFieldState", apiName: "walkabilityField", version: GENERIC_WALKABILITY_FIELD_KIT_VERSION, domain: "navigation", provides: ["navigation:walkability-field"], purpose: "Generic walkability field service hook.", initial: (cfg = {}) => ({ id: cfg.id ?? "walkability-field", cells: [], blockedCells: [], spawnPoints: [], objectiveMarkers: [] }) });
}

export function createGenericSpawnLaneKit(nexusRealtime = {}, config = {}) {
  return simpleResourceKit(nexusRealtime, config, { id: "generic-spawn-lane-kit", resource: "spawn-lane.state", exportName: "SpawnLaneState", apiName: "spawnLanes", version: GENERIC_SPAWN_LANE_KIT_VERSION, domain: "spawn", provides: ["spawn:lanes"], purpose: "Generic spawn lane descriptors.", initial: (cfg = {}) => ({ id: cfg.id ?? "spawn-lanes", lanes: cfg.lanes ?? [] }) });
}

export function createGenericNavigationGridAdapterKit(nexusRealtime = {}, config = {}) {
  return simpleResourceKit(nexusRealtime, config, { id: "generic-navigation-grid-adapter-kit", resource: "navigation-grid-adapter.snapshot", exportName: "NavigationGridSnapshot", apiName: "navigationGridAdapter", version: GENERIC_NAVIGATION_GRID_ADAPTER_KIT_VERSION, domain: "navigation", provides: ["navigation:grid-snapshot"], purpose: "Generic nav-grid adapter service hook.", initial: (cfg = {}) => ({ id: cfg.id ?? "navigation-grid", cells: [], blockedCells: [], spawnPoints: [], objectiveMarkers: [] }) });
}

export function createGenericRowFieldLayoutKit(nexusRealtime = {}, config = {}) {
  const mapped = {
    ...config,
    targetActiveApples: config.targetActiveApples ?? config.targetActiveResources,
    appleReplenishSeconds: config.appleReplenishSeconds ?? config.resourceReplenishSeconds,
    hauntingShiftSeconds: config.hauntingShiftSeconds ?? config.hazardShiftSeconds,
    id: config.legacyId ?? config.id ?? "row-field-layout"
  };
  const base = createLegacyOrchardBiomeKit(nexusRealtime, mapped);
  return {
    ...base,
    id: config.kitId ?? "generic-row-field-layout-kit",
    provides: ["layout:row-field", "world:resource-nodes", "world:hazard-zones"],
    install(ctx) {
      base.install?.(ctx);
      const legacy = ctx.engine.zombieOrchard?.orchardBiome;
      ctx.engine.rowFieldLayout = {
        ...legacy,
        snapshot: () => legacy?.snapshot?.(),
        getState: () => legacy?.snapshot?.(),
        collectResource: (id, payload = {}) => legacy?.collectApple?.(id, payload),
        regenerate: (next = {}) => legacy?.regenerate?.({ ...mapped, ...next })
      };
    },
    metadata: { version: GENERIC_ROW_FIELD_LAYOUT_KIT_VERSION, domain: "layout", purpose: "Generic row-field layout facade over rows, resources, hazard zones, fog lanes, landmarks, and perimeter spawns." }
  };
}

export function createSurvivalRoundKit(nexusRealtime = {}, config = {}) {
  const base = createLegacySurvivalRoundKit(nexusRealtime, { ...config, id: config.legacyId ?? config.id ?? "survival-rounds" });
  return { ...base, id: config.kitId ?? "survival-round-kit", provides: ["survival:rounds"], install(ctx) { base.install?.(ctx); ctx.engine.survivalRounds = ctx.engine.zombieOrchard?.survivalRounds; }, metadata: { version: SURVIVAL_ROUND_KIT_VERSION, domain: "survival", purpose: "Generic survival wave state, spawn budgets, caps, intensity, elite waves, boss waves, and breathing windows." } };
}

export function createThreatRosterKit(nexusRealtime = {}, config = {}) {
  const base = createLegacyMonsterRosterKit(nexusRealtime, config);
  return {
    ...base,
    id: config.kitId ?? "threat-roster-kit",
    components: { ThreatArchetype: base.components?.MonsterArchetype, ThreatProfile: base.components?.MonsterThreat, ThreatSpawnRequestTag: base.components?.MonsterSpawnRequestTag },
    resources: { ThreatRosterState: base.resources?.MonsterRosterState },
    events: { HordeSpawnRequested: base.events?.HordeSpawnRequested, ThreatSpawnRequested: base.events?.MonsterSpawnRequested, ThreatArchetypeSelected: base.events?.MonsterArchetypeSelected, ThreatDefeated: base.events?.MonsterDefeated, BossThreatQueued: base.events?.BossMonsterQueued },
    provides: ["survival:threat-roster"],
    install(ctx) { base.install?.(ctx); ctx.engine.threatRoster = ctx.engine.zombieOrchard?.monsterRoster; },
    metadata: { version: THREAT_ROSTER_KIT_VERSION, domain: "survival", purpose: "Generic hostile/threat archetypes, spawn descriptors, boss/elite queues, and defeat accounting." }
  };
}

export function createPressureHordeDirectorKit(nexusRealtime = {}, config = {}) {
  const base = createLegacyHordeDirectorKit(nexusRealtime, config);
  return { ...base, id: config.kitId ?? "pressure-horde-director-kit", provides: ["survival:horde-director"], requires: ["survival:rounds", "layout:row-field", "survival:threat-roster", "spawn:lanes"], install(ctx) { base.install?.(ctx); ctx.engine.hordeDirector = ctx.engine.zombieOrchard?.hordeDirector; }, metadata: { version: PRESSURE_HORDE_DIRECTOR_KIT_VERSION, domain: "survival", purpose: "Adaptive survival pressure, offscreen spawn requests, near misses, and fairness backoff." } };
}

export function createFoundGearKit(nexusRealtime = {}, config = {}) {
  const mapped = { ...config, weapons: config.weapons ?? config.gear, pickups: (config.pickups ?? []).map((p) => ({ ...p, weaponId: p.weaponId ?? p.gearId })) };
  const base = createLegacyFoundWeaponKit(nexusRealtime, mapped);
  return { ...base, id: config.kitId ?? "found-gear-kit", resources: { FoundGearState: base.resources?.FoundWeaponState, FoundGearInput: base.resources?.FoundWeaponInput }, events: { GearPickedUp: base.events?.WeaponPickedUp, GearSwapped: base.events?.WeaponSwapped, GearUsed: base.events?.WeaponUsed, GearBroken: base.events?.WeaponBroken, GearDropped: base.events?.WeaponDropped, AmmoChanged: base.events?.AmmoChanged }, provides: ["survival:found-gear"], install(ctx) { base.install?.(ctx); ctx.engine.foundGear = ctx.engine.zombieOrchard?.foundWeapons; }, metadata: { version: FOUND_GEAR_KIT_VERSION, domain: "survival", purpose: "Scavenged gear, ammo, durability, rarity, swapping, replacement, temporary gear, and breakage." } };
}

export function createGenericSurvivalDomainKits(nexusRealtime = {}, config = {}) {
  return [
    createGenericGridLayoutKit(nexusRealtime, config.gridLayout ?? config.grid ?? {}),
    createGenericRowFieldLayoutKit(nexusRealtime, config.rowFieldLayout ?? config.rowField ?? {}),
    createGenericPlacementReservationKit(nexusRealtime, config.placementReservations ?? config.placement ?? {}),
    createGenericWalkabilityFieldKit(nexusRealtime, config.walkabilityField ?? config.walkability ?? {}),
    createGenericSpawnLaneKit(nexusRealtime, config.spawnLanes ?? config.spawn ?? {}),
    createGenericNavigationGridAdapterKit(nexusRealtime, config.navigationGrid ?? config.navigation ?? {}),
    createSurvivalRoundKit(nexusRealtime, config.survivalRounds ?? config.rounds ?? {}),
    createThreatRosterKit(nexusRealtime, config.threatRoster ?? config.threats ?? {}),
    createPressureHordeDirectorKit(nexusRealtime, config.pressureHorde ?? config.horde ?? {}),
    createFoundGearKit(nexusRealtime, config.foundGear ?? config.gear ?? {})
  ];
}

export const genericSurvivalDomainKitOrder = Object.freeze(["generic-grid-layout-kit", "generic-row-field-layout-kit", "generic-placement-reservation-kit", "generic-walkability-field-kit", "generic-spawn-lane-kit", "generic-navigation-grid-adapter-kit", "survival-round-kit", "threat-roster-kit", "pressure-horde-director-kit", "found-gear-kit"]);
export const genericGridLayoutKitResources = Object.freeze({ GridLayoutState: "generic-grid-layout.state" });
export const genericRowFieldLayoutKitResources = Object.freeze({ RowFieldLayoutState: "row-field-layout.state" });
export const genericPlacementReservationKitResources = Object.freeze({ PlacementReservationState: "placement-reservation.state" });
export const genericWalkabilityFieldKitResources = Object.freeze({ WalkabilityFieldState: "walkability-field.state" });
export const genericSpawnLaneKitResources = Object.freeze({ SpawnLaneState: "spawn-lane.state" });
export const genericNavigationGridAdapterKitResources = Object.freeze({ NavigationGridSnapshot: "navigation-grid-adapter.snapshot" });
export const survivalRoundKitResources = Object.freeze({ ...legacySurvivalRoundKitResources });
export const survivalRoundKitEvents = Object.freeze({ ...legacySurvivalRoundKitEvents });
export const threatRosterDefaults = monsterRosterDefaults;
export const foundGearDefaults = foundWeaponDefaults;
export { hordeDirectorKitEvents as pressureHordeDirectorKitEvents, hordeDirectorKitResources as pressureHordeDirectorKitResources, orchardBiomeDefaults as genericRowFieldLayoutDefaults };
