# DSM Catalog

This catalog is a reusable domain/service map. It is not a list of games.

Games and experiments compose DSMs through data. A DSM should be named after reusable domain/service meaning, not the first game that needs it.

## Foundation DSMs

- **SeededRandomDSM** — deterministic random streams, scoped seeds, repeatable sample APIs.
- **ProgressTimerDSM** — hold timers, countdowns, phase timers, cooldowns, progress windows.
- **LedgerDSM** — completion ledgers, one-shot command tracking, idempotency records.
- **SnapshotDSM** — snapshot, reset, and loadSnapshot utilities for stateful DSMs.
- **TokenRegistryDSM** — requires/provides token registry and validation.

## Spatial DSMs

- **RouteDSM** — ordered route points, curves, progress, corridor width, route-local metadata.
- **BezierRouteDSM** — Bezier/Catmull sampling, nearest point, curve tangents, route interpolation.
- **TerrainDSM** — terrain bounds, height, surface type, walkability, slope, normals.
- **TerrainSamplerDSM** — heightAt, normalAt, biomeAt, patch sampling query surface.
- **WorldPatchDSM** — chunk/patch lifecycle, nearby loading, distant pruning, patch descriptors.
- **ScatterPlacementDSM** — seeded object placement with spacing, slope, route, and biome constraints.
- **RaycastHitDSM** — ray hit tests for aim, scan, placement, and line-of-sight.
- **VisibilityDSM** — visibility ranges, occlusion hints, fog visibility, reveal rules.
- **VolumeDSM** — trigger, force, fog, danger, safe, healing, and objective volumes.

## Natural-world DSMs

- **ForestDSM** — forest density, bands, tree distribution, visibility/corridor framing.
- **TreeDSM** — trunk/canopy/leaf domain, variants, collider hints, render descriptors.
- **LeafDSM** — leaf density, color variation, spawn distribution, wind response, foliage descriptors.
- **BranchDSM** — branch sockets, spread, bend, canopy support.
- **CanopyDSM** — canopy layers, silhouette, density, visibility impact.
- **RockDSM** — rocks/boulders, obstacle hints, placement rules, render descriptors.
- **GroundCoverDSM** — grass, ferns, small props, density, seasonal variants.
- **WeatherAtmosphereDSM** — sky, wind, haze, precipitation, time-of-day descriptors.

## Interaction DSMs

- **ActionInputDSM** — semantic input actions, axes, buttons, aim, held/pressed/released state.
- **ScanTargetDSM** — target registration, range/facing/raycast validation, scan progress, completion.
- **FacingConeDSM** — forward cone checks, dot thresholds, target prioritization.
- **DistanceCheckDSM** — reusable distance/radius checks with stable units.
- **InteractionTargetDSM** — interactable targets, prompts, activation facts.
- **PlacementDSM** — validate/commit placement requests on terrain, grid, or route surfaces.
- **BuildPlacementDSM** — buildable objects, placement constraints, cost validation, preview descriptors.

## Objective/progression DSMs

- **ObjectiveFlowDSM** — ordered steps, completion, failure, status prompts.
- **CheckpointDSM** — checkpoint volumes, gates, rings, route progress, completion events.
- **BeaconDSM** — objective direction, beams, range indicators, active target descriptors.
- **GateDSM** — locked/open/entered states, requirements, transition descriptors.
- **CompletionLedgerDSM** — completed IDs, one-shot events, replay-safe completion state.
- **RouteCheckpointDSM** — route-driven objective checkpoints and route milestone events.

## Actor/threat DSMs

- **AgentGroupDSM** — groups, agents, goals, basic movement, formation state.
- **PatrolDSM** — patrol curves, loops, wait points, seeded variation.
- **ChaseDSM** — pursuit rules, target acquisition, break-off rules.
- **ThreatPressureDSM** — danger intensity, escalation, pressure windows, fail pressure.
- **HazardDirectorDSM** — hazard spawn/activation scheduling and descriptors.
- **DamageHealthDSM** — health, damage, healing, defeat, invulnerability windows.
- **EncounterDirectorDSM** — encounter pacing, spawn budgets, waves, escalation.

## Resource/economy/build DSMs

- **ResourcePressureDSM** — meters like health, oxygen, signal, corruption, stamina, fuel.
- **ResourceNodeDSM** — harvestable/pickup nodes, yields, depletion, respawn.
- **CargoDeliveryDSM** — pickup/carry/deliver loops, payload state, delivery targets.
- **InventoryDSM** — slots/stacks/equipment state.
- **CraftingDSM** — recipes, inputs, outputs, crafting time.
- **StructureRuntimeDSM** — placed structures, durability, operation state, repair/destruction.

## Presentation descriptor DSMs

- **RenderDescriptorDSM** — renderer-agnostic object, layer, material, and instance descriptors.
- **MaterialPaletteDSM** — material IDs, color palettes, quality variants, renderer hints.
- **InstancedRenderDSM** — batch descriptors for repeated props, trees, rocks, pickups.
- **FogVolumeDSM** — fog density/color/volume descriptors and visibility metadata.
- **LightingDescriptorDSM** — sun, fill, mood, exposure, shadow descriptor state.
- **AudioCueDSM** — renderer/host-agnostic audio event descriptors.
- **CameraCinematicDSM** — camera target, shake, follow, framing, cinematic intent descriptors.
- **VFXDescriptorDSM** — impact, scan, beacon, damage, boost, and transition visual cues.

## Harness/tooling DSMs

- **ScenarioQADSM** — scenario assertions, validation descriptors, promotion evidence.
- **ReplayHarnessDSM** — command logs, fixed-delta replay, snapshot comparison.
- **GameHostStandardDSM** — standard debug surface and state access.
- **BootProgressDSM** — loading stage resources, boot events, diagnostics.
- **TelemetryDSM** — performance counters, event counts, gameplay metrics.

## Bridge/preset DSMs

Bridge/preset DSMs are allowed to be game-specific but must stay thin.

They should:

- compose reusable DSMs
- provide data presets
- translate legacy APIs
- map game-specific events to reusable services
- remain easy to delete after migration

They should not:

- hide generic domain logic
- own reusable renderer logic
- become a new game engine

## How to add to this catalog

When adding a DSM family:

```txt
[ ] Name is reusable.
[ ] Domain meaning is clear.
[ ] Services are distinct from existing DSMs.
[ ] Game-specific examples are not required to understand it.
[ ] Adjacent DSMs and child DSMs are listed.
```
