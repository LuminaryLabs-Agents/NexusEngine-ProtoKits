# NexusRealtime ProtoKits

Prototype game kits for NexusRealtime.

These kits are intentionally separate from the core NexusRealtime package. They are used to prove game features before promoting stable surfaces into the main engine.

## Action Input Kit

Contextual action routing for browser hosts and subscribed gameplay kits. The host captures platform input, calls the `engine.actionInput` API, and this ProtoKit emits semantic action events only when held state, axis, aim, or button edges change.

```js
import { createActionInputKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/action-input-kit/index.js";

const engine = NexusRealtime.createRealtimeGame({
  kits: [
    createActionInputKit(NexusRealtime, {
      context: "next-ledge-grapple",
      bindings: {
        left: ["a", "arrowleft"],
        right: ["d", "arrowright"],
        primary: [" ", "space", "pointer0"],
        restart: ["r"]
      }
    })
  ]
});
```

Events include `actionInput.pressed`, `actionInput.released`, `actionInput.axisChanged`, `actionInput.aimChanged`, and `actionInput.cleared`. Hosts can subscribe those actions together and route them into game-specific kit APIs without putting gameplay rules in the HTML.

Demo:

```txt
protokits/action-input-kit/demo.html
```

## Ocean Boat Kit

```js
import { createOceanBoatKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/ocean-boat-kit/index.js";

const oceanBoatKit = createOceanBoatKit(NexusRealtime);
```

Demo:

```txt
protokits/ocean-boat-kit/demo.html
```

## Render Layer / Visual Pipeline Kit

Renderer-agnostic visual composition kits for mesh layering, material-library state, fog volumes, and cheap volumetric-light descriptors.

These kits do not draw to Canvas, WebGL, or Three.js. They output stable resources that a host renderer can consume.

```js
import {
  createRenderLayerKit,
  createVisualPipelineKit,
  createFoglineVisualPreset
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/render-layer-kit/index.js";

const realismKit = NexusRealtime.createRealismKit({
  preset: createFoglineVisualPreset(),
  quality: "adaptive"
});

const renderLayerKit = createRenderLayerKit(NexusRealtime, {
  renderDescriptorResource: NexusRealtime.RenderDescriptorState,
  realismSnapshotResource: realismKit.definitions.resources.RealismSnapshot,
  preset: createFoglineVisualPreset()
});
```

### Visual Pipeline Kit List

- `createRenderLayerKit` / `createVisualPipelineKit` — stable render buckets, material library, fog-volume state, volumetric-light descriptors, and visual validation.
- `createFoglineVisualPreset` — a dark forest visual preset for high-fidelity Fogline-style Canvas/WebGL/Three hosts.
- `createRenderLayerSnapshot` — headless helper for descriptor sorting and bucket inspection.
- `createMaterialLibrarySnapshot` — headless helper for material-library inspection.

## Arcade Race Kits

Generic ECS racing kits for downhill arcade racing, kart-like pack pacing, sliding traversal, AI driving, hazards, boosts, contact, procedural course pacing, and renderer-agnostic low-poly descriptors.

These kits are generic by design. A game such as `Penguin Prix` should be a preset/theme/configuration over these kits, not a set of penguin-specific engine modules.

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import { createRealtimeGame } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";

import { createCourseDirectorKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/course-director-kit/index.js";
import { createDownhillRaceKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/downhill-race-kit/index.js";
import { createSlopeTraversalKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/slope-traversal-kit/index.js";
import { createDifficultyCurveKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/difficulty-curve-kit/index.js";
import { createRacerAIKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/racer-ai-kit/index.js";
import { createRaceHazardKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/race-hazard-kit/index.js";
import { createBoostPathKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/boost-path-kit/index.js";
import { createRacerContactKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/racer-contact-kit/index.js";
import { createRacePacingKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/race-pacing-kit/index.js";
import { createArcadeRaceVisualKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/arcade-race-visual-kit/index.js";

const game = createRealtimeGame({
  kits: [
    createCourseDirectorKit(NexusRealtime, { seed: "penguin-prix", materializeHazards: true, materializeBoosts: true }),
    createDownhillRaceKit(NexusRealtime, { countdownSeconds: 3, finish: 1200 }),
    createSlopeTraversalKit(NexusRealtime, { maxSpeed: 46, slopeAcceleration: 18 }),
    createDifficultyCurveKit(NexusRealtime, { softCapRound: 24 }),
    createRacerAIKit(NexusRealtime),
    createRaceHazardKit(NexusRealtime),
    createBoostPathKit(NexusRealtime),
    createRacerContactKit(NexusRealtime),
    createRacePacingKit(NexusRealtime),
    createArcadeRaceVisualKit(NexusRealtime)
  ]
});
```

### Kit List

- `createDownhillRaceKit` — countdown, racer registration, finish detection, placements, rounds, win/loss events.
- `createSlopeTraversalKit` — slope acceleration, sliding friction, surface grip, snow/ice drag, drift, high-speed crash state.
- `createRacerAIKit` — route choice, obstacle avoidance, boost targeting, mistake injection, aggression, scalable driving skill.
- `createDifficultyCurveKit` — logarithmic round scaling, skill modifiers, mistake-rate modifiers, aggression modifiers, pacing modifiers.
- `createRaceHazardKit` — obstacle descriptors, crash zones, slowdown zones, hazard density, readable danger placement, collision events.
- `createBoostPathKit` — boost pads, boost lanes, risky shortcuts, duration, cooldowns, stacking rules.
- `createRacerContactKit` — bumping, blocking, shoving, spinout thresholds, recovery windows, fairness limits.
- `createRacePacingKit` — pack pressure, near-misses, comeback pressure, AI backing off, late-round intensity, close-finish tuning.
- `createCourseDirectorKit` — calm sections, hazard clusters, shortcut branches, boost sections, final sprint sections, procedural pacing.
- `createArcadeRaceVisualKit` — low-poly render descriptors, trail effects, crash effects, boost effects, gates, signs, finish arch.
- `arcade-race-core` — shared definitions and helpers for the race kits.

## Vertical Climb / Next Ledge Kits

Composable ECS kits for endless 2.5D climb games with static, seeded, or hybrid content. These are designed so a game can stay close to `import + configure + run` while complexity is added by installing another kit instead of writing more app code.

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createNextLedgeCloudClimb
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/next-ledge-kit/cloud-climb-preset.js";

const game = createNextLedgeCloudClimb(NexusRealtime, {
  seed: "clouds-forever-001",
  overlayUi: false,
  mode: "hybrid"
});
```

Advanced hosts can import `createNextLedgeCloudClimbKits()` from the same preset file and pass the returned kit list into `NexusRealtime.createRealtimeGame()`.

### Vertical Climb Kit List

- `protokit-core` — shared deterministic helpers, seeded random, runtime-kit injection fallback, resource helpers.
- `content-palette-kit` — static/seeded/hybrid content palette picking for rocks, ledges, clouds, and attachments.
- `layered-object-kit` — generic layered objects, sockets, attachments, interactive objects, pruning, and batching descriptors.
- `vertical-climb-core` — shared climb components, resources, events, base state, and `engine.verticalClimb` surface.
- `ledge-route-kit` — route graph, reachability, target windows, chunk registration, and pruning.
- `simple-swing-kit` — simple A/D rope swing momentum that only affects state while attached.
- `endless-ascent-kit` — seeded vertical chunk generation, ahead/behind chunk windows, and materialization hooks.
- `cloud-zone-kit` — height-based fog, wind, theme, and cloud-band state.
- `climb-input-kit` — renderer-agnostic click, hover, restart, and swing intent routing.
- `climb-camera-kit` — side-on vertical camera descriptor state for follow, swing, fall, and cloud reveal modes.
- `diegetic-feedback-kit` — no-overlay world feedback signals for target glow, rope tension, cloud cues, and stamina pressure.
- `climb-risk-kit` — reach, stamina cost, momentum, and risk evaluation without forcing a HUD.
- `next-ledge-kit` — high-level click-to-climb and rope-swing game coordinator.

## Generic Open-World / Flight Kits

Composable renderer-agnostic kits for open-world games, flight games, traversal games, and seeded procedural worlds.

These kits are generic by design. A game should keep its own preset/data in the app or experiment that consumes the kits.

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createFlightMotionKit
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/flight-motion-kit/index.js";
import {
  createTerrainSamplerKit
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/terrain-sampler-kit/index.js";
import {
  createWorldPatchKit
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/world-patch-kit/index.js";

const game = NexusRealtime.createRealtimeGame({
  kits: [
    createTerrainSamplerKit(NexusRealtime, { seed: "terrain-seed" }),
    createWorldPatchKit(NexusRealtime, { patchSize: 500, radius: 2 }),
    createFlightMotionKit(NexusRealtime, { actorId: "player" })
  ]
});
```

Hosts compose the generic kits manually and keep game-specific data outside ProtoKits.

### Generic World / Flight Kit List

- `data-registry-kit` — one root static/seeded/hybrid `GameData` registry with scoped seeds, namespaces, overrides, and snapshots.
- `performance-budget-kit` — adaptive quality tiers, patch radius, instance budgets, shadow budgets, LOD flags, and debug metrics.
- `sky-atmosphere-kit` — sky dome, sun, fog, haze, and cloud layer descriptors.
- `lighting-descriptor-kit` — warm sun, hemisphere fill, shadows, fog, tone mapping, and renderer quality descriptors.
- `material-palette-kit` — reusable material descriptors for terrain, trees, rocks, actors, clouds, rings, and effects.
- `terrain-sampler-kit` — one canonical terrain height, normal, biome, and patch descriptor query surface.
- `world-patch-kit` — patch/chunk lifecycle, nearby patch loading, distant patch pruning, and seeded patch descriptors.
- `scatter-placement-kit` — seeded patch-aware object placement for trees, rocks, clouds, pickups, hazards, and props.
- `instanced-render-kit` — renderer-facing instanced batch descriptors grouped by layer, kind, archetype, and material.
- `flight-motion-kit` — generic glider-style pitch, roll, yaw, lift, drag, boost, stall, and terrain collision state.
- `actor-render-kit` — actor part, socket, pose, bank, speed, wing, and trail descriptors.
- `flock-agent-kit` — generic companion swarm/follow agents for birds, drones, fish, boats, or cars.
- `updraft-volume-kit` — generic wind/current/lift force volumes and visual descriptors.
- `checkpoint-volume-kit` — generic ring, gate, pickup, checkpoint, and boost-trigger volumes.

## Structure
