# Quaternius Terrain Walker Kit

`quaternius-terrain-walker-kit` is a composite ProtoKit packet for proving a Quaternius-friendly humanoid character can load semantic animation descriptors, walk over terrain, publish third-person camera descriptors, and stay renderer-agnostic.

This kit follows the NexusRealtime / ProtoKits rule that reusable domain behavior stays in kits while DOM, Canvas, Three.js, GLTFLoader, pointer-lock, and visual debugging remain in host routes or adapter bridges.

## Domain

```txt
quaternius-terrain-walker
├─ source/import descriptors
├─ humanoid rig descriptors
├─ animation bank descriptors
├─ skeleton binding descriptors
├─ third-person locomotion state
├─ terrain contact state
├─ camera follow descriptors
└─ host/debug bridge descriptors
```

## Why this exists

The target asset ecosystem is:

```txt
Quaternius Universal Base Characters
+ Quaternius Universal Animation Library 1
+ Quaternius Universal Animation Library 2
```

The kit does not download or hotlink those assets. It defines the reusable runtime and validation surfaces that a host/import worker can use after assets are imported, hashed, normalized, reviewed, and promoted to runtime-safe paths.

## Exported composite APIs

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createQuaterniusTerrainWalkerKitSuite,
  createQuaterniusTerrainWalkerKit
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/quaternius-terrain-walker-kit/index.js";

const engine = NexusRealtime.createRealtimeGame({
  kits: createQuaterniusTerrainWalkerKitSuite(NexusRealtime)
});

engine.n.quaterniusTerrainWalker.registerSource({
  id: "quaternius-universal-animation-library",
  kind: "quaternius-pack",
  license: "CC0"
});

engine.n.quaterniusTerrainWalker.registerAnimation({ id: "idle", semantic: "idle" });
engine.n.quaterniusTerrainWalker.registerAnimation({ id: "walk", semantic: "walk" });
engine.n.quaterniusTerrainWalker.registerAnimation({ id: "run", semantic: "run" });
engine.n.quaterniusTerrainWalker.setInput({ moveZ: 1 });
engine.n.quaterniusTerrainWalker.step({}, 1 / 60);

console.log(engine.n.quaterniusTerrainWalker.snapshot());
```

## Kit graph included

The packet includes descriptor/factory exports for the full kit web from the Quaternius terrain walker plan, including import/provenance, humanoid rig, animation-bank, retarget validation, third-person locomotion, terrain contact, camera, spawn, reset, and host/debug bridge domains.

`terrain-sampler-kit` is reused from the existing ProtoKits terrain domain instead of duplicated.

## Runtime surface

The composite installs:

```txt
engine.n.quaterniusTerrainWalker
engine.quaterniusTerrainWalker
```

Primary methods:

```txt
snapshot()
getKitGraph()
registerSource(source)
registerCharacter(character)
registerAnimation(animation)
setInput(input)
step(input, dt)
reset()
validate()
```

## Validation expectations

The first proof is intentionally small:

```txt
install kit suite
register Quaternius source manifest
register idle/walk/run semantic clips
step terrain walker with movement input
prove actor remains grounded
prove locomotion changes from idle to walk/run
prove snapshot is serializable
```

## Host boundary

A browser/Three.js file may import this kit over CDN and render a terrain walker, but the reusable ProtoKit must not own:

```txt
DOM
Canvas
Three.js
WebGL
GLTFLoader
pointer lock
asset fetching
localStorage
unseeded randomness
```

Those belong in the host example or a clearly named adapter bridge.
