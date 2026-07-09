import { createGenericProtoKit } from "../generic-kit-utils/index.js";
import { normalizeProtoKitFactoryArgs } from "../nexus-dsk-adapter/index.js";
export const DOMAIN_SERVICE_KITS_VERSION = "0.1.0";
export const VIEW_RIG_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const SPATIAL_INTERACTION_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const COMPLETION_LEDGER_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const OBJECTIVE_BRIDGE_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const LOCK_GROUP_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const DAMAGE_HEALTH_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const ENCOUNTER_DIRECTOR_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const RESOURCE_NODE_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const BUILD_PLACEMENT_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const STRUCTURE_RUNTIME_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const DIEGETIC_FEEDBACK_SIGNAL_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export const ASSET_DESCRIPTOR_KIT_VERSION = DOMAIN_SERVICE_KITS_VERSION;
export { HAZARD_DIRECTOR_KIT_VERSION, createHazardDirectorKit } from "../domain-foundation/index.js";

function define(id, camelName, engineKey, category, provides, purpose, requires = []) {
  return Object.freeze({ id, camelName, engineKey, category, tier: "atomic", version: DOMAIN_SERVICE_KITS_VERSION, provides, requires, purpose });
}

export const VIEW_RIG_KIT_DEFINITION = define("view-rig-kit", "viewRigKit", "viewRig", "camera-feedback", ["view:rig", "view:ray", "camera:descriptor"], "View rig, view-ray, focus target, and camera descriptor state.");
export const SPATIAL_INTERACTION_KIT_DEFINITION = define("spatial-interaction-kit", "spatialInteractionKit", "spatialInteraction", "spatial", ["interaction:spatial", "interaction:validation", "interaction:hold"], "Spatial interaction validation, focus, hold, cooldown, and rejection state.", ["interaction:registry"]);
export const COMPLETION_LEDGER_KIT_DEFINITION = define("completion-ledger-kit", "completionLedgerKit", "completionLedger", "spatial", ["completion:ledger", "completion:unique"], "Unique completion ledger and group completion state.");
export const OBJECTIVE_BRIDGE_KIT_DEFINITION = define("objective-bridge-kit", "objectiveBridgeKit", "objectiveBridge", "progression", ["objective:bridge", "objective:action-events"], "Bridge domain facts into objective action records.", ["completion:ledger"]);
export const LOCK_GROUP_KIT_DEFINITION = define("lock-group-kit", "lockGroupKit", "lockGroup", "progression", ["lock:group", "gate:unlock", "portal:unlock"], "Generic gate, socket, portal, and door unlock groups.", ["completion:ledger"]);
export const DAMAGE_HEALTH_KIT_DEFINITION = define("damage-health-kit", "damageHealthKit", "damageHealth", "hazard-combat", ["damage:health", "health:pools", "failure:death-events"], "Health pools, damage, healing, invulnerability, and death/failure state.");
export const ENCOUNTER_DIRECTOR_KIT_DEFINITION = define("encounter-director-kit", "encounterDirectorKit", "encounterDirector", "hazard-combat", ["encounter:director", "spawn:budget", "waves:director"], "Encounter phase, spawn budget, wave, and pressure director state.");
export const RESOURCE_NODE_KIT_DEFINITION = define("resource-node-kit", "resourceNodeKit", "resourceNode", "economy-resources", ["resource:nodes", "resource:harvest"], "Harvestable resource node, depletion, and collection state.");
export const BUILD_PLACEMENT_KIT_DEFINITION = define("build-placement-kit", "buildPlacementKit", "buildPlacement", "building", ["build:placement", "build:validation"], "Build selection, placement preview, cost/range validation, and rejection state.");
export const STRUCTURE_RUNTIME_KIT_DEFINITION = define("structure-runtime-kit", "structureRuntimeKit", "structureRuntime", "building", ["structure:runtime", "structure:health", "structure:actions"], "Placed structure health, activation, cooldown, repair, and destruction state.");
export const DIEGETIC_FEEDBACK_SIGNAL_KIT_DEFINITION = define("diegetic-feedback-signal-kit", "diegeticFeedbackSignalKit", "diegeticFeedback", "camera-feedback", ["feedback:diegetic", "render:world-signals"], "World-space marker, glow, danger, objective, and prompt signal descriptors.");
export const ASSET_DESCRIPTOR_KIT_DEFINITION = define("asset-descriptor-kit", "assetDescriptorKit", "assetDescriptor", "render-descriptors", ["asset:descriptors", "render:asset-registry"], "Renderer-agnostic asset, atlas, material, and effect descriptor registry.");

export const DOMAIN_SERVICE_KIT_DEFINITIONS = Object.freeze([
  VIEW_RIG_KIT_DEFINITION,
  SPATIAL_INTERACTION_KIT_DEFINITION,
  COMPLETION_LEDGER_KIT_DEFINITION,
  OBJECTIVE_BRIDGE_KIT_DEFINITION,
  LOCK_GROUP_KIT_DEFINITION,
  DAMAGE_HEALTH_KIT_DEFINITION,
  ENCOUNTER_DIRECTOR_KIT_DEFINITION,
  RESOURCE_NODE_KIT_DEFINITION,
  BUILD_PLACEMENT_KIT_DEFINITION,
  STRUCTURE_RUNTIME_KIT_DEFINITION,
  DIEGETIC_FEEDBACK_SIGNAL_KIT_DEFINITION,
  ASSET_DESCRIPTOR_KIT_DEFINITION
]);

export function createViewRigKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, VIEW_RIG_KIT_DEFINITION, config); }
export function createSpatialInteractionKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, SPATIAL_INTERACTION_KIT_DEFINITION, config); }
export function createCompletionLedgerKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, COMPLETION_LEDGER_KIT_DEFINITION, config); }
export function createObjectiveBridgeKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, OBJECTIVE_BRIDGE_KIT_DEFINITION, config); }
export function createLockGroupKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, LOCK_GROUP_KIT_DEFINITION, config); }
export function createDamageHealthKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, DAMAGE_HEALTH_KIT_DEFINITION, config); }
export function createEncounterDirectorKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, ENCOUNTER_DIRECTOR_KIT_DEFINITION, config); }
export function createResourceNodeKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, RESOURCE_NODE_KIT_DEFINITION, config); }
export function createBuildPlacementKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, BUILD_PLACEMENT_KIT_DEFINITION, config); }
export function createStructureRuntimeKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, STRUCTURE_RUNTIME_KIT_DEFINITION, config); }
export function createDiegeticFeedbackSignalKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, DIEGETIC_FEEDBACK_SIGNAL_KIT_DEFINITION, config); }
export function createAssetDescriptorKit(NexusEngine, config = {}) { return createGenericProtoKit(NexusEngine, ASSET_DESCRIPTOR_KIT_DEFINITION, config); }

export const createNCompletionLedgerKit = createCompletionLedgerKit;

export function createDomainServiceKits(NexusEngine, config = {}) {
  ({ NexusEngine, config } = normalizeProtoKitFactoryArgs(NexusEngine, config));
  const cfg = config ?? {};
  return [
    createViewRigKit(NexusEngine, cfg.viewRig ?? {}),
    createSpatialInteractionKit(NexusEngine, cfg.spatialInteraction ?? {}),
    createCompletionLedgerKit(NexusEngine, cfg.completionLedger ?? {}),
    createObjectiveBridgeKit(NexusEngine, cfg.objectiveBridge ?? {}),
    createLockGroupKit(NexusEngine, cfg.lockGroup ?? {}),
    createDamageHealthKit(NexusEngine, cfg.damageHealth ?? {}),
    createEncounterDirectorKit(NexusEngine, cfg.encounterDirector ?? {}),
    createResourceNodeKit(NexusEngine, cfg.resourceNode ?? {}),
    createBuildPlacementKit(NexusEngine, cfg.buildPlacement ?? {}),
    createStructureRuntimeKit(NexusEngine, cfg.structureRuntime ?? {}),
    createDiegeticFeedbackSignalKit(NexusEngine, cfg.diegeticFeedback ?? {}),
    createAssetDescriptorKit(NexusEngine, cfg.assetDescriptor ?? {})
  ];
}

export * from "../2d-platformer-domain/index.js";
export * from "../adventure-domain/index.js";
export * from "../survival-crafting-domain/index.js";
export * from "../environment-domain/index.js";

export default createDomainServiceKits;
