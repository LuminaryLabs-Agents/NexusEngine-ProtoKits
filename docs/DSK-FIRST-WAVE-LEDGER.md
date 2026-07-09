# DSK First-Wave Ledger

This ledger closes the first controlled DSK migration wave for the `0.0.2` contract pass. All listed kits install through the shared `nexus-dsk-adapter`, return `defineDomainServiceKit()` objects with the real NexusEngine runtime, and keep old injected-runtime calls as migration shims.

| Kit | DSK id | Token | Engine API | Status | Closure |
| --- | --- | --- | --- | --- | --- |
| `token-registry` | `n-token-registry-kit` | `n:token-registry` | `engine.n.tokenRegistry` | `promoted-candidate` | Has reset, snapshot, docs, adapter test, and compatibility API. |
| `completion-ledger` | `n-completion-ledger-kit` | `n:completion-ledger` | `engine.n.completionLedger` | `promoted-candidate` | Has reset, snapshot, docs, adapter test, and compatibility API. |
| `scan-survey` | `n-scan-survey-kit` | `n:scan-survey` | `engine.n.scanSurvey` | `promoted-candidate` | Has reset, snapshot, docs, adapter test, and compatibility API. |
| `route-checkpoint` | `n-route-checkpoint-kit` | `n:route-checkpoint` | `engine.n.routeCheckpoint` | `promoted-candidate` | Has reset, snapshot, docs, adapter test, and compatibility API. |
| `resource-pressure` | `n-resource-pressure-kit` | `n:resource-pressure` | `engine.n.resourcePressure` | `promoted-candidate` | Has reset, snapshot, docs, adapter test, and compatibility API. |
| `zone-field` | `n-zone-field-kit` | `n:zone-field` | `engine.n.zoneField` | `promoted-candidate` | Has reset, snapshot, docs, adapter test, and compatibility API. |
| `hazard-director` | `n-hazard-director-kit` | `n:hazard-director` | `engine.n.hazardDirector` | `promoted-candidate` | Has reset, snapshot, docs, adapter test, and compatibility API. |

No first-wave kit is left half migrated. Promotion into `NexusEngine/src` is intentionally deferred until a separate promotion-readiness pass chooses the specific candidate and keeps a thin ProtoKits shim with a removal condition.
