# Domain Service Kits

Renderer-independent, atomic domain-purpose ProtoKits for NexusRealtime games.

These kits are meant to sit between stable NexusRealtime engine kits and game-specific presets/deploy packages. They own reusable state transitions and events, not Canvas, DOM, Three.js, asset loading, or authored tutorial flow.

## Included kits

- `createViewRigKit` — yaw/pitch, view ray, focus target, camera shake descriptor state.
- `createSpatialInteractionKit` — distance, facing, line-of-sight, cooldown, and hold-to-complete interaction validation.
- `createCompletionLedgerKit` — unique completion tracking, group ledgers, first-completion events, and repeated-completion suppression.
- `createObjectiveBridgeKit` — maps domain facts into objective action events.
- `createLockGroupKit` — gates, doors, portals, sockets, and lock groups.
- `createDamageHealthKit` — health pools, damage, healing, invulnerability, and death events.
- `createEncounterDirectorKit` — encounter phases, spawn budgets, wave-style pressure, and spawn requests.
- `createResourceNodeKit` — harvestable resource nodes, depletion, collected totals, and regeneration.
- `createBuildPlacementKit` — selected build type, preview validation, placement acceptance, and rejection reasons.
- `createStructureRuntimeKit` — placed structure health, activation, cooldowns, action requests, repair, and destruction.
- `createDiegeticFeedbackSignalKit` — renderer-agnostic world-space prompt, glow, marker, danger, and objective signals.
- `createAssetDescriptorKit` — asset, material, effect, and atlas descriptor registry.

`createHazardDirectorKit` remains available from `domain-foundation` and is re-exported through this bundle for convenience.

## Import

```js
import {
  createDomainServiceKits,
  createSpatialInteractionKit,
  createCompletionLedgerKit,
  createLockGroupKit
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/domain-service-kits/index.js";
```

Each service also has an individual import wrapper, for example:

```js
import { createSpatialInteractionKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/spatial-interaction-kit/index.js";
```

## Install

```js
const engine = NexusRealtime.createRealtimeGame({
  kits: [
    createSpatialInteractionKit(NexusRealtime),
    createCompletionLedgerKit(NexusRealtime),
    createObjectiveBridgeKit(NexusRealtime),
    createLockGroupKit(NexusRealtime)
  ]
});
```

Or install the default bundle:

```js
const engine = NexusRealtime.createRealtimeGame({
  kits: createDomainServiceKits(NexusRealtime)
});
```

## Boundary

These kits do not draw, load files, listen to browser input, own `requestAnimationFrame`, or mutate renderer objects. Hosts request actions through public engine APIs. Systems validate and update resources. Renderers read snapshots.

## Promotion notes

These are experimental ProtoKits. Promote individual services into NexusRealtime core only after stable API naming, headless tests, multi-configuration validation, docs, and at least one successful Experiment.
