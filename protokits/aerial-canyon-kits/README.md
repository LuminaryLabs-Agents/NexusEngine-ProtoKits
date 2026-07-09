# Aerial Canyon Kits

Composable NexusEngine ProtoKits for powered aerial canyon games.

This package is intentionally domain-first. It does not define one giant Sky Rogue game kit. Instead, it provides small domain kits that can be layered by a browser host, mode composition, or future sequence authoring.

## Kits

- `canyon-terrain-domain-kit` — deterministic canyon height, normals, materials, patch classes, and corridor weights.
- `flight-corridor-domain-kit` — readable route field, safe AGL, cruise AGL, route pressure, and corridor thinning.
- `powered-aerial-flight-domain-kit` — powered aircraft body, input, speed, boost heat, terrain-relative cruise, and safe-envelope failure.
- `aerial-vegetation-placement-domain-kit` — flight-scale tree descriptors using terrain, biome, slope, LOD, and corridor rules.
- `aerial-procedural-object-domain-kit` — chunk-owned object descriptors for spires, structures, clouds, checkpoints, and collision proxies.
- `aerial-projectile-system-kit` — projectile hot-loop simulation and hit events.
- `aerial-combat-domain-kit` — target health, damage, destruction, and score facts.
- `aerial-encounter-director-kit` — enemy/zeppelin encounter descriptors and target registration.
- `aerial-camera-rig-domain-kit` — camera-drone chase descriptors.
- `aerial-mission-sequence-kit` — authored mission phase, prompt, failure, and victory state.

## Minimal install

```js
import * as NexusEngine from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusEngine@main/src/index.js";
import {
  createCanyonTerrainDomainKit,
  createFlightCorridorDomainKit,
  createPoweredAerialFlightDomainKit,
  createAerialVegetationPlacementDomainKit,
  createAerialProceduralObjectDomainKit,
  createAerialProjectileSystemKit,
  createAerialCombatDomainKit,
  createAerialEncounterDirectorKit,
  createAerialCameraRigDomainKit,
  createAerialMissionSequenceKit,
  collectAerialCanyonSnapshot
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@main/protokits/aerial-canyon-kits/index.js";

const engine = NexusEngine.createRealtimeGame({
  kits: [
    createCanyonTerrainDomainKit(NexusEngine),
    createFlightCorridorDomainKit(NexusEngine),
    createPoweredAerialFlightDomainKit(NexusEngine),
    createAerialVegetationPlacementDomainKit(NexusEngine),
    createAerialProceduralObjectDomainKit(NexusEngine),
    createAerialProjectileSystemKit(NexusEngine),
    createAerialCombatDomainKit(NexusEngine),
    createAerialEncounterDirectorKit(NexusEngine),
    createAerialCameraRigDomainKit(NexusEngine),
    createAerialMissionSequenceKit(NexusEngine)
  ]
});

engine.poweredAerialFlight.setInput({ pitch: 0, roll: 0, yaw: 0, boost: false, fire: false });
engine.tick(1 / 60);

const snapshot = collectAerialCanyonSnapshot(engine);
```

## Renderer boundary

These kits produce serializable state and render descriptors. They do not create DOM nodes, listen to keyboard events, run `requestAnimationFrame`, create Three.js meshes, or mutate renderer objects.

A Three.js host should:

1. map input into `engine.poweredAerialFlight.setInput()`;
2. call `engine.tick(dt)`;
3. read `collectAerialCanyonSnapshot(engine)`;
4. sync Three.js meshes from the snapshot.

## Promotion notes

The generic candidates for later NexusEngine promotion are terrain sampling, flight corridor, powered flight, aerial projectile, aerial combat, camera rig, and vegetation placement. Renderer-specific Three.js pooling should stay as host/adapter code unless it becomes a renderer adapter kit with a clear boundary.
