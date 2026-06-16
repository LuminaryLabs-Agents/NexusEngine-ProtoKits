# Super Fly Performance Implementation Plan

## Goal

Make the aerial/open-world stack domain-service oriented and performant enough for browser experiments.

The key change is to stop treating world streaming as a full-window rebuild. The aerial world stack now treats terrain patches as a data registry with a build queue and a per-tick budget.

## Problem

The old Sora configuration could produce lag spikes because the active patch window was rebuilt synchronously when the player crossed a patch boundary. Each patch contained terrain samples that then caused the renderer to allocate new geometry.

## Implemented Phase 1

- Renamed the public experiment presentation to **Super Fly**.
- Pinned the experiment to a ProtoKits commit containing the budgeted patch registry.
- Added `world:patch-registry` and `world:patch-build-queue` capability tokens to the aerial world patch kit.
- Added `state.world.patchRegistry` for cached patch descriptors.
- Added `state.world.buildQueue` for missing/stale patches.
- Added `state.world.streamingStats` for debug/performance inspection.
- Added `engine.genericWorldPatch.getStreamingState()`.
- Changed the Super Fly experiment config to lower terrain segment cost and use a per-tick patch build budget.
- Reduced renderer cost by disabling antialiasing and shadow maps, capping pixel ratio at 1, reusing one camera vector, throttling HUD writes, and fixing resize camera aspect updates.

## Target Domain-Service Split

```txt
TerrainSamplerKit
  height / normal / biome query service

WorldPatchRegistryKit
  active window, cached patch descriptors, dirty state

PatchBuildBudgetKit
  max builds per tick, adaptive quality, performance response

PatchDescriptorKit
  renderer-facing patch descriptors

ScatterPlacementKit
  patch-scoped deterministic prop placement

RenderUploadQueueKit
  optional renderer-facing upload staging
```

## Next Phase

1. Split the current aerial world patch kit into the services above.
2. Move terrain query support back into the registry implementation.
3. Add headless tests for stable patch ids, queue draining, cache eviction, and deterministic rebuilds.
4. Add adaptive quality: reduce segment count or patch radius after repeated frame spikes.
5. Move Super Fly from the legacy `sora-the-infinite` path to a new route only after adding a redirect.

## Acceptance Criteria

- No full active-window patch rebuild in one tick.
- New terrain patches are generated over a bounded number of ticks.
- Renderer receives stable descriptors and does not own world-generation rules.
- Experiment remains inspectable through `window.GameHost.getStreamingState()`.
- Super Fly remains playable from GitHub Pages on mid-range laptops.
