# Generic Defense Kits

`generic-defense-kits` is a playable vertical-slice ProtoKit bundle for generic defense games.

It is intentionally not a tower-defense-only engine. It provides a reusable 2.5D defense spine that can be themed as tower defense, lane defense, base defense, survival defense, escort defense, or tactics defense.

## Included DSKs

The bundle currently creates these runtime kits from one shared definition set:

```txt
generic-defense-map-kit
generic-defense-economy-kit
generic-defense-structure-kit
generic-defense-agent-wave-kit
generic-defense-combat-kit
generic-defense-session-kit
generic-defense-render-descriptor-kit
```

## What it owns

```txt
path and slot state
vital target state
currency and transactions
placeable structures
structure upgrades
wave spawning
path-following agents
automatic targeting
projectile motion
damage and kill rewards
wave completion
win/loss state
renderer-agnostic descriptors
```

## What it does not own

```txt
DOM
Canvas drawing
Three.js meshes
keyboard listeners
requestAnimationFrame
game-specific art
long tutorial copy
```

A host should map input into `engine.genericDefense` and draw `engine.defenseRender.getSnapshot()`.

Core breach is terminal for the active run: later wave-completion events cannot restore planning state or advance rewards. Hosts recover through `engine.genericDefense.restart()`.

## Import

```js
import * as NexusEngine from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusEngine@main/src/index.js";
import {
  createGenericDefenseKits
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusEngine-ProtoKits@0.0.1/protokits/generic-defense-kits/index.js";

const engine = NexusEngine.createRealtimeGame({
  kits: createGenericDefenseKits(NexusEngine)
});
```

## Public API

```js
engine.genericDefense.startWave({ commandId });
engine.genericDefense.build(slotId, blueprintId, { commandId });
engine.genericDefense.upgrade(structureId, { commandId });
engine.genericDefense.select(id, kind);
engine.genericDefense.cycleBlueprint(1);
engine.genericDefense.restart({ commandId });
engine.genericDefense.getSnapshot();
```

## Idempotency

External durable mutations accept `commandId`.

Duplicate build/upgrade/wave/restart commands are guarded so repeated commands do not double-spend, double-build, or double-start.

## Test

```bash
node protokits/generic-defense-kits/tests/generic-defense-kits.test.mjs
```

## Promotion notes

This bundle is a playable vertical slice. The next promotion step is to split the larger bundle into independently exported atomic DSKs once the host and tests prove the API shape:

```txt
lane-field-kit
path-network-kit
build-slot-kit
blueprint-kit
structure-runtime-kit
agent-wave-kit
target-query-kit
projectile-motion-kit
damage-resolution-kit
vital-target-kit
render-descriptor-kit
```
