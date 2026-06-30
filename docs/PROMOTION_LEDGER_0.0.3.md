# ProtoKits Promotion Ledger 0.0.3

## Purpose

This ledger classifies ProtoKits for the NexusRealtime 0.0.3 release hardening line.

## Lanes

| Lane | Meaning | Outcome |
|---|---|---|
| `promotion-ready` | Generic, DSK-shaped, headless-testable, snapshot/reset aware. | Candidate for `NexusRealtime-Kits`. |
| `incubating` | Useful but still unstable or missing proof. | Stays in ProtoKits. |
| `bridge-adapter` | Host, renderer, third-party, XR, or platform bridge. | Not promoted as gameplay/domain truth. |
| `scenario-mode` | Route, game, project, or demo composition. | Stays outside stable generic kits. |
| `archive` | Superseded, obsolete, or unmaintained. | Remove from active promotion queue. |

## 0.0.3 candidate decisions

| ProtoKit / family | Lane | Promote target | Decision |
|---|---|---|---|
| `environment-kits` | `promotion-ready` if headless checks pass | `environment-domain-kit` | Promote after manifest and replay proof. |
| `stereoscopic-render-domain-kit` | `bridge-adapter` | `stereoscopic-render-domain-kit` | Promote only as descriptor/adapter boundary. |
| `terrain-ground-contact-domain-kit` | `promotion-ready` | `terrain-ground-contact-kit` | Promote after deterministic seating proof. |
| `world-zone-domain-kit` | `promotion-ready` | `world-zone-kit` | Promote after zone enter/exit replay proof. |
| `interaction-domain-kit` | `promotion-ready` | `interaction-domain-kit` | Promote after conflict check with core interaction. |
| `damage-health-domain-kit` | `promotion-ready` | `damage-health-kit` | Promote as nested stable domain if generic. |
| `quest-thread-domain-kit` | `promotion-ready` | `quest-thread-kit` | Promote as nested progression domain if generic. |
| `dialogue-line-domain-kit` | `promotion-ready` | `dialogue-line-kit` | Promote as nested dialogue domain if generic. |
| `spatial-scene-graph-kit` | `promotion-ready` | `spatial-scene-graph-kit` | Promote if renderer-agnostic. |
| `selection-domain-service-kit` | `promotion-ready` | `selection-domain-kit` | Promote after API freeze. |
| `transform-domain-service-kit` | `promotion-ready` | `transform-domain-kit` | Promote after duplicate-operation proof. |
| `persistence-domain-service-kit` | `promotion-ready` | `save-snapshot-kit` | Promote after snapshot/restore proof. |
| `generic-defense-*` | `scenario-mode` or split candidates | stable kit subdomains only | Keep session/project facade in ProtoKits. |
| `gpu-terrain-performance-circle-kit` | `bridge-adapter` | none | Keep as performance harness. |
| `banded-infinite-terrain-kit` | `incubating` | terrain domain candidate | Promote only after headless deterministic proof. |

## Required promotion proof

```txt
stable domain name
runtime install path
requires/provides tokens
human README
machine-readable manifest
headless smoke test
valid action test
invalid action test
duplicate/replay test
snapshot/reset policy if stateful
no renderer-owned gameplay
no DOM/Canvas/Three/WebGL dependency unless adapter-host
```
