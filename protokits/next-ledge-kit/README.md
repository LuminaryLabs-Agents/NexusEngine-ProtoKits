# Next Ledge Kit

Composable click-to-climb and rope-swing rules for NexusRealtime games.

This kit is a prototype gameplay kit for a 2.5D climbing game where the player clicks the next reachable ledge, catches ropes, builds horizontal momentum with A/D, manages stamina, and climbs toward a summit.

## Import

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createNextLedgeKit,
  createDefaultNextLedgeLevel
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/next-ledge-kit/index.js";

const level = createDefaultNextLedgeLevel();
const nextLedgeKit = createNextLedgeKit(NexusRealtime, { level });
```

## Surface

`createNextLedgeKit(NexusRealtime, options)` installs `engine.nextLedge`:

```js
engine.nextLedge.choose(targetId);
engine.nextLedge.swingAxis(-1); // A / left
engine.nextLedge.swingAxis(1);  // D / right
engine.nextLedge.swingAxis(0);  // released
engine.nextLedge.hover(targetId);
engine.nextLedge.restart();
engine.nextLedge.getState();
engine.nextLedge.getEnabledTargets();
```

## State Modes

```txt
ready     waiting for a ledge click
moving    committed jump/climb arc
swinging  hanging from a rope; A/D adds horizontal momentum
falling   stamina failed or grip lost
complete  summit reached
```

## Intended Composition

Use this kit with the smallest NexusRealtime stack:

```js
const engine = NexusRealtime.createRealtimeGame({
  kits: [
    NexusRealtime.createRenderDescriptorKit(level),
    NexusRealtime.createInteractionTargetKit({ sceneRecipe: level.sceneRecipe }),
    NexusRealtime.createObjectiveFlowKit({ id: "next-ledge", steps: level.steps }),
    NexusRealtime.createMicroPlatformerKit({ avatar: { id: "climber", lane: 0 } }),
    createNextLedgeKit(NexusRealtime, { level })
  ]
});
```

## Design Notes

- The kit owns game rules only: reach, stamina, rope swing, fall, restart, and completion.
- The renderer should only draw `engine.nextLedge.getState()`.
- A/D input is ignored unless the state mode is exactly `swinging`.
- Click handling should pick a target id and call `engine.nextLedge.choose(targetId)`.

## Version

Current prototype version: `0.1.0`.
