# Ocean Boat Kit

High fidelity ocean and boating prototype kit for NexusEngine games.

The kit is designed to be loaded beside the core NexusEngine package:

```js
import * as NexusEngine from "https://cdn.jsdelivr.net/npm/nexusengine/dist/index.js";
import { createOceanBoatKit } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/ocean-boat-kit/index.js";

const oceanBoatKit = createOceanBoatKit(NexusEngine);
```

## Exports

- `createOceanBoatKit(nexusEngine, options)`
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

## NexusEngine Integration

The kit accepts NexusEngine as an injected dependency.

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
