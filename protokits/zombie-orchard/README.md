# Zombie Orchard ProtoKits

These kits are the prototype gameplay layer for **Zombie Orchard**.

The game should not contain a custom engine. The game should only:

```txt
compose kits
define content
feed input
read snapshots
render descriptors
```

## CDN usage

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createZombieOrchardProtoKits
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/zombie-orchard/index.js";

const game = NexusRealtime.createRealtimeGame({
  kits: createZombieOrchardProtoKits(NexusRealtime, {
    survivalRounds: {
      baseSpawnBudget: 12,
      bossEvery: 5
    },
    orchardBiome: {
      seed: "zombie-orchard-v1",
      seasonalVariant: "blood-harvest"
    }
  })
});
```

## Kits

### `createSurvivalRoundKit`

Owns wave progression:

- round number
- spawn budget
- active enemy cap
- intensity curve
- breathing room between rounds
- elite wave flags
- boss wave flags

It emits budget and round events, but it does not spawn entities directly.

### `createHordeDirectorKit`

Owns pressure pacing:

- offscreen spawn requests
- pressure ramps when the player is doing well
- backoff when the player is near death
- near-miss pressure events
- fairness notes when spawns are blocked

It emits `zombie-orchard.horde.spawn-requested` for downstream spawn adapters.

### `createOrchardBiomeKit`

Owns orchard world descriptors:

- tree rows
- apple spawn points
- active apple list
- haunted zones
- fog lanes
- barn landmarks
- fence loops
- seasonal variants
- nav hints for downstream navigation kits

### `createFoundWeaponKit`

Owns scavenged weapons:

- pickup replacement
- weapon inventory
- weapon swapping
- ammo
- durability
- temporary weapons
- breakable melee tools

Input is queued through `engine.zombieOrchard.foundWeapons.feedInput(...)`.

### `createMonsterRosterKit`

Owns enemy archetypes:

- shambler zombie
- runner zombie
- crawler
- scarecrow stalker
- rotting deer
- orchard witch
- apple golem
- fog hound
- boss: The Orchard Keeper

It converts horde spawn requests into full `zombie-orchard.monster.spawn-requested` descriptors.

## Composition order

The helper returns the intended order:

```txt
survival rounds
orchard biome
monster roster
horde director
found weapons
```

The horde director depends on the round, orchard, and monster roster providers.
