# aaa-batch-deploy-bridge

## Status

Deprecated compatibility alias.

Use `project-batch-deploy-bridge` for all new code and documentation.

## Purpose

This path remains available so existing consumers do not break. It re-exports the neutral project batch deploy bridge API and keeps the old function names as aliases.

## Preferred replacement

```js
import {
  convertProjectBatchItemToDeployManifest,
  convertProjectBatchToDeployManifests,
  createProjectBatchDeployBridge
} from "../project-batch-deploy-bridge/index.js";
```

## Legacy aliases retained

- `convertAaaBatchGameToDeployManifest(game)`
- `convertAaaBatchGamesToDeployManifests(games)`
- `createAaaBatchDeployBridge(games)`
- `AAA_BATCH_DEPLOY_BRIDGE_VERSION`

## Compatibility rule

Do not remove this path until all existing consumers have migrated. New docs should use project batch / high-fidelity / vertical-slice language instead of AAA as a naming category.
