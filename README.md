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

## Blackwake Hierarchical ProtoKits

Blackwake is organized as compositional ProtoKits only. There is no ProtoKits `core/` folder. NexusRealtime owns runtime, ECS, scheduler, surfaces, and sequences. ProtoKits own all game-facing composition.

```txt
atomic ProtoKits
  -> domain ProtoKits
    -> mode ProtoKits
      -> game ProtoKits
        -> tiny HTML launcher
```

Top-level app import:

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";

import {
  createBlackwakeIslesGame
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/blackwake-game-isles/index.js";

const game = createBlackwakeIslesGame(NexusRealtime, {
  canvas: document.getElementById("game"),
  seed: "public-demo-001",
  quality: "auto"
});

game.start();
```

### Playable Blackwake runtime

`protokits/blackwake-gameplay/index.js` now contains the first playable vertical-slice runtime. It still composes the hierarchical ProtoKit registry, then appends a real NexusRealtime gameplay runtime kit that owns state, events, and the simulation system.

Current gameplay includes:

- deterministic procedural islands from a seed
- ports, wrecks, reefs, currents, waves, storm escalation, and lightning
- sailing with wind angle, sail trim, rudder handling, anchor, reef damage, and wake
- deck / helm / swim / dive player modes
- underwater oxygen, bubbles, salvage, and cargo carry-back
- selling salvage at ports
- ship upgrades for sails, hull, rudder, and diving gear
- chase, map, and first-person-ish camera modes
- generated HUD and objective tracker from the ProtoKit runtime

Controls:

```txt
WASD / arrows  sail, steer, swim
Shift          boost / dive
Space          anchor / surface
F              leave helm / jump overboard
E or P         interact / port sell
1-4            buy upgrades at port
C              camera mode
M              map
R              reset run
```

Registry:

```txt
protokits/blackwake-kit-registry/index.js
```

Game wrappers:

```txt
protokits/blackwake-game-isles/index.js
protokits/blackwake-game-stormline-rescue/index.js
```

Playable demo:

```txt
protokits/blackwake-game-isles/demo.html
```

## Structure

```txt
protokits/
  ocean-boat-kit/
    index.js
    demo.html
    README.md
  blackwake-kit-registry/
    index.js
    README.md
  blackwake-gameplay/
    index.js
  blackwake-game-isles/
    index.js
    demo.html
  blackwake-game-stormline-rescue/
    index.js
```
