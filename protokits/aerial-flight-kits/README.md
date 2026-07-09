# Generic Aerial Flight Kits

Generic ProtoKits for airborne open-world traversal and flight-challenge games.

These kits are intentionally **not** branded to one game. A bird game, wingsuit game, drone game, glider race, sky-island explorer, or aerial training sim should be a preset over this stack rather than a separate engine architecture.

## Architecture audit

The stack keeps NexusEngine responsibilities separated:

- Runtime: `createRealtimeGame`, deterministic ticks, resources, events, scheduler phases, and kit installation.
- ProtoKits: flight input, aerial body state, glide physics, boost impulse, checkpoint volumes, lift volumes, flock agents, sky descriptors, terrain sampling, patch windows, challenge state, camera descriptors, VFX descriptors, audio descriptors, and render descriptors.
- Renderer host: Three.js or Canvas draws descriptor state only, maps browser input into `engine.genericFlightInput.setInput()`, calls `engine.tick(dt)`, and exposes `window.GameHost`.
- Sequence/design layer: prompts, gates, score, and completion can be layered as sequence kits or mission kits without coupling to rendering.

## Why this stack exists

The original aerial prototype mixed renderer, terrain generation, flight physics, rings, thermals, flock agents, camera, VFX, audio, and objective flow inside one browser file. This stack moves the reusable behavior into runtime-shaped ProtoKits so a branded aerial game can stay a preset plus a renderer host.

## Implemented kit plan

| Kit | Provides | Purpose |
|---|---|---|
| `createGenericAtmosphereSkyKit` | `environment:sky`, `environment:lighting` | Sky gradient, sun direction, haze, ambient/sun descriptor state. |
| `createGenericTerrainSamplerKit` | `terrain:height-sampler`, `terrain:biome-sampler` | Deterministic terrain height, normal, and biome queries. |
| `createGenericWorldPatchKit` | `world:patch-window`, `world:streaming-descriptors` | Active patch window and scatter descriptors around a moving body. |
| `createGenericFlightInputKit` | `input:flight` | Renderer-agnostic pitch/bank/yaw/brake/boost intent. |
| `createGenericAerialBodyKit` | `aerial:body` | Durable 3D body pose and velocity state. |
| `createGenericGlidePhysicsKit` | `aerial:glide-physics` | Gravity, lift, drag, pitch/bank steering, stall-safe glide, and terrain collision. |
| `createGenericBoostImpulseKit` | `aerial:boost-impulse` | Cooldown-gated forward impulse for fireworks, dashes, gates, or wind bursts. |
| `createGenericCheckpointVolumeKit` | `aerial:checkpoint-volume` | Deterministic ring/gate/beacon placement and collection. |
| `createGenericLiftVolumeKit` | `aerial:lift-volume` | Thermals, vents, fans, and vertical force columns. |
| `createGenericFlockAgentKit` | `ai:flock-agent` | Companion/ambient flock followers. |
| `createGenericFlightChallengeKit` | `challenge:flight` | Score, checkpoint count, prompt, completion, and altitude readout. |
| `createGenericFlightCameraKit` | `camera:flight-follow` | Chase camera descriptor with speed-sensitive FOV. |
| `createGenericFlightVfxKit` | `vfx:flight` | Speed trails, airflow, and boost flash descriptors. |
| `createGenericFlightAudioKit` | `audio:flight-descriptor` | Wind gain/filter frequency descriptors. |
| `createGenericAerialRenderDescriptorKit` | `render:aerial-descriptors` | Final renderer-facing snapshot. |

## Smoother default tuning

`createDefaultGenericAerialAdventureConfig()` now centralizes the stack defaults so all kits receive the same seed, terrain, body, and flight tuning. This reduces accidental resets from partial kit config and gives browser hosts better defaults:

- lower terrain scale for broader, less noisy patches;
- denser terrain sampling via `sampleSegments`;
- softer gravity and lower roll/pitch response for bird-like gliding;
- bounded boost impulse and cooldown;
- camera/VFX/audio defaults suitable for a small Three.js host.

## Import

```js
import * as NexusEngine from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusEngine@main/src/index.js";
import { createGenericAerialAdventureKits } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/aerial-flight-kits/index.js";

const engine = NexusEngine.createRealtimeGame({
  kits: createGenericAerialAdventureKits(NexusEngine, {
    seed: "aerial-example",
    terrain: {
      heightScale: 170,
      sampleSegments: 32,
      patchSize: 450
    },
    challenge: {
      targetCheckpoints: 12
    }
  })
});
```

## Host contract

The host should:

```js
engine.genericFlightInput.setInput({ pitch, bank, yaw, brake, boost });
engine.tick(dt);
renderer.draw(engine.genericAerialRenderDescriptor.getState());
```

The host should not decide boost cooldowns, ring completion, thermal lift, camera state, audio intensity, terrain collision, terrain mesh samples, score, or body physics.

## Renderer notes

A Three.js renderer should:

- build one `BufferGeometry` per patch descriptor;
- use `flatShading: false` and recompute normals after height updates;
- cache meshes by patch key instead of recreating all geometry every frame;
- read rings, thermals, flock agents, body state, camera, VFX, and audio from the render descriptor;
- expose `window.GameHost` for state-first debugging.

## Validation experiment

Branded validation apps should live in NexusEngine-Experiments, not inside ProtoKits.

The game name belongs in Experiments and presets. The ProtoKits remain generic so the same stack can power other aerial games.
