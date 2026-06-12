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

Registry:

```txt
protokits/blackwake-kit-registry/index.js
```

Game wrappers:

```txt
protokits/blackwake-game-isles/index.js
protokits/blackwake-game-stormline-rescue/index.js
```

Composition demo:

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
  blackwake-game-isles/
    index.js
    demo.html
  blackwake-game-stormline-rescue/
    index.js
```
