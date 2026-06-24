# ProtoKit Inventory

This inventory tracks current documentation and composition status. It started as the additive composition-layer inventory and now includes legacy family groups that still need deeper individual kit manifests.

## Composition kits

| Path | ID | Domain | Type | Status | Docs | Manifest | Purpose |
|---|---|---|---|---|---|---|---|
| `protokits/domain-boundary-kit` | `domain-boundary-kit` | domain-boundary | atomic-domain-service-kit | experimental | README | manifest | Reusable domain ownership boundary metadata. |
| `protokits/deploy-manifest-kit` | `deploy-manifest-kit` | deploy-manifest | composition-kit | experimental | README | manifest | Normalize and validate deploy/scene manifests. |
| `protokits/deploy-registry-kit` | `deploy-registry-kit` | deploy-registry | composition-kit | experimental | README | manifest | Register deploy manifests and resolve kit stacks. |
| `protokits/asset-pack-manifest-kit` | `asset-pack-manifest-kit` | asset-pack-manifest | composition-kit | experimental | README | manifest | Describe lazy-loadable asset packs. |
| `protokits/scene-lifecycle-kit` | `scene-lifecycle-kit` | scene-lifecycle | composition-kit | experimental | README | manifest | Enter, pause, resume, exit, and dispose scenes. |
| `protokits/scene-transition-kit` | `scene-transition-kit` | scene-transition | composition-kit | experimental | README | manifest | Request, complete, and cancel scene transitions. |
| `protokits/save-delta-kit` | `save-delta-kit` | save-delta | composition-kit | experimental | README | manifest | Store scene changes as delta patches. |
| `protokits/host-shell-contract-kit` | `host-shell-contract-kit` | host-shell-contract | composition-kit | experimental | README | manifest | Define host/HUD/frame/error/restart contracts. |
| `protokits/session-facade-kit` | `session-facade-kit` | session-facade | composition-kit | experimental | README | manifest | Host-facing session API for dispatch/snapshot/smoke. |
| `protokits/scene-graph-domain-kit` | `scene-graph-domain-kit` | scene-graph | atomic-domain-service-kit | experimental | README | manifest | General scene object graph and patch state. |
| `protokits/kit-registry` | `kit-registry` | kit-registry | tooling-kit | experimental | README | no manifest | Pure registry helpers for kit manifests. |
| `protokits/project-batch-deploy-bridge` | `project-batch-deploy-bridge` | compatibility-bridge | bridge-kit | experimental | README | no manifest | Convert project batch specs into deploy manifests. |
| `protokits/gallery-registry-bridge` | `gallery-registry-bridge` | compatibility-bridge | bridge-kit | experimental | README | no manifest | Convert gallery app entries into deploy manifests. |
| `protokits/generated-route-host-bridge` | `generated-route-host-bridge` | compatibility-bridge | bridge-kit | experimental | README | no manifest | Represent generated route hosts as host-shell contracts. |

## Deprecated compatibility aliases

Legacy quality-tier bridge paths remain in the repo only so existing consumers do not break. New docs and code should use project/high-fidelity naming instead.

## Public legacy families

| Family / path | Public exports | Documentation status | Next action |
|---|---|---|---|
| `aerial-canyon-kits` | canyon terrain, flight corridor, powered aerial flight, vegetation, procedural objects, projectile, combat, encounter, camera, mission | Existing README is strong | Add individual manifests and promotion evidence. |
| `aerial-biome-fidelity-kits` | aerial biome fidelity family | README stub | Extract APIs/resources/events and add manifests. |
| `aerial-cel-flight-feel-kits` | aerial cel flight feel family | README stub | Add source inventory and manifests. |
| `aerial-render-bundle-kits` | render bundle family | README stub | Add descriptor inventory and performance contract. |
| `aerial-ui-interaction-kits` | aerial UI/interaction family | README stub | Add input/interaction contract docs. |
| `environment-kits` | environment/fidelity family | README stub | Add terrain/weather/vegetation/visual target docs. |
| `rpg-social-domain-kits` | dialogue, relationship, NPC schedule, shop inventory, quest thread | README stub | Add individual manifests and data contracts. |
| `scoped-rpg-domain-kits-batch-02` | enemy, agent, damage, guard, parry, mana, status, vegetation, route, contact, zone, interaction | README stub | Add individual manifests and boundary docs. |
| `spatial-authoring-kits` | hand/XR adapters, gesture, scene graph, selection, transform, widget, interaction, persistence | Existing README is strong | Add individual manifests and boundary alignment. |
| `generic-defense-dsk-boundaries` | map, economy, build, wave, combat, session, render boundaries | README stub + strong source boundary metadata | Add manifests and align with `domain-boundary-kit`. |

## Game-family groups from root README

| Family | Known kits | Documentation status | Next action |
|---|---|---|---|
| Vertical Climb / Next Ledge | content palette, layered object, vertical climb core, ledge route, simple swing, endless ascent, cloud zone, climb input, climb camera, diegetic feedback, climb risk, next ledge | Family doc added | Add per-kit docs after composition layer. |
| Arcade Race | downhill race, slope traversal, racer AI, difficulty curve, race hazard, boost path, racer contact, race pacing, course director, arcade race visual | Family doc added | Add per-kit docs after composition layer. |
| Generic Open-World / Flight | data registry, performance budget, sky, lighting, material, terrain sampler, world patch, scatter, instancing, flight, actor render, flock, updraft, checkpoint | Family doc added | Prioritize performance/world/flight foundation READMEs. |

## Tooling and tests

| Path | Purpose | Status |
|---|---|---|
| `scripts/validate-kit-manifests.mjs` | manifest shape validation | added |
| `scripts/generate-kit-inventory.mjs` | inventory generator | added |
| `scripts/check-domain-boundaries.mjs` | domain boundary validation | added |
| `scripts/validate-performance-contracts.mjs` | performance contract validation | added |
| `scripts/check-doc-coverage.mjs` | warning-first README/manifest coverage | added |
| `tests/composition-layer-smoke.test.mjs` | composition layer smoke test | updated for project batch bridge |

## Rollout rule

Legacy undocumented kits warn. New composition kits require README coverage, and runtime/domain kits in the composition layer require manifests. Quality target words should not become kit names, bridge names, family names, or domain boundaries.
