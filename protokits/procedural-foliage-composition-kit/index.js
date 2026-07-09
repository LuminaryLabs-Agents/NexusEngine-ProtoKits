import { createAsyncDomainLoadKit } from "../async-domain-load-kit/index.js";
import { createAssetLoadQueueKit } from "../asset-load-queue-kit/index.js";
import { createObjaverseCatalogKit } from "../objaverse-catalog-kit/index.js";
import { createObjaverseMeshCacheKit } from "../objaverse-mesh-cache-kit/index.js";
import { createWindFieldKit } from "../wind-field-kit/index.js";
import { createWindResponseKit } from "../wind-response-kit/index.js";
import { createTimeOfDayKit } from "../time-of-day-kit/index.js";
import { createProceduralSkyboxKit } from "../procedural-skybox-kit/index.js";
import { createProceduralCloudLayerKit } from "../procedural-cloud-layer-kit/index.js";
import { createFpsMotionKit } from "../fps-motion-kit/index.js";
import { createFootstepFeedbackKit } from "../footstep-feedback-kit/index.js";
import { createCameraShakeKit } from "../camera-shake-kit/index.js";
import { createVegetationDensityFieldKit } from "../vegetation-density-field-kit/index.js";
import { createVegetationPlacementKit } from "../vegetation-placement-kit/index.js";
import { createFoliageImpostorKit } from "../foliage-impostor-kit/index.js";
import { createFoliageBatchDescriptorKit } from "../foliage-batch-descriptor-kit/index.js";
import { createObjectFamilyKit } from "../object-family-kit/index.js";
import { createObjectVariantSelectionKit } from "../object-variant-selection-kit/index.js";
import { createObjectLodPolicyKit } from "../object-lod-policy-kit/index.js";
import { createObjectMaterialVariantKit } from "../object-material-variant-kit/index.js";
import { createObjectGroundingProfileKit } from "../object-grounding-profile-kit/index.js";
import { createObjectMeshRequestKit } from "../object-mesh-request-kit/index.js";
import { createObjectResidencyKit } from "../object-residency-kit/index.js";

export const PROCEDURAL_FOLIAGE_COMPOSITION_KIT_VERSION = "0.1.0";
export function createProceduralFoliageConfig(overrides = {}) { return { seed: "procedural-foliage", ...overrides }; }
export function createProceduralFoliageKits(NexusEngine = {}, config = {}) { const c = createProceduralFoliageConfig(config); return [createAsyncDomainLoadKit(NexusEngine, c.async ?? {}), createAssetLoadQueueKit(NexusEngine, c.assets ?? {}), createObjaverseCatalogKit(NexusEngine, c.objaverseCatalog ?? {}), createObjaverseMeshCacheKit(NexusEngine, c.objaverseMeshCache ?? {}), createObjectFamilyKit(NexusEngine, c.objectFamily ?? {}), createObjectVariantSelectionKit(NexusEngine, c.objectVariantSelection ?? {}), createObjectLodPolicyKit(NexusEngine, c.objectLodPolicy ?? {}), createObjectMaterialVariantKit(NexusEngine, c.objectMaterialVariant ?? {}), createObjectGroundingProfileKit(NexusEngine, c.objectGroundingProfile ?? {}), createObjectMeshRequestKit(NexusEngine, c.objectMeshRequest ?? {}), createObjectResidencyKit(NexusEngine, c.objectResidency ?? {}), createWindFieldKit(NexusEngine, c.wind ?? {}), createWindResponseKit(NexusEngine, c.windResponse ?? {}), createTimeOfDayKit(NexusEngine, c.timeOfDay ?? {}), createProceduralSkyboxKit(NexusEngine, c.skybox ?? {}), createProceduralCloudLayerKit(NexusEngine, c.clouds ?? {}), createFpsMotionKit(NexusEngine, c.fpsMotion ?? {}), createFootstepFeedbackKit(NexusEngine, c.footsteps ?? {}), createCameraShakeKit(NexusEngine, c.cameraShake ?? {}), createVegetationDensityFieldKit(NexusEngine, c.vegetationDensity ?? {}), createVegetationPlacementKit(NexusEngine, c.vegetationPlacement ?? {}), createFoliageImpostorKit(NexusEngine, c.foliageImpostors ?? {}), createFoliageBatchDescriptorKit(NexusEngine, c.foliageBatches ?? {})]; }
export default createProceduralFoliageKits;
