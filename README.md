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

## Structure

```txt
protokits/
  ocean-boat-kit/
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
```
