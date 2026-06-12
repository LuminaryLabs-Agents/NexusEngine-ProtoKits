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

## Zombie Orchard ProtoKits

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createZombieOrchardProtoKits,
  createSurvivalRoundKit,
  createHordeDirectorKit,
  createOrchardBiomeKit,
  createFoundWeaponKit,
  createMonsterRosterKit
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/zombie-orchard/index.js";

const kits = createZombieOrchardProtoKits(NexusRealtime, {
  survivalRounds: { bossEvery: 5 },
  orchardBiome: { seed: "zombie-orchard-v1" }
});
```

Zombie Orchard is a kit-composed survival game prototype. The game should only compose kits, define content, feed input, read snapshots, and render descriptors. The kits own round logic, horde pressure, orchard biome descriptors, found weapons, and monster archetypes.

Docs:

```txt
protokits/zombie-orchard/README.md
```

## Structure

```txt
protokits/
  ocean-boat-kit/
    index.js
    demo.html
    README.md
  survival-round-kit/
    index.js
  horde-director-kit/
    index.js
  orchard-biome-kit/
    index.js
  found-weapon-kit/
    index.js
  monster-roster-kit/
    index.js
  zombie-orchard/
    index.js
    README.md
```
