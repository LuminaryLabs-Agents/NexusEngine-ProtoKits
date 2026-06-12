# Blackwake Gameplay ProtoKit

Playable vertical-slice gameplay for Blackwake Isles.

This module keeps the HTML launcher tiny while moving gameplay into a ProtoKit-owned runtime.

## Features

- deterministic procedural islands from seed
- ports, wrecks, reefs, currents, waves, storm escalation, and lightning
- sailing with wind angle, sail trim, rudder handling, anchor, reef damage, and wake
- deck / helm / swim / dive player modes
- underwater oxygen, bubbles, salvage, and cargo carry-back
- selling salvage at ports
- ship upgrades for sails, hull, rudder, and diving gear
- chase, map, and first-person-ish camera modes
- generated HUD and objective tracker
- appends a real NexusRealtime runtime kit with resources, events, bindings, and a `simulate` system

## Import

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import { createBlackwakeIslesGame } from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/blackwake-game-isles/index.js";

createBlackwakeIslesGame(NexusRealtime, {
  canvas: document.getElementById("game"),
  seed: "public-demo-001"
}).start();
```

## Controls

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
