import { createAsyncDomainLoadKit } from "../async-domain-load-kit/index.js";
import { createAssetLoadQueueKit } from "../asset-load-queue-kit/index.js";
import { createObjaverseCatalogKit } from "../objaverse-catalog-kit/index.js";
import { createObjaverseMeshCacheKit } from "../objaverse-mesh-cache-kit/index.js";
import { createWindFieldKit } from "../wind-field-kit/index.js";
import { createWindResponseKit } from "../wind-response-kit/index.js";
import { createObjectFamilyKit } from "../object-family-kit/index.js";
import { createObjectVariantSelectionKit } from "../object-variant-selection-kit/index.js";
import { createObjectLodPolicyKit } from "../object-lod-policy-kit/index.js";
import { createObjectMaterialVariantKit } from "../object-material-variant-kit/index.js";
import { createObjectGroundingProfileKit } from "../object-grounding-profile-kit/index.js";
import { createObjectMeshRequestKit } from "../object-mesh-request-kit/index.js";
import { createObjectResidencyKit } from "../object-residency-kit/index.js";

export const PROCEDURAL_FOLIAGE_COMPOSITION_KIT_VERSION = "0.1.0";
export function createProceduralFoliageConfig(overrides = {}) { return { seed: "procedural-foliage", ...overrides }; }
export function createProceduralFoliageKits(NexusRealtime = {}, config = {}) { const cfg = createProceduralFoliageConfig(config); return [createAsyncDomainLoadKit(NexusRealtime, cfg.async ?? {}), createAssetLoadQueueKit(NexusRealtime, cfg.assets ?? {}), createObjaverseCatalogKit(NexusRealtime, cfg.objaverseCatalog ?? {}), createObjaverseMeshCacheKit(NexusRealtime, cfg.objaverseMeshCache ?? {}), createObjectFamilyKit(NexusRealtime, cfg.objectFamily ?? {}), createObjectVariantSelectionKit(NexusRealtime, cfg.objectVariantSelection ?? {}), createObjectLodPolicyKit(NexusRealtime, cfg.objectLodPolicy ?? {}), createObjectMaterialVariantKit(NexusRealtime, cfg.objectMaterialVariant ?? {}), createObjectGroundingProfileKit(NexusRealtime, cfg.objectGroundingProfile ?? {}), createObjectMeshRequestKit(NexusRealtime, cfg.objectMeshRequest ?? {}), createObjectResidencyKit(NexusRealtime, cfg.objectResidency ?? {}), createWindFieldKit(NexusRealtime, cfg.wind ?? {}), createWindResponseKit(NexusRealtime, cfg.windResponse ?? {})]; }
export default createProceduralFoliageKits;
