# Generic Aerial Flight Kits

Generic ProtoKits for airborne open-world traversal and flight-challenge games.

These kits are intentionally not branded to one game. A sunlit bird game, wingsuit game, drone game, glider race, sky-island explorer, or aerial training sim should be a preset over this stack rather than a separate engine architecture.

## Architecture audit

The stack keeps NexusRealtime responsibilities separated:

- Runtime: `createRealtimeGame`, deterministic ticks, resources, events, scheduler phases, and kit installation.
- ProtoKits: flight input, aerial body state, glide physics, boost impulse, checkpoint volumes, lift volumes, flock agents, sky, terrain sampling, world patch windows, challenge state, camera descriptors, VFX descriptors, audio descriptors, and render descriptors.
- Renderer host: Three.js or Canvas draws descriptor state only, maps browser input into `engine.genericFlightInput.setInput()`, calls `engine.tick(dt)`, and exposes `window.GameHost`.
- Sequence/design layer: challenge prompts and completion are expressed as resource state and can later be replaced or augmented by true NexusRealtime sequences.

## Kit plan

| Kit | Provides | Purpose |
|---|---|---|
| `createGenericAtmosphereSkyKit` | `environment:sky`, `environment:lighting` | Sky gradient, sun direction, haze, ambient/sun descriptor state. |
| `createGenericTerrainSamplerKit` | `terrain:height-sampler`, `terrain:biome-sampler` | Deterministic height, normal, and biome queries. |
| `createGenericWorldPatchKit` | `world:patch-window`, `world:streaming-descriptors` | Active patch window and scatter descriptors around a moving body. |
| `createGenericFlightInputKit` | `input:flight` | Renderer-agnostic pitch/bank/yaw/brake/boost intent. |
| `createGenericAerialBodyKit` | `aerial:body` | Durable 3D body pose and velocity state. |
| `createGenericGlidePhysicsKit` | `aerial:glide-physics` | Gravity, lift, drag, pitch/bank steering, stall-safe glide, and terrain collision. |
| `createGenericBoostImpulseKit` | `aerial:boost-impulse` | Cooldown-gated forward impulse for fireworks, dashes, gates, or wind bursts. |
| `createGenericCheckpointVolumeKit` | `aerial:checkpoint-volume` | Deterministic ring/gate/beacon placement and collection. |
| `createGenericLiftVolumeKit` | `aerial:lift-volume` | Thermals, vents, fans, and vertical force columns. |
| `createGenericFlockAgentKit` | `ai:flock-agent` | Companion/ambient flock followers with terrain avoidance. |
| `createGenericFlightChallengeKit` | `challenge:flight` | Generic score, checkpoint count, prompts, completion, and altitude readout. |
| `createGenericFlightCameraKit` | `camera:flight-follow` | Chase camera descriptor with speed FOV. |
| `createGenericFlightVfxKit` | `vfx:flight` | Speed trail, airflow, and boost flash descriptors. |
| `createGenericFlightAudioKit` | `audio:flight-descriptor` | Wind gain/filter frequency descriptors. |
| `createGenericAerialRenderDescriptorKit` | `render:aerial-descriptors` | Aggregates all state for a host renderer. |

## Import

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@0.0.1/src/index.js";
import {
  createGenericAerialAdventureKits
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/aerial-flight-kits/index.js";

const engine = NexusRealtime.createRealtimeGame({
  kits: createGenericAerialAdventureKits(NexusRealtime, {
    seed: "sky-demo",
    terrain: { heightScale: 180 },
    challenge: { targetCheckpoints: 12 }
  })
});
```

## Host contract

The host should:

```js
engine.genericFlightInput.setInput({ pitch, bank, boost });
engine.tick(dt);
renderer.draw(engine.genericAerialRenderDescriptor.getState());
```

The host should not decide boost cooldowns, ring completion, thermal lift, objective completion, or body collision.
