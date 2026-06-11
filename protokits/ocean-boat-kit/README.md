# Ocean Boat Kit

High fidelity ocean and boating prototype kit for NexusRealtime games.

The kit is designed to be loaded beside the core NexusRealtime package:

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/npm/nexusrealtime/dist/index.js";
import { createOceanBoatKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/ocean-boat-kit/index.js";

const oceanBoatKit = createOceanBoatKit(NexusRealtime);
```

## Exports

- `createOceanBoatKit(nexusRealtime, options)`
- `OCEAN_BOAT_KIT_VERSION`

## Kit Surface

`createOceanBoatKit()` returns:

- `id`
- `version`
- `kitsUsed`
- `createOceanField(options)`
- `createBoatSimulation(options)`
- `createWakeSystem(options)`
- `createInputController(target)`
- `createWebGLRenderer(canvas, options)`
- `createOceanBoatGame(options)`

## NexusRealtime Integration

The kit accepts NexusRealtime as an injected dependency.

It uses core surfaces when present:

- `createRealtimeGame` for the main loop
- `createTerrainKit` for ocean field metadata
- `createRenderDescriptorKit` for render descriptors
- `createRealismKit` for realism tuning metadata

If a core surface is missing, the kit uses a local fallback so the prototype can still run as a standalone browser demo.

## Demo Controls

- `W` / arrow up: throttle forward
- `S` / arrow down: reverse/brake
- `A` / arrow left: steer left
- `D` / arrow right: steer right
