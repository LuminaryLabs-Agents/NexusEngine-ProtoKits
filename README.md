# NexusRealtime ProtoKits

Prototype game kits for NexusRealtime.

These kits are intentionally separate from the core NexusRealtime package. They are used to prove game features before promoting stable surfaces into the main engine.

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

## Structure

```txt
protokits/
  ocean-boat-kit/
    index.js
    demo.html
    README.md
  render-layer-kit/
    index.js
    demo.html
    README.md
  arcade-race-core/
    index.js
  downhill-race-kit/
    index.js
  slope-traversal-kit/
    index.js
  racer-ai-kit/
    index.js
  difficulty-curve-kit/
    index.js
  race-hazard-kit/
    index.js
  boost-path-kit/
    index.js
  racer-contact-kit/
    index.js
  race-pacing-kit/
    index.js
  course-director-kit/
    index.js
  arcade-race-visual-kit/
    index.js
  protokit-core/
    index.js
  content-palette-kit/
    index.js
  layered-object-kit/
    index.js
  vertical-climb-core/
    index.js
  ledge-route-kit/
    index.js
  simple-swing-kit/
    index.js
  endless-ascent-kit/
    index.js
  cloud-zone-kit/
    index.js
  climb-input-kit/
    index.js
  climb-camera-kit/
    index.js
  diegetic-feedback-kit/
    index.js
  climb-risk-kit/
    index.js
  next-ledge-kit/
    index.js
    cloud-climb-preset.js
    README.md
```
