# Next Ledge Kit

Composable cinematic grapple-climb rules for NexusRealtime games.

`next-ledge-kit` now owns the reusable gameplay that was previously trapped inside the single-file **Next Ledge — Playable Cinematic Engine** prototype: deterministic ledge generation, sector progression, stamina, rope state, swing/release/fire/reel/fall modes, grapple latching, route completion, render snapshots, camera state, trajectory prediction, and small gameplay effect descriptors.

The browser Experiment owns only the supportive host work: HTML, input listeners, Three.js mesh sync, audio playback, HUD text binding, error panel, and `requestAnimationFrame`.

## Import

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createNextLedgeKit,
  createProceduralNextLedgeLevel
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/next-ledge-kit/cinematic-ascent-kit.js";
```

## Install

```js
const level = createProceduralNextLedgeLevel({ seed: "summit-recovery-protocol" });

const engine = NexusRealtime.createRealtimeGame({
  kits: [
    createNextLedgeKit(NexusRealtime, { level })
  ]
});
```

## Public Engine API

```js
engine.nextLedge.action();            // mode-scoped action: release, fire, retract, or cancel
engine.nextLedge.choose(targetId);    // aim/choose a ledge target; fires if currently falling
engine.nextLedge.setAimVector(dx, dy);
engine.nextLedge.setAimWorld(x, y);
engine.nextLedge.swingAxis(-1);       // A / left
engine.nextLedge.swingAxis(1);        // D / right
engine.nextLedge.swingAxis(0);        // released
engine.nextLedge.hover(targetId);
engine.nextLedge.restart();
engine.nextLedge.advanceSector();
engine.nextLedge.pause(true);
engine.nextLedge.getState();
engine.nextLedge.getSnapshot();
engine.nextLedge.getEnabledTargets();
```

## State Modes

```txt
swinging    hanging from a ledge with A/D momentum
falling     free fall; action fires the grapple
launched    grapple probe is flying and cable can sweep-latch
retracting  missed grapple returns to the player
reeling     grapple latched; player is winched to swing radius
dead        fell below sector recovery window
won         summit anchor reached
```

## Resources

```txt
nextLedge.state
```

The state is serializable and renderer-independent. It includes:

```txt
sector
mode
stamina
route.ledges
route.chunks
player
probe
rope.nodes
trajectory
camera
effects.trail
effects.sparks
enabledTargetIds
recentEvents
stats
status
```

## Events

Commands:

```txt
nextLedge.action
nextLedge.choose
nextLedge.aim
nextLedge.swingAxis
nextLedge.hover
nextLedge.restart
nextLedge.advanceSector
nextLedge.pause
```

Facts emitted by the kit:

```txt
nextLedge.grappleFired
nextLedge.grappleLatched
nextLedge.restored
nextLedge.failed
nextLedge.summitReached
nextLedge.sectorAdvanced
```

## Config

```js
createNextLedgeKit(NexusRealtime, {
  level,
  seed: "optional-seed",
  sector: 1,
  staminaMax: 100,
  gravityBase: 0.052,
  gravityPerSector: 0.003,
  windPerSector: 0.006,
  ropeLength: 52,
  maxCableLength: 150,
  scaffoldBoundary: 166,
  ropeNodeCount: 12,
  immediate: true
});
```

## Renderer Boundary

The kit does **not** create DOM nodes, Canvas contexts, Three.js meshes, `AudioContext`, or keyboard listeners. Hosts should read `engine.nextLedge.getSnapshot()` and render the snapshot.

## Experiment Host

The validation app lives in:

```txt
NexusRealtime-Experiments/experiments/next-ledge/
```

It imports this ProtoKit and keeps the browser code thin.

## Promotion Criteria

Before promotion, split this branded ProtoKit into generic stable kits:

```txt
createProceduralLedgeRouteKit
createMomentumSwingKit
createGrappleTraversalKit
createStaminaKit
createVerticalSectorProgressionKit
createClimbRecoveryFailStateKit
```

Promote only after:

```txt
headless tests exist
multi-configuration validation passes
state/event names are frozen
renderer boundary stays clean
sequence hooks are proven by at least one Experiment
```

## Version

Current prototype version: `0.2.0`.
