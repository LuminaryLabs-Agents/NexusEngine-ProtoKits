export {
  PROJECT_BATCH_DEPLOY_BRIDGE_VERSION,
  convertProjectBatchItemToDeployManifest,
  convertProjectBatchToDeployManifests,
  createProjectBatchDeployBridge,
  default
} from "../project-batch-deploy-bridge/index.js";

export const AAA_BATCH_DEPLOY_BRIDGE_VERSION = PROJECT_BATCH_DEPLOY_BRIDGE_VERSION;
export const convertAaaBatchGameToDeployManifest = convertProjectBatchItemToDeployManifest;
export const convertAaaBatchGamesToDeployManifests = convertProjectBatchToDeployManifests;
export const createAaaBatchDeployBridge = createProjectBatchDeployBridge;
