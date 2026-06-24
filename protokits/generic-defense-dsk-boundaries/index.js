import {
  GENERIC_DEFENSE_KITS_VERSION,
  createGenericDefenseKits,
  createGenericDefenseLevel
} from "../generic-defense-kits/index.js";

export { GENERIC_DEFENSE_KITS_VERSION, createGenericDefenseLevel };

export const GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE = "genericDefense";

export const GENERIC_DEFENSE_DSK_BOUNDARIES = Object.freeze([
  Object.freeze({
    id: "map",
    exportName: "createGenericDefenseMapDsk",
    kitId: "generic-defense-map-kit",
    resources: ["genericDefense.map.state"],
    events: ["genericDefense.reset", "genericDefense.vital.damaged"],
    methods: [
      "engine.defenseMap.getState",
      "engine.defenseMap.samplePath",
      "engine.defenseMap.getSlot",
      "engine.n.genericDefense.map.getState",
      "engine.n.genericDefense.map.samplePath",
      "engine.n.genericDefense.map.getSlot"
    ],
    snapshots: ["map", "vital", "slots", "path"],
    descriptors: [],
    boundary: "Path, build-slot, and vital-target state."
  }),
  Object.freeze({
    id: "economyWallet",
    exportName: "createGenericDefenseEconomyWalletDsk",
    kitId: "generic-defense-economy-kit",
    resources: ["genericDefense.economy.state"],
    events: ["genericDefense.economy.credit", "genericDefense.economy.debit", "genericDefense.command.rejected"],
    methods: [
      "engine.defenseEconomy.credit",
      "engine.defenseEconomy.debit",
      "engine.defenseEconomy.getState",
      "engine.n.genericDefense.economyWallet.credit",
      "engine.n.genericDefense.economyWallet.debit",
      "engine.n.genericDefense.economyWallet.getState"
    ],
    snapshots: ["economy.currency", "economy.transactions", "economy.rejected"],
    descriptors: [],
    boundary: "Idempotent wallet and transaction ledger."
  }),
  Object.freeze({
    id: "buildPlacement",
    exportName: "createGenericDefenseBuildPlacementDsk",
    kitId: "generic-defense-structure-kit",
    resources: ["genericDefense.structure.state"],
    events: ["genericDefense.build.requested", "genericDefense.upgrade.requested", "genericDefense.structure.built", "genericDefense.structure.upgraded", "genericDefense.command.rejected"],
    methods: [
      "engine.defenseStructures.build",
      "engine.defenseStructures.upgrade",
      "engine.defenseStructures.getState",
      "engine.n.genericDefense.buildPlacement.build",
      "engine.n.genericDefense.buildPlacement.upgrade",
      "engine.n.genericDefense.buildPlacement.getState"
    ],
    snapshots: ["structures.blueprints", "structures.structures"],
    descriptors: [],
    boundary: "Build-placement and structure-upgrade requests over map slots and wallet state."
  }),
  Object.freeze({
    id: "waveAgentDirector",
    exportName: "createGenericDefenseWaveAgentDirectorDsk",
    kitId: "generic-defense-agent-wave-kit",
    resources: ["genericDefense.agent.state"],
    events: ["genericDefense.wave.start", "genericDefense.wave.started", "genericDefense.wave.completed", "genericDefense.vital.damaged"],
    methods: [
      "engine.defenseAgents.startWave",
      "engine.defenseAgents.getState",
      "engine.n.genericDefense.waveAgentDirector.startWave",
      "engine.n.genericDefense.waveAgentDirector.getState"
    ],
    snapshots: ["agents.waves", "agents.spawnQueue", "agents.active", "agents.waveActive"],
    descriptors: [],
    boundary: "Wave start, deterministic spawn queues, path-following agents, and vital breach output."
  }),
  Object.freeze({
    id: "combatResolver",
    exportName: "createGenericDefenseCombatResolverDsk",
    kitId: "generic-defense-combat-kit",
    resources: ["genericDefense.combat.state"],
    events: ["genericDefense.enemy.killed", "genericDefense.economy.credit"],
    methods: ["engine.defenseCombat.getState", "engine.n.genericDefense.combatResolver.getState"],
    snapshots: ["combat.projectiles", "combat.effects"],
    descriptors: ["projectile", "effect"],
    boundary: "Structure targeting, projectile motion, damage resolution, rewards, and combat feedback descriptors."
  }),
  Object.freeze({
    id: "sessionFacade",
    exportName: "createGenericDefenseSessionFacadeDsk",
    kitId: "generic-defense-session-kit",
    resources: ["genericDefense.session.state"],
    events: ["genericDefense.reset", "genericDefense.select", "genericDefense.wave.start", "genericDefense.build.requested", "genericDefense.upgrade.requested", "genericDefense.command.rejected"],
    methods: [
      "engine.genericDefense.startWave",
      "engine.genericDefense.build",
      "engine.genericDefense.upgrade",
      "engine.genericDefense.select",
      "engine.genericDefense.cycleBlueprint",
      "engine.genericDefense.restart",
      "engine.genericDefense.getSnapshot",
      "engine.n.genericDefense.sessionFacade.startWave",
      "engine.n.genericDefense.sessionFacade.build",
      "engine.n.genericDefense.sessionFacade.upgrade",
      "engine.n.genericDefense.sessionFacade.select",
      "engine.n.genericDefense.sessionFacade.cycleBlueprint",
      "engine.n.genericDefense.sessionFacade.restart",
      "engine.n.genericDefense.sessionFacade.getSnapshot"
    ],
    snapshots: ["session", "level", "map", "economy", "structures", "agents", "combat", "render"],
    descriptors: [],
    boundary: "Small host-input facade and debug snapshot over the atomic defense DSKs."
  }),
  Object.freeze({
    id: "renderDescriptors",
    exportName: "createGenericDefenseRenderDescriptorDsk",
    kitId: "generic-defense-render-descriptor-kit",
    resources: ["genericDefense.render.state"],
    events: [],
    methods: [
      "engine.defenseRender.getState",
      "engine.defenseRender.getSnapshot",
      "engine.n.genericDefense.renderDescriptors.getState",
      "engine.n.genericDefense.renderDescriptors.getSnapshot"
    ],
    snapshots: ["render.hud", "render.descriptors", "render.world"],
    descriptors: ["path", "vital", "build-slot", "structure", "agent", "projectile", "effect"],
    boundary: "Renderer-agnostic HUD and world descriptors with no DOM, Canvas, WebGL, audio, or asset loading ownership."
  })
]);

const BOUNDARIES_BY_ID = new Map(GENERIC_DEFENSE_DSK_BOUNDARIES.map((boundary) => [boundary.id, boundary]));
const BOUNDARIES_BY_KIT_ID = new Map(GENERIC_DEFENSE_DSK_BOUNDARIES.map((boundary) => [boundary.kitId, boundary]));

const ENGINE_NAMESPACE_LEGACY_SURFACES = Object.freeze({
  map: "defenseMap",
  economyWallet: "defenseEconomy",
  buildPlacement: "defenseStructures",
  waveAgentDirector: "defenseAgents",
  combatResolver: "defenseCombat",
  sessionFacade: "genericDefense",
  renderDescriptors: "defenseRender"
});

function boundaryIds(ids) {
  if (ids == null) return GENERIC_DEFENSE_DSK_BOUNDARIES.map((boundary) => boundary.id);
  return Array.isArray(ids) ? ids : [ids];
}

function customKitIdFor(boundary, config = {}) {
  switch (boundary.id) {
    case "map": return config.mapKit?.kitId ?? boundary.kitId;
    case "economyWallet": return config.economyKit?.kitId ?? boundary.kitId;
    case "buildPlacement": return config.structureKit?.kitId ?? boundary.kitId;
    case "waveAgentDirector": return config.agentWaveKit?.kitId ?? boundary.kitId;
    case "combatResolver": return config.combatKit?.kitId ?? boundary.kitId;
    case "sessionFacade": return config.sessionKit?.kitId ?? boundary.kitId;
    case "renderDescriptors": return config.renderKit?.kitId ?? boundary.kitId;
    default: return boundary.kitId;
  }
}

function resolveBoundary(id) {
  const boundary = BOUNDARIES_BY_ID.get(id) ?? BOUNDARIES_BY_KIT_ID.get(id);
  if (!boundary) {
    throw new RangeError(`Unknown generic defense DSK boundary: ${id}`);
  }
  return boundary;
}

function ensureEngineNamespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE] || typeof engine.n[GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE] !== "object") {
    engine.n[GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE] = {};
  }
  return engine.n[GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE];
}

export function syncGenericDefenseDskEngineNamespace(engine) {
  const namespace = ensureEngineNamespace(engine);
  if (!namespace) return null;

  for (const boundary of GENERIC_DEFENSE_DSK_BOUNDARIES) {
    const legacySurfaceName = ENGINE_NAMESPACE_LEGACY_SURFACES[boundary.id];
    if (legacySurfaceName && engine[legacySurfaceName]) {
      namespace[boundary.id] = engine[legacySurfaceName];
    }
  }

  if (engine.genericDefense?.resources) namespace.resources = engine.genericDefense.resources;
  if (engine.genericDefense?.events) namespace.events = engine.genericDefense.events;
  return namespace;
}

function annotateBoundaryKit(kit, boundary) {
  const originalInstall = kit.install;
  return {
    ...kit,
    install(context = {}) {
      const result = originalInstall?.call(this, context);
      syncGenericDefenseDskEngineNamespace(context.engine);
      return result;
    },
    metadata: {
      ...(kit.metadata ?? {}),
      boundary: boundary.boundary,
      dskBoundary: boundary,
      engineNamespace: `engine.n.${GENERIC_DEFENSE_DSK_ENGINE_NAMESPACE}.${boundary.id}`,
      apiSurface: {
        resources: boundary.resources,
        events: boundary.events,
        methods: boundary.methods,
        snapshots: boundary.snapshots,
        descriptors: boundary.descriptors
      }
    }
  };
}

export function getGenericDefenseDskBoundary(id) {
  return resolveBoundary(id);
}

export function listGenericDefenseDskBoundaries() {
  return [...GENERIC_DEFENSE_DSK_BOUNDARIES];
}

export function createGenericDefenseDskBundle(NexusRealtime, config = {}, ids) {
  const kits = createGenericDefenseKits(NexusRealtime, config);
  const selected = boundaryIds(ids).map(resolveBoundary);
  return selected.map((boundary) => {
    const kitId = customKitIdFor(boundary, config);
    const kit = kits.find((candidate) => candidate.id === kitId);
    if (!kit) {
      throw new Error(`Generic defense DSK boundary ${boundary.id} did not produce kit ${kitId}`);
    }
    return annotateBoundaryKit(kit, boundary);
  });
}

export function createGenericDefenseMapDsk(NexusRealtime, config = {}) {
  return createGenericDefenseDskBundle(NexusRealtime, config, ["map"])[0];
}

export function createGenericDefenseEconomyWalletDsk(NexusRealtime, config = {}) {
  return createGenericDefenseDskBundle(NexusRealtime, config, ["economyWallet"])[0];
}

export function createGenericDefenseBuildPlacementDsk(NexusRealtime, config = {}) {
  return createGenericDefenseDskBundle(NexusRealtime, config, ["buildPlacement"])[0];
}

export function createGenericDefenseWaveAgentDirectorDsk(NexusRealtime, config = {}) {
  return createGenericDefenseDskBundle(NexusRealtime, config, ["waveAgentDirector"])[0];
}

export function createGenericDefenseCombatResolverDsk(NexusRealtime, config = {}) {
  return createGenericDefenseDskBundle(NexusRealtime, config, ["combatResolver"])[0];
}

export function createGenericDefenseSessionFacadeDsk(NexusRealtime, config = {}) {
  return createGenericDefenseDskBundle(NexusRealtime, config, ["sessionFacade"])[0];
}

export function createGenericDefenseRenderDescriptorDsk(NexusRealtime, config = {}) {
  return createGenericDefenseDskBundle(NexusRealtime, config, ["renderDescriptors"])[0];
}

export default createGenericDefenseDskBundle;
