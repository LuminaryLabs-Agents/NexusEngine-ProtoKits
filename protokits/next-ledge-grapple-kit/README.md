# Next Ledge Grapple Kit

Experimental NexusRealtime ProtoKit for a vertical grapple-climb game.

## Purpose

`createNextLedgeGrappleKit` owns deterministic gameplay state for Next Ledge Grapple:

- seeded vertical route generation
- rope swing momentum
- falling and launch state
- grapple probe simulation
- cable sweep latch checks
- reel-in and rest-anchor recovery
- stamina, failure, completion, restart, and sector progression
- renderer-independent snapshots

The kit does **not** own DOM, Canvas, Three.js, Web Audio, keyboard listeners, pointer listeners, `requestAnimationFrame`, or HUD layout.

## Import

```js
import * as NexusRealtime from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Dev/NexusRealtime@main/src/index.js";
import {
  createNextLedgeGrappleKit,
  createDefaultNextLedgeGrappleLevel
} from "https://cdn.jsdelivr.net/gh/LuminaryLabs-Agents/NexusRealtime-ProtoKits@main/protokits/next-ledge-grapple-kit/index.js";
```

## Install

```js
const level = createDefaultNextLedgeGrappleLevel({ seed: "demo" });
const engine = NexusRealtime.createRealtimeGame({
  kits: [createNextLedgeGrappleKit(NexusRealtime, { level })]
});
```

## Public engine API

```js
engine.nextLedgeGrapple.action();
engine.nextLedgeGrapple.setAimVector(x, y);
engine.nextLedgeGrapple.setAimPoint(x, y);
engine.nextLedgeGrapple.swingAxis(axis);
engine.nextLedgeGrapple.restart();
engine.nextLedgeGrapple.advanceSector();
engine.nextLedgeGrapple.getState();
engine.nextLedgeGrapple.getSnapshot();
```

## Resources

- `nextLedgeGrapple.state` — durable game state, including mode, player, probe, route, stamina, stats, and cached snapshot.

## Events

- `nextLedgeGrapple.action`
- `nextLedgeGrapple.aim`
- `nextLedgeGrapple.axis`
- `nextLedgeGrapple.restart`
- `nextLedgeGrapple.advanceSector`
- `nextLedgeGrapple.cue`

## Config

```js
{
  seed: "next-ledge-grapple",
  sector: 1,
  ropeLength: 52,
  maxCableLength: 150,
  staminaMax: 100,
  boundary: 166,
  gravity: 54,
  launchSpeed: 560,
  summitBase: 2200,
  summitStep: 700
}
```

## Snapshot contract

`getSnapshot()` returns a renderer-safe object:

```js
{
  mode,
  status,
  sector,
  stamina,
  height,
  ledges,
  player,
  probe,
  aim,
  rope,
  camera,
  recentCue,
  stats
}
```

## Promotion notes

This is intentionally game-branded while it is being proven. Promotion should split the stable generic behavior into smaller kits such as momentum swing, grapple projectile, vertical route, stamina, and vertical progression kits.
