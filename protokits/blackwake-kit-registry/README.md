# Blackwake ProtoKit Registry

This registry turns the full Blackwake pirate exploration plan into compositional NexusRealtime ProtoKits.

There is intentionally no `core/` folder here. NexusRealtime owns the runtime, ECS, scheduler, surfaces, and sequence runtime. ProtoKits own composition.

## Layers

```txt
atomic ProtoKits
  -> domain ProtoKits
    -> mode ProtoKits
      -> game ProtoKits
        -> tiny HTML launcher
```

Every higher-order layer is also a ProtoKit.

## Main import

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

## What exists now

- atomic ProtoKit definitions for ocean, water shading, weather, rendering, islands, underwater, ships, player embodiment, camera, interaction, economy, quests, ports, audio, UI, debug, and performance
- domain ProtoKits that import atomic ProtoKits
- mode ProtoKits that import domain ProtoKits
- game ProtoKits that import mode ProtoKits
- dependency expansion through `imports`
- NexusRealtime RuntimeKit generation through `defineRuntimeKit`
- top-level factories for Blackwake Isles and Stormline Rescue

The current generated RuntimeKits are scaffolds. The next patches should replace scaffold bindings with real atomic systems, resources, events, shaders, materials, and sequence graphs while keeping the same composition hierarchy.
