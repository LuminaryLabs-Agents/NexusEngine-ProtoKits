# DSM Catalog

This catalog is a reusable domain/service map. It is not a list of games.

```txt
DSM = architecture concept
Kit = implementation unit
```

Each catalog entry lists the reusable domain and the intended `-kit` implementation name.

Games and experiments compose kits through data. A kit should be named after reusable domain/service meaning, not the first game that needs it.

## Foundation domains

- **Seeded random domain** — implementation: `seeded-random-kit` or foundation service; services: scoped seeds, repeatable samples.
- **Progress timer domain** — implementation: `progress-timer-kit`; services: hold timers, countdowns, cooldowns, progress windows.
- **Ledger domain** — implementation: `ledger-kit` / `completion-ledger-kit`; services: one-shot completion, idempotency records.
- **Snapshot domain** — implementation: `snapshot-kit`; services: snapshot, reset, loadSnapshot helpers.
- **Token registry domain** — implementation: `token-registry-kit`; services: requires/provides token validation.

## Spatial domains

- **Route domain** — implementation: `route-kit`; services: ordered route points, curves, progress, corridor width, route metadata.
- **Bezier route domain** — implementation: `bezier-route-kit`; services: Bezier/Catmull sampling, nearest point, curve tangents.
- **Terrain domain** — implementation: `terrain-kit`; services: terrain bounds, height, surface type, walkability, slope, normals.
- **Terrain sampler domain** — implementation: `terrain-sampler-kit`; services: `heightAt`, `normalAt`, `biomeAt`, patch queries.
- **World patch domain** — implementation: `world-patch-kit`; services: chunk lifecycle, nearby loading, distant pruning, patch descriptors.
- **Scatter placement domain** — implementation: `scatter-placement-kit`; services: seeded object placement with spacing, slope, route, and biome constraints.
- **Raycast hit domain** — implementation: `raycast-hit-kit` or `raycast-placement-kit`; services: aim, scan, placement, line-of-sight checks.
- **Visibility domain** — implementation: `visibility-kit`; services: visibility ranges, occlusion hints, fog visibility, reveal rules.
- **Volume domain** — implementation: `volume-kit`; services: trigger, force, fog, danger, safe, healing, and objective volumes.

## Natural-world domains

- **Biome field domain** — implementation: `biome-field-kit`; services: `biomeAt`, biome blending, biome placement rules, material overrides.
- **Forest domain** — implementation: `forest-kit`; services: forest density, bands, tree distribution, visibility/corridor framing.
- **Tree domain** — implementation: `tree-kit`; services: trunk/canopy/leaf domain, variants, collider hints, render descriptors.
- **Leaf domain** — implementation: `leaf-kit`; services: leaf density, color variation, spawn distribution, wind response, foliage descriptors.
- **Branch domain** — implementation: `branch-kit`; services: branch sockets, spread, bend, canopy support.
- **Canopy domain** — implementation: `canopy-kit`; services: canopy layers, silhouette, density, visibility impact.
- **Vegetation archetype domain** — implementation: `vegetation-archetype-kit`; services: species tables, biome sampling, scale ranges, LOD sets.
- **Vegetation LOD domain** — implementation: `vegetation-lod-kit`; services: detail selection, cull distance, billboard descriptors.
- **Ground contact domain** — implementation: `ground-contact-kit`; services: ground seating, terrain inset, normal alignment, slope filtering.
- **Rock domain** — implementation: `rock-kit`; services: rocks/boulders, obstacle hints, placement rules, render descriptors.
- **Ground cover domain** — implementation: `ground-cover-kit`; services: grass, ferns, small props, density, seasonal variants.
- **Weather atmosphere domain** — implementation: `weather-atmosphere-kit`; services: sky, wind, haze, precipitation, time-of-day descriptors.

## Interaction domains

- **Action input domain** — implementation: `action-input-kit`; services: semantic actions, axes, buttons, aim, held/pressed/released state.
- **Scan target domain** — implementation: `scan-target-kit`; services: target registration, range/facing/raycast validation, scan progress, completion.
- **Facing cone domain** — implementation: `facing-cone-kit`; services: forward cone checks, dot thresholds, target prioritization.
- **Distance check domain** — implementation: `distance-check-kit`; services: reusable distance/radius checks with stable units.
- **Interaction target domain** — implementation: `interaction-target-kit`; services: interactable targets, prompts, activation facts.
- **Placement domain** — implementation: `placement-kit`; services: validate/commit placement requests on terrain, grid, or route surfaces.
- **Build placement domain** — implementation: `build-placement-kit`; services: buildable objects, constraints, cost validation, preview descriptors.

## Objective/progression domains

- **Objective flow domain** — implementation: `objective-flow-kit`; services: ordered steps, completion, failure, status prompts.
- **Checkpoint domain** — implementation: `checkpoint-kit`; services: checkpoint volumes, gates, rings, route progress, completion events.
- **Beacon domain** — implementation: `beacon-kit`; services: objective direction, beams, range indicators, active target descriptors.
- **Gate domain** — implementation: `gate-kit`; services: locked/open/entered states, requirements, transition descriptors.
- **Completion ledger domain** — implementation: `completion-ledger-kit`; services: completed IDs, one-shot events, replay-safe completion state.
- **Route checkpoint domain** — implementation: `route-checkpoint-kit`; services: route-driven objective checkpoints and route milestone events.

## Actor/threat domains

- **Agent group domain** — implementation: `agent-group-kit`; services: groups, agents, goals, basic movement, formation state.
- **Patrol domain** — implementation: `patrol-kit`; services: patrol curves, loops, wait points, seeded variation.
- **Chase domain** — implementation: `chase-kit`; services: pursuit rules, target acquisition, break-off rules.
- **Threat pressure domain** — implementation: `threat-pressure-kit`; services: danger intensity, escalation, pressure windows, fail pressure.
- **Hazard director domain** — implementation: `hazard-director-kit`; services: hazard spawn/activation scheduling and descriptors.
- **Damage health domain** — implementation: `damage-health-kit`; services: health, damage, healing, defeat, invulnerability windows.
- **Encounter director domain** — implementation: `encounter-director-kit`; services: encounter pacing, spawn budgets, waves, escalation.

## Resource/economy/build domains

- **Resource pressure domain** — implementation: `resource-pressure-kit`; services: health, oxygen, signal, corruption, stamina, fuel meters.
- **Resource node domain** — implementation: `resource-node-kit`; services: harvestable/pickup nodes, yields, depletion, respawn.
- **Cargo delivery domain** — implementation: `cargo-delivery-kit`; services: pickup/carry/deliver loops, payload state, delivery targets.
- **Inventory domain** — implementation: `inventory-kit`; services: slots/stacks/equipment state.
- **Crafting domain** — implementation: `crafting-kit`; services: recipes, inputs, outputs, crafting time.
- **Structure runtime domain** — implementation: `structure-runtime-kit`; services: placed structures, durability, operation state, repair/destruction.

## Presentation descriptor domains

- **Render descriptor domain** — implementation: `render-descriptor-kit`; services: object, layer, material, and instance descriptors.
- **Material palette domain** — implementation: `material-palette-kit`; services: material IDs, color palettes, quality variants, renderer hints.
- **Instanced render domain** — implementation: `instanced-render-kit`; services: batch descriptors for repeated props, trees, rocks, pickups.
- **Fog volume domain** — implementation: `fog-volume-kit`; services: fog density/color/volume descriptors and visibility metadata.
- **Lighting descriptor domain** — implementation: `lighting-descriptor-kit`; services: sun, fill, mood, exposure, shadow descriptor state.
- **Audio cue domain** — implementation: `audio-cue-kit`; services: renderer/host-agnostic audio event descriptors.
- **Camera cinematic domain** — implementation: `camera-cinematic-kit`; services: camera target, shake, follow, framing, cinematic intent descriptors.
- **VFX descriptor domain** — implementation: `vfx-descriptor-kit`; services: impact, scan, beacon, damage, boost, and transition visual cues.

## Harness/tooling domains

- **Scenario QA domain** — implementation: `scenario-qa-harness`; services: scenario assertions, validation descriptors, promotion evidence.
- **Replay harness domain** — implementation: `replay-harness`; services: command logs, fixed-delta replay, snapshot comparison.
- **GameHost standard domain** — implementation: `gamehost-standard-kit`; services: standard debug surface and state access.
- **Boot progress domain** — implementation: `boot-progress-kit`; services: loading stage resources, boot events, diagnostics.
- **Telemetry domain** — implementation: `telemetry-kit`; services: performance counters, event counts, gameplay metrics.

## Bridge/preset kits

Bridge/preset kits are allowed to be game-specific but must stay thin.

They should:

- compose reusable kits
- provide data presets
- translate legacy APIs
- map game-specific events to reusable services
- remain easy to delete after migration

They should not:

- hide generic domain logic
- own reusable renderer logic
- become a new game engine

## How to add to this catalog

When adding a domain/service family:

```txt
[ ] Domain name is reusable.
[ ] Implementation uses a `-kit` folder.
[ ] Factory uses `createXKit()`.
[ ] Domain meaning is clear.
[ ] Services are distinct from existing kits.
[ ] Game-specific examples are not required to understand it.
[ ] Adjacent kits and child kits are listed.
```
