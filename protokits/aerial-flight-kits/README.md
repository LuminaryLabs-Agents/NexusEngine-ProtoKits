# Generic Aerial Flight Kits

Generic ProtoKits for airborne open-world traversal and flight-challenge games.

These kits are intentionally not branded to one game. A sunlit bird game, wingsuit game, drone game, glider race, sky-island explorer, or aerial training sim should be a preset over this stack rather than a separate engine architecture.

## Architecture audit

The stack keeps NexusRealtime responsibilities separated:

- Runtime: `createRealtimeGame`, deterministic ticks, resources, events, scheduler phases, and kit installation.
- Stable NexusRealtime terrain: optional `createTerrainKit()` integration supplies patch-based chunks, LOD, smoothing, erosion layers, material assignment, and `TerrainQuery` sampling.
- ProtoKits: flight input, aerial body state, bird/glider physics, boost impulse, checkpoint volumes, lift volumes, flock agents, sky, terrain sampler bridge, world patch descriptors, challenge state, camera descriptors, VFX descriptors, audio descriptors, and final render descriptors.
- Renderer host: Three.js or Canvas draws descriptor state only, maps browser input into `engine.genericFlightInput.setInput()`, calls `engine.tick(dt)`, and exposes `window.GameHost`.
- Sequence/design layer: challenge prompts and completion are expressed as resource state and can later be replaced or augmented by true NexusRealtime sequences.

## Implemented kit plan

| Kit | Provides | Purpose |
|---|---|---|
| `createGenericAtmosphereSkyKit` | `environment:sky`, `environment:lighting` | Sky gradient, sun direction, haze, ambient/sun descriptor state. |
| `createGenericTerrainSamplerKit` | `terrain:height-sampler`, `terrain:biome-sampler`, `terrain:normal-sampler` | Bridge to NexusRealtime `TerrainQuery` when present; coherent fallback terrain otherwise. |
| `createGenericWorldPatchKit` | `world:patch-window`, `world:streaming-descriptors` | Active patch window with baked samples, normals, materials, biomes, and scatter descriptors. |
| `createGenericFlightInputKit` | `input:flight` | Renderer-agnostic pitch/bank/yaw/brake/boost intent. |
| `createGenericAerialBodyKit` | `aerial:body` | Durable 3D body pose, velocity, reset, and impulse API. |
| `createGenericGlidePhysicsKit` | `aerial:glide-physics` | Bird/glider steering, lift, drag, stall, speed limits, and terrain collision. |
| `createGenericBoostImpulseKit` | `aerial:boost-impulse` | Cooldown-gated forward impulse for fireworks, dashes, gates, or wind bursts. |
| `createGenericCheckpointVolumeKit` | `aerial:checkpoint-volume` | Patch-stable rings, gates, beacons, collection events, and reward impulse. |
| `createGenericLiftVolumeKit` | `aerial:lift-volume` | Patch-stable thermals, vents, fans, and vertical force columns. |
| `createGenericFlockAgentKit` | `ai:flock-agent` | Companion/ambient flock followers with terrain avoidance. |
| `createGenericFlightChallengeKit` | `challenge:flight` | Score, checkpoint target, prompt, completion, and altitude readout. |
| `createGenericFlightCameraKit` | `camera:flight-follow` | Chase camera descriptor with speed FOV. |
| `createGenericFlightVfxKit` | `vfx:flight` | Speed trail, airflow, and boost flash descriptors. |
| `createGenericFlightAudioKit` | `audio:flight-descriptor` | Wind gain/filter frequency descriptors. |
| `createGenericAerialRenderDescriptorKit` | `render:aerial-descriptors` | Aggregates all state into a renderer-facing snapshot. |

## Why this fixes the earlier prototype problems

- The terrain no longer has to be reinterpreted inside the host. The stack can install NexusRealtime `createTerrainKit()` and then bridge the terrain query into aerial systems.
- Patch contents are deterministic and patch-stable. Checkpoints and thermals are generated from patch IDs, while collected checkpoint IDs are durable state, so rings do not visually reset when chunks stream out and back in.
- The renderer no longer has to synthesize normals, samples, scatter, camera, VFX, audio, and challenge state. Those are now descriptor resources.
- The terrain fallback uses coherent value noise, fBm, ridged fBm, domain warping, valley carving, and smoother normals rather than sine-hash terrain.
- The flight model now includes lift, drag, velocity alignment, banking/yaw coupling, stall state, brake drag, speed limits, and softer ground recovery.

## Import

```js
import * as NexusRealtime from 'https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@0.0.1/src/index.js';
import { createGenericAerialAdventureKits } from 'https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/aerial-flight-kits/index.js';

const engine = NexusRealtime.createRealtimeGame({
  kits: createGenericAerialAdventureKits(NexusRealtime, {
    seed: 'sky-demo',
    terrain: {
      patchSize: 420,
      renderRadius: 2,
      nearResolution: 42,
      erosionIterations: 7,
      erosionStrength: 0.16
    },
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

The host should not decide boost cooldowns, terrain collision, ring completion, thermal lift, camera FOV, score, challenge completion, or flock behavior.
