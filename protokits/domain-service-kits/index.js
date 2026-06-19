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

export function createViewRigKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, VIEW_RIG_KIT_DEFINITION, config); }
export function createSpatialInteractionKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, SPATIAL_INTERACTION_KIT_DEFINITION, config); }
export function createCompletionLedgerKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, COMPLETION_LEDGER_KIT_DEFINITION, config); }
export function createObjectiveBridgeKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, OBJECTIVE_BRIDGE_KIT_DEFINITION, config); }
export function createLockGroupKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, LOCK_GROUP_KIT_DEFINITION, config); }
export function createDamageHealthKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, DAMAGE_HEALTH_KIT_DEFINITION, config); }
export function createEncounterDirectorKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, ENCOUNTER_DIRECTOR_KIT_DEFINITION, config); }
export function createResourceNodeKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, RESOURCE_NODE_KIT_DEFINITION, config); }
export function createBuildPlacementKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, BUILD_PLACEMENT_KIT_DEFINITION, config); }
export function createStructureRuntimeKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, STRUCTURE_RUNTIME_KIT_DEFINITION, config); }
export function createDiegeticFeedbackSignalKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, DIEGETIC_FEEDBACK_SIGNAL_KIT_DEFINITION, config); }
export function createAssetDescriptorKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, ASSET_DESCRIPTOR_KIT_DEFINITION, config); }

export const createNCompletionLedgerKit = createCompletionLedgerKit;

export function createDomainServiceKits(NexusRealtime, config = {}) {
  ({ NexusRealtime, config } = normalizeProtoKitFactoryArgs(NexusRealtime, config));
  const cfg = config ?? {};
  return [
    createViewRigKit(NexusRealtime, cfg.viewRig ?? {}),
    createSpatialInteractionKit(NexusRealtime, cfg.spatialInteraction ?? {}),
    createCompletionLedgerKit(NexusRealtime, cfg.completionLedger ?? {}),
    createObjectiveBridgeKit(NexusRealtime, cfg.objectiveBridge ?? {}),
    createLockGroupKit(NexusRealtime, cfg.lockGroup ?? {}),
    createDamageHealthKit(NexusRealtime, cfg.damageHealth ?? {}),
    createEncounterDirectorKit(NexusRealtime, cfg.encounterDirector ?? {}),
    createResourceNodeKit(NexusRealtime, cfg.resourceNode ?? {}),
    createBuildPlacementKit(NexusRealtime, cfg.buildPlacement ?? {}),
    createStructureRuntimeKit(NexusRealtime, cfg.structureRuntime ?? {}),
    createDiegeticFeedbackSignalKit(NexusRealtime, cfg.diegeticFeedback ?? {}),
    createAssetDescriptorKit(NexusRealtime, cfg.assetDescriptor ?? {})
  ];
}

export * from "../2d-platformer-domain/index.js";
export * from "../adventure-domain/index.js";
export * from "../survival-crafting-domain/index.js";
export * from "../environment-domain/index.js";

export default createDomainServiceKits;
