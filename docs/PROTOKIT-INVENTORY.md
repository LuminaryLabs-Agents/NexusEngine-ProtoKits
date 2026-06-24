# ProtoKit Inventory

Generated shape introduced by `scripts/generate-kit-inventory.mjs`. This initial inventory records the additive composition layer added by the master upgrade pass; rerun the generator to expand coverage across all legacy kits.

| Path | ID | Domain | Type | Status | Purpose |
|---|---|---|---|---|---|
| `protokits/domain-boundary-kit` | `domain-boundary-kit` | domain-boundary | atomic-domain-service-kit | experimental | Reusable domain ownership boundary metadata. |
| `protokits/deploy-manifest-kit` | `deploy-manifest-kit` | deploy-manifest | composition-kit | experimental | Normalize and validate deploy/scene manifests. |
| `protokits/deploy-registry-kit` | `deploy-registry-kit` | deploy-registry | composition-kit | experimental | Register deploy manifests and resolve kit stacks. |
| `protokits/asset-pack-manifest-kit` | `asset-pack-manifest-kit` | asset-pack-manifest | composition-kit | experimental | Describe lazy-loadable asset packs. |
| `protokits/scene-lifecycle-kit` | `scene-lifecycle-kit` | scene-lifecycle | composition-kit | experimental | Enter, pause, resume, exit, and dispose scenes. |
| `protokits/scene-transition-kit` | `scene-transition-kit` | scene-transition | composition-kit | experimental | Request, complete, and cancel scene transitions. |
| `protokits/save-delta-kit` | `save-delta-kit` | save-delta | composition-kit | experimental | Store scene changes as delta patches. |
| `protokits/host-shell-contract-kit` | `host-shell-contract-kit` | host-shell-contract | composition-kit | experimental | Define host/HUD/frame/error/restart contracts. |
| `protokits/session-facade-kit` | `session-facade-kit` | session-facade | composition-kit | experimental | Small host-facing session API for dispatch/snapshot/smoke. |
| `protokits/scene-graph-domain-kit` | `scene-graph-domain-kit` | scene-graph | atomic-domain-service-kit | experimental | General scene object graph and patch state. |
| `protokits/kit-registry` | `kit-registry` | kit-registry | tooling-kit | experimental | Pure registry helpers for kit manifests. |
| `protokits/aaa-batch-deploy-bridge` | `aaa-batch-deploy-bridge` | compatibility-bridge | bridge-kit | experimental | Convert AAA batch specs into deploy manifests. |
| `protokits/gallery-registry-bridge` | `gallery-registry-bridge` | compatibility-bridge | bridge-kit | experimental | Convert gallery app entries into deploy manifests. |
| `protokits/generated-route-host-bridge` | `generated-route-host-bridge` | compatibility-bridge | bridge-kit | experimental | Represent generated route hosts as host-shell contracts. |
